/**
 * Authoritative list of every doc page that exists as an implemented
 * `+page.svelte` route in apps/web-svelte. This list is the source of truth
 * for the search index — it includes the hidden `/foundry` page that
 * intentionally does not appear in the sidebar (`src/lib/nav.ts`), because
 * the sidebar is the human-visible browse surface and search is allowed to
 * surface routes that the sidebar deliberately omits.
 *
 * Result titles mirror the human names from apps/web/lib/docs-navigation.ts
 * so search hits read the same as the Next.js docs ("Vercel API",
 * "GitHub API", etc.) rather than the tighter sidebar labels.
 *
 * Do NOT add an entry here unless the matching `+page.svelte` exists.
 */
export type DocsSearchPage = {
	name: string;
	href: string;
};

export const allDocsPages: DocsSearchPage[] = [
	{ name: 'Getting Started', href: '/' },
	{ name: 'Programmatic API', href: '/programmatic-api' },
	{ name: 'Configuration', href: '/configuration' },
	{ name: 'Next.js Integration', href: '/nextjs' },
	{ name: 'Vercel API', href: '/vercel' },
	{ name: 'GitHub API', href: '/github' },
	{ name: 'Google API', href: '/google' },
	{ name: 'Slack API', href: '/slack' },
	{ name: 'Apple Sign In', href: '/apple' },
	{ name: 'Microsoft Entra ID', href: '/microsoft' },
	{ name: 'Foundry', href: '/foundry' },
	{ name: 'AWS', href: '/aws' },
	{ name: 'Okta', href: '/okta' },
	{ name: 'MongoDB Atlas', href: '/mongoatlas' },
	{ name: 'Resend', href: '/resend' },
	{ name: 'Stripe', href: '/stripe' },
	{ name: 'Authentication', href: '/authentication' },
	{ name: 'Architecture', href: '/architecture' }
];
