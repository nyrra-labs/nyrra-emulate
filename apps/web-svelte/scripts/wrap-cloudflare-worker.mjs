import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUTPUT_DIR = resolve(SCRIPT_DIR, "../.svelte-kit/cloudflare");
const GENERATED_WORKER = "_worker.js";
const SVELTE_WORKER = "_svelte-worker.js";
const WWW_HOSTNAME = "www.foundryci.com";
const CANONICAL_ORIGIN = "https://foundryci.com";

export function renderWorkerWrapper() {
  return `import svelteWorker from "./${SVELTE_WORKER}";

const WWW_HOSTNAME = "${WWW_HOSTNAME}";
const CANONICAL_ORIGIN = "${CANONICAL_ORIGIN}";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.hostname.toLowerCase() === WWW_HOSTNAME) {
      return new Response(null, {
        status: 308,
        headers: {
          location: CANONICAL_ORIGIN + url.pathname + url.search,
        },
      });
    }

    return svelteWorker.fetch(request, env, ctx);
  },
};
`;
}

export function wrapCloudflareWorker(outputDir = DEFAULT_OUTPUT_DIR) {
  const workerPath = resolve(outputDir, GENERATED_WORKER);
  const svelteWorkerPath = resolve(outputDir, SVELTE_WORKER);
  const assetsIgnorePath = resolve(outputDir, ".assetsignore");

  if (!existsSync(workerPath)) {
    throw new Error(`Cloudflare worker entry not found at ${workerPath}`);
  }

  const generatedWorker = readFileSync(workerPath, "utf-8");
  if (!generatedWorker.includes("import { Server }")) {
    throw new Error(`Unexpected Cloudflare worker entry at ${workerPath}`);
  }

  writeFileSync(svelteWorkerPath, generatedWorker);
  writeFileSync(workerPath, renderWorkerWrapper());

  const assetsIgnore = existsSync(assetsIgnorePath) ? readFileSync(assetsIgnorePath, "utf-8") : "";
  const ignoredWorker = `${SVELTE_WORKER}\n`;

  if (!assetsIgnore.split(/\r?\n/).includes(SVELTE_WORKER)) {
    writeFileSync(assetsIgnorePath, `${assetsIgnore}${assetsIgnore.endsWith("\n") ? "" : "\n"}${ignoredWorker}`);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  wrapCloudflareWorker();
}
