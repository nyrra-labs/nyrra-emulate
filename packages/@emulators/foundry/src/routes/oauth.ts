import { createHash, randomBytes } from "crypto";
import type { Store, RouteContext } from "@emulators/core";
import {
  bodyStr,
  constantTimeSecretEqual,
  debug,
  escapeHtml,
  matchesRedirectUri,
  renderCardPage,
  renderErrorPage,
  renderUserButton,
} from "@emulators/core";
import type { FoundryOAuthClient, FoundryOAuthGrantType, FoundryUser } from "../entities.js";
import { getFoundryStore } from "../store.js";
import {
  DEFAULT_REALM,
  foundryId,
  foundryUserId,
  grantAllowed,
  hasScope,
  joinScopes,
  resolveRedirectUri,
  scopesAllowed,
  splitScopes,
} from "../helpers.js";
import { foundryOauthError } from "../route-helpers.js";

type PendingCode = {
  username: string;
  scope: string;
  redirectUri: string;
  clientId: string;
  codeChallenge: string | null;
  codeChallengeMethod: string | null;
  created_at: number;
};

type StoredRefreshToken = {
  username: string;
  clientId: string;
  scope: string;
};

const PENDING_CODE_TTL_MS = 10 * 60 * 1000;
const SERVICE_LABEL = "Foundry";

function getPendingCodes(store: Store): Map<string, PendingCode> {
  let map = store.getData<Map<string, PendingCode>>("foundry.oauth.pendingCodes");
  if (!map) {
    map = new Map();
    store.setData("foundry.oauth.pendingCodes", map);
  }
  return map;
}

function getRefreshTokens(store: Store): Map<string, StoredRefreshToken> {
  let map = store.getData<Map<string, StoredRefreshToken>>("foundry.oauth.refreshTokens");
  if (!map) {
    map = new Map();
    store.setData("foundry.oauth.refreshTokens", map);
  }
  return map;
}

function isPendingCodeExpired(code: PendingCode): boolean {
  return Date.now() - code.created_at > PENDING_CODE_TTL_MS;
}

function findClient(
  storeClient: ReturnType<typeof getFoundryStore>["oauthClients"],
  clientId: string,
): FoundryOAuthClient | null {
  if (!clientId) return null;
  return storeClient.findOneBy("client_id", clientId) ?? null;
}

function requiresClientValidation(fs: ReturnType<typeof getFoundryStore>): boolean {
  return fs.oauthClients.all().length > 0;
}

function resolveClient(
  fs: ReturnType<typeof getFoundryStore>,
  clientId: string,
  grantType?: FoundryOAuthGrantType,
): FoundryOAuthClient | null {
  if (!requiresClientValidation(fs)) return null;
  const client = findClient(fs.oauthClients, clientId);
  if (!client) return null;
  if (grantType && !grantAllowed(client, grantType)) return null;
  return client;
}

function renderOauthError(title: string, message: string): string {
  return renderErrorPage(title, message, SERVICE_LABEL);
}

function ensureServiceUser(
  fs: ReturnType<typeof getFoundryStore>,
  clientId: string,
  clientName: string,
): FoundryUser {
  const existing = fs.users.findOneBy("username", clientId);
  if (existing) return existing;

  return fs.users.insert({
    user_id: foundryUserId(),
    username: clientId,
    display_name: clientName,
    email: null,
    given_name: null,
    family_name: null,
    realm: DEFAULT_REALM,
    organization_rid: null,
    principal_type: "service",
    active: true,
    oauth_client_id: clientId,
    attributes: {},
  });
}

