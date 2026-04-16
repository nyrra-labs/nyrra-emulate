# Local Docs Authoring Workflow

## Adding a local docs page

Local docs pages live in `apps/web-svelte/src/content/` as Markdown files. They are owned entirely by this repo, not derived from upstream.

### Steps

1. Create the Markdown file at the appropriate path under `src/content/`. The file path determines the URL:
   - `src/content/foundry/auth/oauth.md` serves at `/foundry/auth/oauth`
   - `src/content/foundry/getting-started.md` serves at `/foundry/getting-started`

2. Add frontmatter with at minimum a `title`:
   ```markdown
   ---
   title: OAuth 2.0
   description: Foundry OAuth 2.0 authorization and token exchange
   ---
   ```

3. Add the page to the docs registry in `src/lib/docs-registry.ts` with `kind: "local"`.

4. Add the page to the nav structure in `src/lib/nav.ts` under the appropriate section.

5. Run the build to verify:
   ```bash
   pnpm --filter web-svelte build
   ```

The prerender entry generator picks up new registry entries automatically. No per-page `+page.server.ts` is needed.

## Local content conventions

- Use standard Markdown (not MDX). No JSX components or import statements.
- Fenced code blocks are highlighted via Shiki at build time.
- Inline code uses backticks as usual.
- Internal links use root-relative hrefs (`/foundry/auth/oauth`).
- Keep prose concise. Reference the upstream emulate docs for general concepts.

## Foundry docs hierarchy

The local Foundry docs use a nested hierarchy:

```
/foundry                         Overview and quick start
/foundry/getting-started         Setup and first run
/foundry/auth/oauth              OAuth 2.0 flow
/foundry/auth/client-credentials Client credentials grant
/foundry/auth/refresh-tokens     Token refresh
/foundry/auth/scopes             Scope model
/foundry/auth/current-user       Current user endpoint
/foundry/admin/enrollments       Enrollment management
/foundry/admin/users             User management
/foundry/connectivity/...        Connections and secrets
/foundry/ontologies/...          Object reads, queries, actions
/foundry/compute-modules/...     Runtime, jobs, contour
/foundry/reference/...           Seed config, endpoints, scopes
```

## Metadata

Page metadata (title, description, OG tags) is resolved from the docs registry. Local pages specify their title and description in the registry entry or via Markdown frontmatter. FoundryCI-branded pages get brand-leading metadata automatically.
