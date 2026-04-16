import type { EntryGenerator, PageServerLoad } from "./$types";
import { allNonRootHrefs, docsEntryByHref } from "$lib/docs-registry";
import { renderDocsHtml } from "$lib/render-docs.server";

export const prerender = true;

export const entries: EntryGenerator = () => allNonRootHrefs().map((href) => ({ slug: href.slice(1) }));

export const load: PageServerLoad = async ({ params }) => {
  const href = `/${params.slug}`;
  const entry = docsEntryByHref.get(href);
  if (!entry) {
    throw new Error(`docs: no registry entry for href ${href}`);
  }
  const html = await renderDocsHtml(entry.raw);
  return { html, title: entry.title };
};
