import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Stable absolute path to apps/web for runtime helpers that need to
// read source docs from disk without depending on process.cwd().
export const APPS_WEB_ROOT = resolve(__dirname, "..");
