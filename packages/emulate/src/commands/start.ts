import { createServer, type AppKeyResolver, type Store } from "@emulators/core";
import { DEFAULT_SERVICE_NAMES, SERVICE_REGISTRY, SERVICE_NAMES, type ServiceName } from "../registry.js";
import { createAdaptorServer } from "@hono/node-server";
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";
import { parse as parseYaml } from "yaml";
import pc from "picocolors";

declare const PKG_VERSION: string;
const pkg = { version: PKG_VERSION };

export interface StartOptions {
  port: number;
  service?: string;
  seed?: string;
}

interface SeedConfig {
  tokens?: Record<string, { login: string; scopes?: string[] }>;
  [service: string]: unknown;
}

interface LoadResult {
  config: SeedConfig;
  source: string;
}

function loadSeedConfig(seedPath?: string): LoadResult | null {
  if (seedPath) {
    const fullPath = resolve(seedPath);
    if (!existsSync(fullPath)) {
      console.error(`Seed file not found: ${fullPath}`);
      process.exit(1);
    }
    const content = readFileSync(fullPath, "utf-8");
    try {
      const config = fullPath.endsWith(".json") ? JSON.parse(content) : parseYaml(content);
      return { config, source: seedPath };
    } catch (err) {
      console.error(`Failed to parse ${seedPath}: ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  }

  const autoFiles = [
    "emulate.config.yaml",
    "emulate.config.yml",
    "emulate.config.json",
    "service-emulator.config.yaml",
    "service-emulator.config.yml",
    "service-emulator.config.json",
  ];

  for (const file of autoFiles) {
    const fullPath = resolve(file);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, "utf-8");
      try {
        const config = fullPath.endsWith(".json") ? JSON.parse(content) : parseYaml(content);
        return { config, source: file };
      } catch (err) {
        console.error(`Failed to parse ${file}: ${err instanceof Error ? err.message : err}`);
        process.exit(1);
      }
    }
  }

  return null;
}

function inferServicesFromConfig(config: SeedConfig): ServiceName[] | null {
  const found = SERVICE_NAMES.filter((k) => k in config);
  return found.length > 0 ? [...found] : null;
}

type HttpServer = ReturnType<typeof createAdaptorServer>;
type NodeServerFetch = Parameters<typeof createAdaptorServer>[0]["fetch"];

export function buildPortInUseMessage(service: string, port: number, usesCustomPort: boolean): string {
  if (usesCustomPort) {
    return `Port ${port} is already in use for ${service}. Free that port or change ${service}.port in your seed config.`;
  }

  return `Port ${port} is already in use for ${service}. Free that port or choose a different base port with --port.`;
}

async function startHttpServer(
  appFetch: NodeServerFetch,
  port: number,
  service: string,
  usesCustomPort: boolean,
): Promise<HttpServer> {
  return await new Promise((resolve, reject) => {
    const server = createAdaptorServer({ fetch: appFetch });

    const handleListening = () => {
      server.off("error", handleError);
      resolve(server);
    };

    const handleError = (error: NodeJS.ErrnoException) => {
      server.off("listening", handleListening);

      if (error.code === "EADDRINUSE") {
        reject(new Error(buildPortInUseMessage(service, port, usesCustomPort)));
        return;
      }

      reject(new Error(`Failed to start ${service} on port ${port}: ${error.message}`));
    };

    server.once("listening", handleListening);
    server.once("error", handleError);
    server.listen(port);
  });
}

export async function startCommand(options: StartOptions): Promise<void> {
  const { port: basePort } = options;

  const loaded = loadSeedConfig(options.seed);
  const seedConfig = loaded?.config ?? null;
  const configSource = loaded?.source ?? null;

  let services: ServiceName[];
  if (options.service) {
    services = options.service.split(",").map((s) => s.trim()) as ServiceName[];
  } else if (seedConfig) {
    services = inferServicesFromConfig(seedConfig) ?? [...DEFAULT_SERVICE_NAMES];
  } else {
    services = [...DEFAULT_SERVICE_NAMES];
  }

  for (const svc of services) {
    if (!SERVICE_REGISTRY[svc]) {
      console.error(`Unknown service: ${svc}. Available: ${SERVICE_NAMES.join(", ")}`);
      process.exit(1);
    }
  }

  const tokens: Record<string, { login: string; id: number; scopes?: string[] }> = {};
  if (seedConfig?.tokens) {
    let tokenId = 100;
    for (const [token, user] of Object.entries(seedConfig.tokens)) {
      tokens[token] = { login: user.login, id: tokenId++, scopes: user.scopes };
    }
  } else {
    tokens["test_token_admin"] = {
      login: "admin",
      id: 2,
      scopes: ["repo", "user", "admin:org", "admin:repo_hook", "api:admin-read"],
    };
  }

  const serviceUrls: Array<{ name: string; url: string }> = [];
  const stores: Store[] = [];
  const httpServers: HttpServer[] = [];

  try {
    for (let i = 0; i < services.length; i++) {
      const svc = services[i];
      const entry = SERVICE_REGISTRY[svc];
      const loadedSvc = await entry.load();

      const svcSeedConfig = seedConfig?.[svc] as Record<string, unknown> | undefined;
      const usesCustomPort = typeof svcSeedConfig?.port === "number";
      const port = (svcSeedConfig?.port as number | undefined) ?? basePort + i;
      const baseUrl = `http://localhost:${port}`;
      serviceUrls.push({ name: svc, url: baseUrl });

      // eslint-disable-next-line prefer-const -- reassigned after closure captures it
      let cachedResolver: AppKeyResolver | undefined;
      const appKeyResolver: AppKeyResolver | undefined = loadedSvc.createAppKeyResolver
        ? (appId) => cachedResolver!(appId)
        : undefined;

      const fallbackUser = entry.defaultFallback(svcSeedConfig);

      const { app, store } = createServer(loadedSvc.plugin, { port, baseUrl, tokens, appKeyResolver, fallbackUser });
      cachedResolver = loadedSvc.createAppKeyResolver?.(store);
      stores.push(store);

      loadedSvc.plugin.seed?.(store, baseUrl);

      if (svcSeedConfig && loadedSvc.seedFromConfig) {
        loadedSvc.seedFromConfig(store, baseUrl, svcSeedConfig);
      }

      const httpServer = await startHttpServer(app.fetch, port, svc, usesCustomPort);
      httpServers.push(httpServer);
    }
  } catch (error) {
    for (const srv of httpServers) {
      srv.close();
    }
    for (const store of stores) {
      store.reset();
    }

    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }

  printBanner(serviceUrls, tokens, configSource, seedConfig);

  const shutdown = () => {
    console.log(`\n${pc.dim("Shutting down...")}`);
    for (const store of stores) {
      store.reset();
    }
    for (const srv of httpServers) {
      srv.close();
    }
    process.exit(0);
  };
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);
}

