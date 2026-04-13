/**
 * Re-exports of the upstream `apps/web/lib/site-metadata.ts` branding
 * constants the Svelte docs site consumes.
 *
 * The Svelte docs site is FoundryCI-branded and ships its own root
 * metadata (root title, BASE_URL, OG image path, FoundryCI-specific
 * per-page overrides in `./page-metadata.ts`), but every NON-root
 * page's metadata still mirrors the upstream emulate docs exactly
 * (same display-title suffix, same description, same OG/Twitter
 * fixed fields), and the Header / layout footer link to the same
 * upstream GitHub repo and npm package URLs. Hand-maintaining a
 * parallel copy of those upstream constants in the Svelte app
 * would drift silently on every upstream rebrand.
 *
 * This module concentrates the cross-workspace relative path to
 * `apps/web/lib/site-metadata.ts` in one file so every Svelte
 * consumer can import from `$lib/upstream-site-metadata` with the
 * clean SvelteKit `$lib` alias, and a future monorepo layout change
 * only touches one relative path.
 *
 * Only the constants the Svelte side actually uses are re-exported.
 * The FoundryCI-specific facts (root hero copy, BASE_URL, OG image
 * path, /foundry and /configuration overrides) intentionally stay
 * local in `./page-metadata.ts` and are NOT routed through this
 * module.
 */
export {
  GITHUB_REPO_URL,
  NPM_PACKAGE_URL,
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
  OG_LOCALE,
  OG_TYPE,
  PAGE_SITE_DESCRIPTION,
  SITE_NAME,
  TWITTER_CARD,
  ogImageAlt,
  suffixWithSiteName,
} from "../../../../apps/web/lib/site-metadata";
