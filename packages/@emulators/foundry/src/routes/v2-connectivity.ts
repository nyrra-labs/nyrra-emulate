import { requireAuth, type RouteContext } from "@emulators/core";
import { getFoundryStore } from "../store.js";
import { foundryRid, hasScope, normalizeFoundryUriScheme } from "../helpers.js";
import { foundryNotFound, foundryPermissionDenied, foundryInvalidRequest } from "../route-helpers.js";

function connectionResponse(conn: {
  rid: string;
  display_name: string;
  parent_folder_rid: string;
  exports_enabled: boolean;
  export_enabled_without_markings_validation: boolean;
  worker_type: "unknownWorker" | "foundryWorker";
  worker_network_egress_policy_rids: string[];
  config_type: "rest";
  config_domains: Array<{ host: string; port?: number; scheme?: "HTTP" | "HTTPS"; auth?: Record<string, unknown> }>;
  config_oauth2_client_rid: string | null;
  secrets: Record<string, string>;
}) {
  return {
    rid: conn.rid,
    displayName: conn.display_name,
    parentFolderRid: conn.parent_folder_rid,
    exportSettings: {
      exportsEnabled: conn.exports_enabled,
      exportEnabledWithoutMarkingsValidation: conn.export_enabled_without_markings_validation,
    },
    worker:
      conn.worker_type === "foundryWorker"
        ? {
            type: "foundryWorker",
            networkEgressPolicyRids: conn.worker_network_egress_policy_rids,
          }
        : { type: "unknownWorker" },
    configuration: configurationResponse(conn),
  };
}

function configurationResponse(conn: {
  config_type: "rest";
  config_domains: Array<{ host: string; port?: number; scheme?: "HTTP" | "HTTPS"; auth?: Record<string, unknown> }>;
  config_oauth2_client_rid: string | null;
  secrets: Record<string, string>;
}) {
  return {
    type: conn.config_type,
    domains: conn.config_domains,
    ...(conn.config_oauth2_client_rid ? { oauth2ClientRid: conn.config_oauth2_client_rid } : {}),
    ...(Object.keys(conn.secrets).length > 0
      ? {
          additionalSecrets: {
            type: "asSecretsNames",
            secretNames: Object.keys(conn.secrets).sort(),
          },
        }
      : {}),
  };
}

