import { defineConfig } from "vitest/config";

/**
 * Minimal Vitest config for apps/web's pure-library test surface.
 *
 * This config is deliberately plugin-free — it does not load the
 * Next.js plugin, MDX loader, or any React/DOM environment — because
 * the tests that live under `lib/__tests__/**` only exercise pure
 * TypeScript modules (`site-metadata.ts`, `page-titles.ts`,
 * `page-metadata.ts`, `service-labels.ts`, `docs-chat-summary.ts`,
 * `docs-navigation.ts`, etc.). None of those modules depend on the
 * Next.js runtime, React rendering, or JSX, so a plain Node
 * environment is enough.
 *
 * Broader route/component tests (App Router handlers, React
 * component rendering, MDX transforms) are intentionally NOT
 * covered here — they would require a different harness. Keeping
 * this config minimal lets `pnpm --filter web test` run fast and
 * deterministically, and a future slice can add a second config or
 * project entry if richer tests become necessary.
 */
export default defineConfig({
  test: {
    include: ["lib/__tests__/**/*.test.ts"],
    environment: "node",
  },
});
