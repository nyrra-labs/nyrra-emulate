/**
 * Server-only Open Graph image renderer for the Svelte docs.
 *
 * Mirrors apps/web/app/og/og-image.tsx — same 1200x630 layout, same Geist
 * brand bar in the top-left, same large centered title that splits on `\n`
 * for the homepage's two-line layout, same black background. The two
 * differences from the Next.js version are mechanical:
 *
 *   - Next.js uses `next/og`'s `ImageResponse`, which wraps satori + resvg
 *     internally. SvelteKit has no equivalent, so we call satori directly
 *     to render the layout to SVG and then `@resvg/resvg-js` to rasterize
 *     the SVG to a PNG buffer.
 *   - Next.js consumes JSX. Svelte has no JSX, so we use `satori-html` to
 *     parse a tagged-template HTML string into the satori element tree.
 *
 * Fonts (`Geist-Regular.ttf`, `GeistPixel-Square.ttf`) live in
 * `apps/web-svelte/static/fonts/`. They are copied byte-for-byte from
 * `apps/web/public/` so the rendered PNG matches what apps/web produces.
 *
 * The `.server.ts` suffix tells SvelteKit to never bundle this file into
 * the client. The TTF buffers and the satori/resvg packages stay
 * server-side only.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import { html as toReactNode } from "satori-html";

let fontCache: { geistRegular: Buffer; geistPixelSquare: Buffer } | null = null;

async function loadFonts() {
  if (fontCache) return fontCache;

  // `process.cwd()` is the package directory (`apps/web-svelte/`) under
  // `vite preview`, `vite dev`, and `vite build`. SvelteKit's `static/`
  // folder lives next to `src/`, so the absolute path is stable.
  const fontsDir = join(process.cwd(), "static", "fonts");
  const [geistRegular, geistPixelSquare] = await Promise.all([
    readFile(join(fontsDir, "Geist-Regular.ttf")),
    readFile(join(fontsDir, "GeistPixel-Square.ttf")),
  ]);

  fontCache = { geistRegular, geistPixelSquare };
  return fontCache;
}

function renderTitleLines(title: string): string {
  return title
    .split("\n")
    .map(
      (line) =>
        `<span style="font-size:72px;font-family:Geist;font-weight:400;color:white;letter-spacing:-0.02em;text-align:center;line-height:1.2;">${escapeHtml(
          line,
        )}</span>`,
    )
    .join("");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function renderOgImage(title: string): Promise<Uint8Array> {
  const { geistRegular, geistPixelSquare } = await loadFonts();

  // HTML markup mirrors apps/web/app/og/og-image.tsx exactly: black
  // background, 60px top/bottom + 80px left/right padding, brand bar with
  // the Vercel triangle SVG + slash + "emulate" pixel-font wordmark, then
  // a centered flex column with the title rendered one span per line.
  const markup = `
		<div style="width:100%;height:100%;display:flex;flex-direction:column;background-color:black;padding:60px 80px;">
			<div style="display:flex;align-items:center;gap:16px;">
				<svg width="36" height="36" viewBox="0 0 16 16" fill="white">
					<path fill-rule="evenodd" clip-rule="evenodd" d="M8 1L16 15H0L8 1Z" />
				</svg>
				<span style="font-size:36px;color:#666666;font-family:Geist;font-weight:400;">/</span>
				<span style="font-size:36px;font-family:GeistPixelSquare;font-weight:400;color:white;">emulate</span>
			</div>
			<div style="display:flex;flex:1;flex-direction:column;align-items:center;justify-content:center;">
				${renderTitleLines(title)}
			</div>
		</div>
	`;

  // satori-html returns its own `VNode` shape that is structurally
  // compatible with satori's element tree but typed differently. The
  // satori + satori-html pairing is the documented pattern for using
  // satori without JSX, so the runtime is correct even though the types
  // do not line up. Cast through `Parameters<typeof satori>[0]` so the
  // type system accepts the call.
  const svg = await satori(toReactNode(markup) as Parameters<typeof satori>[0], {
    width: 1200,
    height: 630,
    fonts: [
      {
        name: "Geist",
        data: geistRegular,
        style: "normal",
        weight: 400,
      },
      {
        name: "GeistPixelSquare",
        data: geistPixelSquare,
        style: "normal",
        weight: 400,
      },
    ],
  });

  const png = new Resvg(svg, {
    fitTo: { mode: "width", value: 1200 },
  })
    .render()
    .asPng();

  return png;
}