export function v2ConnectivityRoutes({ app, store }: RouteContext): void {
  const fs = getFoundryStore(store);

  app.post("/api/v2/connectivity/connections", requireAuth(), async (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:connectivity-connection-write")) {
      return foundryPermissionDenied(c, "CreateConnectionPermissionDenied", "Could not create the Connection.");
    }

    let body: Record<string, unknown>;
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return foundryInvalidRequest(c, "InvalidRequestBody", "The request body is not valid JSON.");
    }

    const displayName = typeof body.displayName === "string" ? body.displayName : "";
    const parentFolderRid = typeof body.parentFolderRid === "string" ? body.parentFolderRid : "";

    if (!displayName) {
      return foundryInvalidRequest(c, "MissingDisplayName", "The displayName parameter is required.");
    }
    if (!parentFolderRid) {
      return foundryInvalidRequest(c, "MissingParentFolderRid", "The parentFolderRid parameter is required.");
    }

    const config = body.configuration as Record<string, unknown> | undefined;
    const rawConfigType = typeof config?.type === "string" ? config.type : "rest";
    if (rawConfigType !== "rest" && rawConfigType !== "restConnectionConfiguration") {
      return foundryInvalidRequest(
        c,
        "ConnectionTypeNotSupported",
        "The specified connection is not yet supported in the Platform API.",
        {
          connectionType: rawConfigType,
        },
      );
    }
    const configDomains = Array.isArray(config?.domains)
      ? (config.domains as Array<Record<string, unknown>>).map((domain) => ({
          host: typeof domain.host === "string" ? domain.host : "",
          ...(typeof domain.port === "number" ? { port: domain.port } : {}),
          ...(normalizeFoundryUriScheme(domain.scheme) ? { scheme: normalizeFoundryUriScheme(domain.scheme) } : {}),
          ...(typeof domain.auth === "object" && domain.auth !== null
            ? { auth: domain.auth as Record<string, unknown> }
            : {}),
        }))
      : [];
    const configOauth2ClientRid = typeof config?.oauth2ClientRid === "string" ? config.oauth2ClientRid : null;
    const worker =
      typeof body.worker === "object" && body.worker !== null ? (body.worker as Record<string, unknown>) : null;
    const workerType = worker?.type === "foundryWorker" ? "foundryWorker" : "unknownWorker";
    const workerNetworkEgressPolicyRids =
      workerType === "foundryWorker" && Array.isArray(worker?.networkEgressPolicyRids)
        ? worker.networkEgressPolicyRids.filter((rid): rid is string => typeof rid === "string")
        : [];

    let initialSecrets: Record<string, string> = {};
    const additionalSecrets = config?.additionalSecrets as Record<string, unknown> | undefined;
    if (
      (additionalSecrets?.type === "asSecretsWithPlaintextValues" ||
        additionalSecrets?.type === "secretsWithPlaintextValues") &&
      typeof additionalSecrets.secrets === "object" &&
      additionalSecrets.secrets !== null
    ) {
      initialSecrets = additionalSecrets.secrets as Record<string, string>;
    }

    const rid = foundryRid("magritte", "source", "");
    const conn = fs.connections.insert({
      rid,
      display_name: displayName,
      parent_folder_rid: parentFolderRid,
      config_type: "rest",
      config_domains: configDomains,
      config_oauth2_client_rid: configOauth2ClientRid,
      worker_type: workerType,
      worker_network_egress_policy_rids: workerNetworkEgressPolicyRids,
      secrets: initialSecrets,
      exports_enabled: false,
      export_enabled_without_markings_validation: false,
    });

    return c.json(connectionResponse(conn));
  });

  app.get("/api/v2/connectivity/connections/:connectionRid", requireAuth(), (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:connectivity-connection-read")) {
      return foundryPermissionDenied(c, "GetConnectionPermissionDenied", "Could not get the Connection.");
    }

    const connectionRid = c.req.param("connectionRid") ?? "";
    const conn = fs.connections.findOneBy("rid", connectionRid);
    if (!conn) {
      return foundryNotFound(c, "ConnectionNotFound", "The given Connection could not be found.", {
        connectionRid,
      });
    }

    return c.json(connectionResponse(conn));
  });

  app.get("/api/v2/connectivity/connections/:connectionRid/getConfiguration", requireAuth(), (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:connectivity-connection-read")) {
      return foundryPermissionDenied(
        c,
        "GetConfigurationPermissionDenied",
        "Could not getConfiguration the Connection.",
        { connectionRid: c.req.param("connectionRid") ?? "" },
      );
    }

    const connectionRid = c.req.param("connectionRid") ?? "";
    const conn = fs.connections.findOneBy("rid", connectionRid);
    if (!conn) {
      return foundryNotFound(c, "ConnectionNotFound", "The given Connection could not be found.", {
        connectionRid,
      });
    }

    return c.json(configurationResponse(conn));
  });

  app.post("/api/v2/connectivity/connections/:connectionRid/updateSecrets", requireAuth(), async (c) => {
    const authScopes = c.get("authScopes");

    if (!hasScope(authScopes, "api:connectivity-connection-write")) {
      return foundryPermissionDenied(
        c,
        "UpdateSecretsForConnectionPermissionDenied",
        "Could not update secrets for the Connection.",
        { connectionRid: c.req.param("connectionRid") ?? "" },
      );
    }

    const connectionRid = c.req.param("connectionRid") ?? "";
    const conn = fs.connections.findOneBy("rid", connectionRid);
    if (!conn) {
      return foundryNotFound(c, "ConnectionNotFound", "The given Connection could not be found.", {
        connectionRid,
      });
    }

    let body: Record<string, unknown>;
    try {
      body = (await c.req.json()) as Record<string, unknown>;
    } catch {
      return foundryInvalidRequest(c, "InvalidRequestBody", "The request body is not valid JSON.");
    }

    const secrets =
      typeof body.secrets === "object" && body.secrets !== null ? (body.secrets as Record<string, string>) : {};
    fs.connections.update(conn.id, {
      secrets: { ...conn.secrets, ...secrets },
    });

    return c.body(null, 204);
  });
}
