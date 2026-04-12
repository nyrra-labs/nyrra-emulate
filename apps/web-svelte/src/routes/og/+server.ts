import { error } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";
import { renderOgImage } from "$lib/og-image.server";
import { getPageTitle } from "$lib/page-titles";

/**
 * GET /og — root social card.
 *
 * Mirrors apps/web/app/og/route.tsx: looks up the empty-slug entry in
 * `PAGE_TITLES` and rasterizes the OG image. The empty-slug entry holds
 * the homepage two-line title (`Local API Emulation\nfor CI and Sandboxes`),
 * which `renderOgImage` splits on the newline.
 */
export const GET: RequestHandler = async () => {
  const title = getPageTitle("");
  if (title === null) {
    throw error(500, "Root OG image is missing its PAGE_TITLES entry");
  }

  const png = await renderOgImage(title);

  return new Response(png as BlobPart, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    },
  });
};
