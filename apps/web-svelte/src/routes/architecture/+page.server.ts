import type { PageServerLoad } from "./$types";
import { highlightAll, type SupportedLang } from "$lib/code-highlight.server";

export const prerender = true;

// The Architecture directory tree is a fenced block with no language specifier
// in the source MDX. apps/web's mdx-components.tsx defaults `lang` to
// "typescript" in that case, so we mirror that here for token coloring parity.
const codes = {
  directoryTree: {
    lang: "typescript" as SupportedLang,
    code: `packages/
  emulate/          # CLI entry point (commander)
  @emulators/
    core/           # HTTP server, in-memory store, plugin interface, middleware
    adapter-next/   # Next.js App Router integration
    vercel/         # Vercel API service
    github/         # GitHub API service
    google/         # Google OAuth 2.0 / OIDC + Gmail, Calendar, Drive
    slack/          # Slack Web API, OAuth v2, incoming webhooks
    apple/          # Apple Sign In / OIDC
    microsoft/      # Microsoft Entra ID OAuth 2.0 / OIDC + Graph /me
    aws/            # AWS S3, SQS, IAM, STS
    okta/           # Okta identity provider / OIDC
    mongoatlas/     # MongoDB Atlas Admin API + Data API
    resend/         # Resend email API
    stripe/         # Stripe billing and payments API
apps/
  web/              # Documentation site (Next.js)`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
