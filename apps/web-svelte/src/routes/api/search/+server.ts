import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getSearchIndex } from '$lib/search-index';

/**
 * GET /api/search?q=...
 *
 * Mirrors apps/web/app/api/search/route.ts: term-splits the query, scores
 * title matches above content matches, extracts a short snippet around the
 * first matched term, sorts by score, and caps at 20 results.
 */
export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q')?.trim().toLowerCase();

	if (!q) {
		return json({ results: [] });
	}

	const index = getSearchIndex();
	const terms = q.split(/\s+/).filter(Boolean);

	type ScoredResult = {
		title: string;
		href: string;
		snippet: string;
		score: number;
	};

	const scored: ScoredResult[] = [];

	for (const entry of index) {
		const titleLower = entry.title.toLowerCase();
		const contentLower = entry.content.toLowerCase();

		const titleMatch = terms.every((t) => titleLower.includes(t));
		const contentMatch = terms.every((t) => contentLower.includes(t));

		if (!titleMatch && !contentMatch) continue;

		let snippet = '';
		if (contentMatch) {
			const firstTermIdx = Math.min(
				...terms.map((t) => {
					const idx = contentLower.indexOf(t);
					return idx === -1 ? Infinity : idx;
				})
			);
			if (firstTermIdx !== Infinity) {
				const start = Math.max(0, firstTermIdx - 40);
				const end = Math.min(entry.content.length, firstTermIdx + 120);
				snippet =
					(start > 0 ? '...' : '') +
					entry.content.slice(start, end).replace(/\n/g, ' ') +
					(end < entry.content.length ? '...' : '');
			}
		}

		scored.push({
			title: entry.title,
			href: entry.href,
			snippet,
			score: titleMatch ? 2 : 1
		});
	}

	const results = scored
		.sort((a, b) => b.score - a.score)
		.slice(0, 20)
		.map(({ title, href, snippet }) => ({ title, href, snippet }));

	return json(
		{ results },
		{
			headers: { 'Cache-Control': 'public, max-age=60' }
		}
	);
};