function printBanner(
  services: Array<{ name: string; url: string }>,
  tokens: Record<string, { login: string; id: number; scopes?: string[] }>,
  configSource: string | null,
  seedConfig: SeedConfig | null,
): void {
  const lines: string[] = [];
  lines.push("");
  lines.push(`  ${pc.bold("emulate")} ${pc.dim(`v${pkg.version}`)}`);
  lines.push("");

  const maxNameLen = Math.max(...services.map((s) => s.name.length));
  for (const { name, url } of services) {
    lines.push(`  ${pc.cyan(name.padEnd(maxNameLen + 2))}${pc.bold(url)}`);
  }
  lines.push("");

  const tokenEntries = Object.entries(tokens);
  if (tokenEntries.length > 0) {
    lines.push(`  ${pc.dim("Tokens")}`);
    for (const [token, user] of tokenEntries) {
      lines.push(`  ${pc.dim(token)} ${pc.dim("->")} ${user.login}`);
    }
    lines.push("");
  }

  if (configSource) {
    lines.push(`  ${pc.dim("Config:")} ${configSource}`);
  } else {
    lines.push(`  ${pc.dim("Config:")} defaults ${pc.dim("(run")} emulate init ${pc.dim("to customize)")}`);
  }

  const quickStartLines = buildQuickStartLines(services, tokens, seedConfig);
  if (quickStartLines.length > 0) {
    lines.push("");
    lines.push(...quickStartLines);
  }

  lines.push("");

  console.log(lines.join("\n"));
}

export function buildQuickStartLines(
  services: Array<{ name: string; url: string }>,
  tokens: Record<string, { login: string; id: number; scopes?: string[] }>,
  seedConfig: SeedConfig | null,
): string[] {
  const foundry = services.find((service) => service.name === "foundry");
  if (!foundry) return [];

  const foundrySeed = seedConfig?.foundry as
    | {
        oauth_clients?: Array<{
          client_id?: string;
          redirect_uris?: string[];
          allowed_scopes?: string[];
        }>;
      }
    | undefined;
  const firstClient = foundrySeed?.oauth_clients?.[0];
  const clientId = firstClient?.client_id ?? "foundry-local";
  const redirectUri = firstClient?.redirect_uris?.[0] ?? "http://localhost:3000/callback";
  const scope = firstClient?.allowed_scopes?.includes("api:admin-read")
    ? "api:admin-read"
    : (firstClient?.allowed_scopes?.[0] ?? "api:admin-read");
  const tokenEntries = Object.entries(tokens);
  const anyTokenName = tokenEntries[0]?.[0] ?? null;
  const adminReadTokenName =
    tokenEntries.find(([, token]) => (token.scopes ?? []).includes("api:admin-read"))?.[0] ?? null;

  const authorizeUrl = new URL(`${foundry.url}/multipass/api/oauth2/authorize`);
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("scope", scope);

  const lines = [`  ${pc.dim("Quick start")}`, `  ${pc.dim("authorize")} ${authorizeUrl.toString()}`];

  if (anyTokenName) {
    lines.push(`  ${pc.dim("me")} curl -H \"Authorization: Bearer ${anyTokenName}\" ${foundry.url}/multipass/api/me`);
  }

  if (adminReadTokenName) {
    lines.push(
      `  ${pc.dim("current user")} curl -H \"Authorization: Bearer ${adminReadTokenName}\" ${foundry.url}/api/v2/admin/users/getCurrent`,
    );
  } else {
    lines.push(
      `  ${pc.dim("current user")} requires a token with api:admin-read. Use the authorize URL above or add one in your seed config.`,
    );
  }

  return lines;
}
