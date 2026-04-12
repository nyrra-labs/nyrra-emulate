/**
 * Mirror of apps/web/lib/page-titles.ts. Slugs are keyed without a leading
 * slash; the empty string is the root (`/`). The newline in the root title
 * is preserved here for parity with the Next.js source — `pageMetadata`
 * flattens it for the actual `<title>` tag.
 */
export const PAGE_TITLES: Record<string, string> = {
	'': 'Local API Emulation\nfor CI and Sandboxes',
	'programmatic-api': 'Programmatic API',
	configuration: 'Configuration',
	nextjs: 'Next.js Integration',
	vercel: 'Vercel API',
	github: 'GitHub API',
	google: 'Google API',
	slack: 'Slack API',
	apple: 'Apple Sign In',
	microsoft: 'Microsoft Entra ID',
	foundry: 'Foundry',
	aws: 'AWS',
	okta: 'Okta',
	mongoatlas: 'MongoDB Atlas',
	resend: 'Resend',
	stripe: 'Stripe',
	authentication: 'Authentication',
	architecture: 'Architecture'
};

export function getPageTitle(slug: string): string | null {
	return slug in PAGE_TITLES ? PAGE_TITLES[slug]! : null;
}
