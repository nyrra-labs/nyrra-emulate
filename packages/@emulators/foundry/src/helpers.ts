import { randomBytes, randomUUID } from "crypto";
import type { FoundryOAuthClient, FoundryUser } from "./entities.js";

export const DEFAULT_REALM = "palantir-internal-realm";
export const DEFAULT_ORGANIZATION_RID = "ri.organization.main.organization.default";

export function foundryId(prefix: string): string {
  return `${prefix}_${randomBytes(20).toString("base64url")}`;
}

export function foundryUserId(): string {
  return randomUUID();
}

export function splitScopes(scope: string): string[] {
  return scope.trim() ? scope.trim().split(/\s+/).filter(Boolean) : [];
}

export function joinScopes(scopes: string[]): string {
  return scopes.join(" ");
}

export function hasScope(grantedScopes: string[] | undefined, requiredScope: string): boolean {
  return (grantedScopes ?? []).includes(requiredScope);
}

export function resolveRedirectUri(client: FoundryOAuthClient | null, redirectUri: string): string {
  if (redirectUri) return redirectUri;
  return client?.redirect_uris[0] ?? "";
}

export function scopesAllowed(client: FoundryOAuthClient | null, requestedScopes: string[]): boolean {
  if (!client || client.allowed_scopes.length === 0) return true;
  return requestedScopes.every((scope) => client.allowed_scopes.includes(scope));
}

export function grantAllowed(client: FoundryOAuthClient | null, grantType: string): boolean {
  if (!client) return true;
  return client.grant_types.includes(grantType as FoundryOAuthClient["grant_types"][number]);
}

export function currentUserResponse(user: FoundryUser): Record<string, unknown> {
  const reservedAttributes: Record<string, string[]> = {
    "multipass:realm": [user.realm],
  };

  if (user.given_name) reservedAttributes["multipass:givenName"] = [user.given_name];
  if (user.family_name) reservedAttributes["multipass:familyName"] = [user.family_name];
  if (user.email) reservedAttributes["multipass:email:primary"] = [user.email];
  if (user.organization_rid && user.principal_type === "human") {
    reservedAttributes["multipass:organization-rid"] = [user.organization_rid];
  }

  return {
    id: user.user_id,
    username: user.username,
    givenName: user.given_name ?? undefined,
    familyName: user.family_name ?? undefined,
    email: user.email ?? undefined,
    realm: user.realm,
    organization: user.principal_type === "service" ? "" : (user.organization_rid ?? ""),
    status: user.active ? "ACTIVE" : "DELETED",
    attributes: {
      ...reservedAttributes,
      ...user.attributes,
    },
  };
}
