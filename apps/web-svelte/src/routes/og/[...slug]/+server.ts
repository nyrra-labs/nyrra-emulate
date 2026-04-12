import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { renderOgImage } from "$lib/og-image.server";
import { getPageTitle } from "$lib/page-titles";

/**
 * GET /og/:slug — per-page social card.
 *
 * Mirrors apps/web/app/og/[...slug]/route.tsx: looks up the slug in
 * `PAGE_TITLES` and rasterizes the OG image, or returns 404 if the slug
 * is unknown. The slug is joined with `/` so multi-segment routes (none
 * exist today, but the catch-all is preserved for parity) work correctly.
 */
export const GET: RequestHandler = async ({ params }) => {
  const slug = params.slug ?? "";
  const title = getPageTitle(slug);

  if (title === null) {
    throw error(404, `No OG image for slug: ${slug}`);
  }

  const png = await renderOgImage(title);

  return new Response(png as BlobPart, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
