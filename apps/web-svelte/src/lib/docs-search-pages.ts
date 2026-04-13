/**
 * Thin adapter over the shared docs-source registry.
 *
 * Historically this file hand-maintained the catalog of implemented doc
 * pages for the search index. It is now derived from `./docs-source` so
 * the list of implemented pages lives in exactly one place. The
 * `DocsSearchPage` shape is preserved for any future consumer that
 * wants the lightweight `{ name, href }` projection without the raw
 * upstream MDX content on each entry.
 */
import { docsSources } from "./docs-source";

export type DocsSearchPage = {
  name: string;
  href: string;
};

export const allDocsPages: DocsSearchPage[] = docsSources.map(({ title, href }) => ({
  name: title,
  href,
}));
