/**
 * Build-time-bundled search index for the Svelte docs.
 *
 * Each MDX file from the sibling apps/web Next.js docs package is imported
 * via Vite's `?raw` suffix, which bundles the file content as a string at
 * build time. The strings are then parsed through the same
 * mdxToCleanMarkdown + stripMarkdown pipeline that apps/web uses on the
 * server, so result snippets match the Next.js search behavior.
 *
 * Bundling at build time keeps the production deploy of apps/web-svelte
 * self-contained: there are no runtime filesystem reads of the sibling
 * apps/web package, so the Svelte app can ship anywhere a Vite-built
 * SvelteKit app can ship.
 *
 * Mirrors apps/web/lib/search-index.ts.
 */
import { allDocsPages, type DocsSearchPage } from './docs-search-pages';
import { mdxToCleanMarkdown } from './mdx-to-markdown';

import gettingStartedRaw from '../../../web/app/page.mdx?raw';
import programmaticApiRaw from '../../../web/app/programmatic-api/page.mdx?raw';
import configurationRaw from '../../../web/app/configuration/page.mdx?raw';
import nextjsRaw from '../../../web/app/nextjs/page.mdx?raw';
import vercelRaw from '../../../web/app/vercel/page.mdx?raw';
import githubRaw from '../../../web/app/github/page.mdx?raw';
import googleRaw from '../../../web/app/google/page.mdx?raw';
import slackRaw from '../../../web/app/slack/page.mdx?raw';
import appleRaw from '../../../web/app/apple/page.mdx?raw';
import microsoftRaw from '../../../web/app/microsoft/page.mdx?raw';
import foundryRaw from '../../../web/app/foundry/page.mdx?raw';
import awsRaw from '../../../web/app/aws/page.mdx?raw';
import oktaRaw from '../../../web/app/okta/page.mdx?raw';
import mongoatlasRaw from '../../../web/app/mongoatlas/page.mdx?raw';
import resendRaw from '../../../web/app/resend/page.mdx?raw';
import stripeRaw from '../../../web/app/stripe/page.mdx?raw';
import authenticationRaw from '../../../web/app/authentication/page.mdx?raw';
import architectureRaw from '../../../web/app/architecture/page.mdx?raw';

const rawByHref: Record<string, string> = {
	'/': gettingStartedRaw,
	'/programmatic-api': programmaticApiRaw,
	'/configuration': configurationRaw,
	'/nextjs': nextjsRaw,
	'/vercel': vercelRaw,
	'/github': githubRaw,
	'/google': googleRaw,
	'/slack': slackRaw,
	'/apple': appleRaw,
	'/microsoft': microsoftRaw,
	'/foundry': foundryRaw,
	'/aws': awsRaw,
	'/okta': oktaRaw,
	'/mongoatlas': mongoatlasRaw,
	'/resend': resendRaw,
	'/stripe': stripeRaw,
	'/authentication': authenticationRaw,
	'/architecture': architectureRaw
};

export type IndexEntry = {
	title: string;
	href: string;
	content: string;
};

let cached: IndexEntry[] | null = null;

function stripMarkdown(md: string): string {
	return md
		.replace(/```[\s\S]*?```/g, '')
		.replace(/`[^`]+`/g, '')
		.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
		.replace(/^#{1,6}\s+/gm, '')
		.replace(/\*{1,3}([^*]+)\*{1,3}/g, '$1')
		.replace(/<[^>]+>/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export function getSearchIndex(): IndexEntry[] {
	if (cached) return cached;

	const entries: IndexEntry[] = allDocsPages.map((page: DocsSearchPage) => {
		const raw = rawByHref[page.href];
		if (!raw) {
			return { title: page.name, href: page.href, content: '' };
		}
		const md = mdxToCleanMarkdown(raw);
		const content = stripMarkdown(md);
		return { title: page.name, href: page.href, content };
	});

	cached = entries;
	return entries;
}
