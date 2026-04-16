/**
 * Lightweight search-index projection from the unified docs registry.
 */
import { allDocsEntries } from "./docs-registry";

export type DocsSearchPage = {
  name: string;
  href: string;
};

export const docsSearchPages: DocsSearchPage[] = allDocsEntries.map(({ title, href }) => ({
  name: title,
  href,
}));
