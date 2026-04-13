import type { PageServerLoad } from "./$types";
import { renderDocsHtmlByHref } from "$lib/render-docs.server";

export const prerender = true;

export const load: PageServerLoad = async () => {
  const { html } = await renderDocsHtmlByHref("/programmatic-api");
  return { html };
};