export function oauthRoutes({ app, store, tokenMap }: RouteContext): void {
  const fs = getFoundryStore(store);

  app.get("/multipass/api/oauth2/authorize", (c) => {
    const response_type = c.req.query("response_type") ?? "";
    const client_id = c.req.query("client_id") ?? "";
    const requestedRedirectUri = c.req.query("redirect_uri") ?? "";
    const scope = c.req.query("scope") ?? "";
    const state = c.req.query("state") ?? "";
    const code_challenge = c.req.query("code_challenge") ?? "";
    const code_challenge_method = c.req.query("code_challenge_method") ?? "";

    if (!client_id) {
      return c.html(renderOauthError("Invalid request", "The client_id parameter is required."), 400);
    }
    if (response_type !== "code") {
      return c.html(renderOauthError("Unsupported response type", "Foundry only supports response_type=code."), 400);
    }

    const client = resolveClient(fs, client_id, "authorization_code");
    if (requiresClientValidation(fs) && !client) {
      return c.html(renderOauthError("Application not found", `The client_id '${client_id}' is not registered.`), 400);
    }

    const redirectUri = resolveRedirectUri(client, requestedRedirectUri);
    if (!redirectUri) {
      return c.html(renderOauthError("Invalid request", "The redirect_uri parameter is required."), 400);
    }
    if (client && !matchesRedirectUri(redirectUri, client.redirect_uris)) {
      return c.html(renderOauthError("Redirect URI mismatch", "The redirect_uri is not registered for this application."), 400);
    }

    const requestedScopes = splitScopes(scope);
    if (!scopesAllowed(client, requestedScopes)) {
      return c.html(renderOauthError("Invalid scope", "The requested scope is invalid, unknown, or malformed."), 400);
    }

    const subtitleText = client
      ? `Authorize <strong>${escapeHtml(client.name)}</strong> to access your Foundry account.`
      : "Choose a seeded user to continue.";

    const users = fs.users.all().filter((user) => user.principal_type === "human" && user.active);
    const userButtons = users
      .map((user) =>
        renderUserButton({
          letter: (user.username[0] ?? "?").toUpperCase(),
          login: user.username,
          name: user.display_name,
          email: user.email ?? undefined,
          formAction: "/multipass/api/oauth2/authorize/callback",
          hiddenFields: {
            username: user.username,
            redirect_uri: redirectUri,
            scope,
            state,
            client_id,
            code_challenge,
            code_challenge_method,
          },
        }),
      )
      .join("\n");

    const body = users.length === 0
      ? '<p class="empty">No users in the emulator store.</p>'
      : userButtons;

    return c.html(renderCardPage("Sign in to Foundry", subtitleText, body, SERVICE_LABEL));
  });

  app.post("/multipass/api/oauth2/authorize/callback", async (c) => {
    const body = await c.req.parseBody();
    const username = bodyStr(body.username);
    const client_id = bodyStr(body.client_id);
    const requestedRedirectUri = bodyStr(body.redirect_uri);
    const scope = bodyStr(body.scope);
    const state = bodyStr(body.state);
    const code_challenge = bodyStr(body.code_challenge);
    const code_challenge_method = bodyStr(body.code_challenge_method);

    if (!client_id) {
      return c.html(renderOauthError("Invalid request", "The client_id parameter is required."), 400);
    }

    const client = resolveClient(fs, client_id, "authorization_code");
    if (requiresClientValidation(fs) && !client) {
      return c.html(renderOauthError("Application not found", `The client_id '${client_id}' is not registered.`), 400);
    }

    const redirectUri = resolveRedirectUri(client, requestedRedirectUri);
    if (!redirectUri) {
      return c.html(renderOauthError("Invalid request", "The redirect_uri parameter is required."), 400);
    }
    if (client && !matchesRedirectUri(redirectUri, client.redirect_uris)) {
      return c.html(renderOauthError("Redirect URI mismatch", "The redirect_uri is not registered for this application."), 400);
    }

    const requestedScopes = splitScopes(scope);
    if (!scopesAllowed(client, requestedScopes)) {
      return c.html(renderOauthError("Invalid scope", "The requested scope is invalid, unknown, or malformed."), 400);
    }

    const user = fs.users.findOneBy("username", username as FoundryUser["username"]);
    if (!user || user.principal_type !== "human" || !user.active) {
      return c.html(renderOauthError("User not found", "The selected Foundry user is not available."), 400);
    }

    const code = randomBytes(20).toString("hex");
    getPendingCodes(store).set(code, {
      username: user.username,
      scope,
      redirectUri,
      clientId: client_id,
      codeChallenge: code_challenge || null,
      codeChallengeMethod: code_challenge_method || null,
      created_at: Date.now(),
    });

    debug("foundry.oauth", `[Foundry callback] code=${code.slice(0, 8)}... user=${user.username}`);

    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);

    return c.redirect(url.toString(), 302);
  });

  app.post("/multipass/api/oauth2/token", async (c) => {
    const contentType = c.req.header("Content-Type") ?? "";
    if (!contentType.includes("application/x-www-form-urlencoded")) {
      return foundryOauthError(c, 400, "invalid_request", "Content-Type must be application/x-www-form-urlencoded.");
    }

    const body = Object.fromEntries(new URLSearchParams(await c.req.text()));

    const grant_type = typeof body.grant_type === "string" ? body.grant_type : "";
    const client_id = typeof body.client_id === "string" ? body.client_id : "";
    const client_secret = typeof body.client_secret === "string" ? body.client_secret : "";
    const scope = typeof body.scope === "string" ? body.scope : "";

    if (!client_id) {
      return foundryOauthError(c, 400, "invalid_request", "The client_id parameter is required.");
    }

    if (grant_type === "authorization_code") {
      const code = typeof body.code === "string" ? body.code : "";
      const redirect_uri = typeof body.redirect_uri === "string" ? body.redirect_uri : "";
      const code_verifier = typeof body.code_verifier === "string" ? body.code_verifier : undefined;
      if (!code) {
        return foundryOauthError(c, 400, "invalid_request", "The code parameter is required.");
      }

      const client = resolveClient(fs, client_id, "authorization_code");
      if (requiresClientValidation(fs) && !client) {
        return foundryOauthError(c, 401, "invalid_client", "The client_id is incorrect.");
      }
      if (client && client_secret && !constantTimeSecretEqual(client_secret, client.client_secret)) {
        return foundryOauthError(c, 401, "invalid_client", "The client_secret is incorrect.");
      }

      const pendingCodes = getPendingCodes(store);
      const pending = pendingCodes.get(code);
      if (!pending) {
        return foundryOauthError(c, 400, "invalid_grant", "The code passed is incorrect or expired.");
      }
      if (isPendingCodeExpired(pending)) {
        pendingCodes.delete(code);
        return foundryOauthError(c, 400, "invalid_grant", "The code passed is incorrect or expired.");
      }
      if (pending.clientId !== client_id) {
        pendingCodes.delete(code);
        return foundryOauthError(c, 400, "invalid_grant", "The code passed is incorrect or expired.");
      }
      if (pending.redirectUri && redirect_uri && pending.redirectUri !== redirect_uri) {
        pendingCodes.delete(code);
        return foundryOauthError(c, 400, "invalid_grant", "The redirect_uri does not match the one used during authorization.");
      }

      if (pending.codeChallenge != null) {
        if (code_verifier === undefined) {
          return foundryOauthError(c, 400, "invalid_grant", "PKCE verification failed.");
        }
        const method = (pending.codeChallengeMethod ?? "plain").toLowerCase();
        if (method === "s256") {
          const expected = createHash("sha256").update(code_verifier).digest("base64url");
          if (expected !== pending.codeChallenge) {
            return foundryOauthError(c, 400, "invalid_grant", "PKCE verification failed.");
          }
        } else if (method === "plain") {
          if (code_verifier !== pending.codeChallenge) {
            return foundryOauthError(c, 400, "invalid_grant", "PKCE verification failed.");
          }
        } else {
          return foundryOauthError(c, 400, "invalid_grant", "PKCE verification failed.");
        }
      }

      pendingCodes.delete(code);

      const user = fs.users.findOneBy("username", pending.username as FoundryUser["username"]);
      if (!user || !user.active) {
        return foundryOauthError(c, 400, "invalid_grant", "The user associated with this code was not found.");
      }

      const accessToken = foundryId("foundry");
      const scopes = splitScopes(pending.scope);
      if (tokenMap) {
        tokenMap.set(accessToken, { login: user.username, id: user.id, scopes });
      }

      const response: Record<string, unknown> = {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
      };

      if (hasScope(scopes, "offline_access")) {
        const refreshToken = foundryId("foundry_refresh");
        getRefreshTokens(store).set(refreshToken, {
          username: user.username,
          clientId: pending.clientId,
          scope: pending.scope,
        });
        response.refresh_token = refreshToken;
      }

      return c.json(response);
    }

    if (grant_type === "refresh_token") {
      const refresh_token = typeof body.refresh_token === "string" ? body.refresh_token : "";
      if (!refresh_token) {
        return foundryOauthError(c, 400, "invalid_request", "The refresh_token parameter is required.");
      }

      const client = resolveClient(fs, client_id, "refresh_token");
      if (requiresClientValidation(fs) && !client) {
        return foundryOauthError(c, 401, "invalid_client", "The client_id is incorrect.");
      }
      if (client && client_secret && !constantTimeSecretEqual(client_secret, client.client_secret)) {
        return foundryOauthError(c, 401, "invalid_client", "The client_secret is incorrect.");
      }

      const refreshTokens = getRefreshTokens(store);
      const record = refreshTokens.get(refresh_token);
      if (!record || record.clientId !== client_id) {
        return foundryOauthError(c, 400, "invalid_grant", "The refresh_token is invalid.");
      }

      const user = fs.users.findOneBy("username", record.username as FoundryUser["username"]);
      if (!user || !user.active) {
        return foundryOauthError(c, 400, "invalid_grant", "The refresh_token is invalid.");
      }

      const accessToken = foundryId("foundry");
      const scopes = splitScopes(record.scope);
      if (tokenMap) {
        tokenMap.set(accessToken, { login: user.username, id: user.id, scopes });
      }

      const newRefreshToken = foundryId("foundry_refresh");
      refreshTokens.delete(refresh_token);
      refreshTokens.set(newRefreshToken, {
        username: user.username,
        clientId: record.clientId,
        scope: record.scope,
      });

      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: newRefreshToken,
      });
    }

    if (grant_type === "client_credentials") {
      const requestedScopes = splitScopes(scope);
      const client = resolveClient(fs, client_id, "client_credentials");
      if (requiresClientValidation(fs) && !client) {
        return foundryOauthError(c, 401, "invalid_client", "The client_id is incorrect.");
      }
      if ((requiresClientValidation(fs) || client_secret) && !client_secret) {
        return foundryOauthError(c, 400, "invalid_request", "The client_secret parameter is required.");
      }
      if (client && !constantTimeSecretEqual(client_secret, client.client_secret)) {
        return foundryOauthError(c, 401, "invalid_client", "The client_secret is incorrect.");
      }
      if (!scopesAllowed(client, requestedScopes)) {
        return foundryOauthError(c, 400, "invalid_scope", "The requested scope is invalid, unknown, or malformed.");
      }

      const serviceUser = ensureServiceUser(fs, client_id, client?.name ?? client_id);
      const accessToken = foundryId("foundry");
      if (tokenMap) {
        tokenMap.set(accessToken, { login: serviceUser.username, id: serviceUser.id, scopes: requestedScopes });
      }

      return c.json({
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        ...(requestedScopes.length > 0 ? { scope: joinScopes(requestedScopes) } : {}),
      });
    }

    return foundryOauthError(
      c,
      400,
      "unsupported_grant_type",
      "Only authorization_code, refresh_token, and client_credentials are supported.",
    );
  });
}
