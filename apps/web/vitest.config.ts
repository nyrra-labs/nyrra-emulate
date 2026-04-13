import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Minimal Vitest config for apps/web's Node-side contract surface.
 *
 * This config is deliberately plugin-free — it does not load the
 * Next.js plugin, MDX loader, or any React/DOM environment. The tests
 * that live under `lib/__tests__/**` exercise pure TypeScript modules
 * plus a small number of Node-safe route-handler contracts
 * (`site-metadata.ts`, `page-titles.ts`, `page-metadata.ts`,
 * `service-labels.ts`, `docs-chat-summary.ts`, `docs-navigation.ts`,
 * `app/api/search/route.ts`, etc.). None of those tests require React
 * rendering, JSX transforms, or a browser DOM, so a plain Node
 * environment is enough.
 *
 * Broader component rendering and MDX-loader tests are intentionally
 * NOT covered here — they would require a different harness. Keeping
 * this config minimal lets `pnpm --filter web test` run fast and
 * deterministically, while still allowing direct imports of simple
 * App Router handlers when they only depend on Node-safe helpers.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": resolve(__dirname),
    },
  },
  test: {
    include: ["lib/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
