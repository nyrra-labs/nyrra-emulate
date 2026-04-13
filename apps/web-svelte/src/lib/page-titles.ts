/**
 * Slugs are keyed without a leading slash; the empty string is the root
 * (`/`). Non-root entries mirror `apps/web/lib/page-titles.ts` so the
 * Svelte docs site renders the same per-page document titles as the
 * upstream Next.js docs.
 *
 * The root entry intentionally diverges from the upstream `Local API
 * Emulation for CI and Sandboxes` because the Svelte shell is branded
 * as FoundryCI by Nyrra; see `page-metadata.ts` for the full root
 * metadata title and description that drive the rendered `<title>` tag.
 */
export const PAGE_TITLES: Record<string, string> = {
  "": "Overview",
  "programmatic-api": "Programmatic API",
  configuration: "Configuration",
  nextjs: "Next.js Integration",
  vercel: "Vercel API",
  github: "GitHub API",
  google: "Google API",
  slack: "Slack API",
  apple: "Apple Sign In",
  microsoft: "Microsoft Entra ID",
  foundry: "Foundry",
  aws: "AWS",
  okta: "Okta",
  mongoatlas: "MongoDB Atlas",
  resend: "Resend",
  stripe: "Stripe",
  authentication: "Authentication",
  architecture: "Architecture",
};

export function getPageTitle(slug: string): string | null {
  return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
