# FoundryCI Svelte Docs Refactor Plan

Status: planning only. Do not begin the refactor from this document alone without an explicit go ahead from the human.

Current planning branch: `docs/foundryci-refactor-plan`

## Why this plan exists

We want one deployable docs app at `foundryci.com`, hosted on Cloudflare Workers, with Foundry as the primary surface.

We do not want to keep manually porting or duplicating the upstream `vercel-labs/emulate` docs every time upstream changes. The refactor should make upstream pulls easier, not harder.

## Primary goals

1. Deploy only `apps/web-svelte`.
2. Do not deploy `apps/web`.
3. Keep upstream merge friction low.
4. Make Foundry the first class focus in the Svelte docs.
5. Keep other services available below the Foundry focused content.
6. Add Nyrra branding clearly.
7. Preserve clear attribution and credit to `emulate` and Vercel Labs.
8. Keep the implementation incremental, reviewable, and safe for an agentic worker loop.

## Hard constraints

1. Keep `apps/web` in the repo during this refactor.
   - Treat it as the upstream content mirror and source of truth for inherited docs content.
   - Do not delete it in this project phase.
   - Do not deploy it.
2. Minimize local edits inside `apps/web`.
   - Prefer zero or near zero custom changes there.
   - Any change inside `apps/web` must be justified as upstream sync support, not product customization.
3. Do not continue the current page by page hand porting approach if there is a practical generic alternative.
4. Prefer one ingestion pipeline for upstream docs content over duplicated content in both apps.
5. Keep Foundry visible in nav, mobile nav, search, metadata, and homepage positioning.
6. Do not hotlink the Nyrra logo from `nyrra.ai` in production.
   - Vendor a local asset inside `apps/web-svelte/static/`.
7. Preserve explicit upstream attribution in the Svelte app.
8. Do not let dynamic OG image work block the core docs and deployment migration.
   - It can be simplified or deferred if Worker compatibility is the bottleneck.

## Recommended end state

### Product shape

- `apps/web-svelte` becomes the only deployed docs site.
- `apps/web` remains in the repo as an upstream content source and merge anchor.
- The Svelte site becomes a Nyrra branded, Foundry focused shell around upstream docs content.
- Foundry content is surfaced first.
- Other emulator services remain available in secondary navigation and supporting pages.

### Content ownership model

Use three content tiers.

1. Upstream inherited content
   - Source: `apps/web/app/**/*.mdx`
   - Examples: generic service docs, configuration docs, programmatic API docs, reference docs.
2. Local shell content
   - Source: `apps/web-svelte/src/`
   - Examples: layout, nav, footer, homepage hero, branding, page chrome, search UI, metadata.
3. Local FoundryCI specific content
   - Source: `apps/web-svelte/src/`
   - Examples: homepage messaging, Foundry landing sections, deployment notes, Nyrra CTA, Foundry prioritization.

### Branding model

- Primary visible brand: FoundryCI by Nyrra
- Persistent link to `https://www.nyrra.ai/`
- Explicit credit in footer such as:
  - “Built on emulate by Vercel Labs”
  - link to upstream repo
  - link to Apache 2.0 license if useful in footer or about page
- Do not auto redirect the whole site to Nyrra.
- Prefer a strong Nyrra logo, clear attribution, and a CTA link rather than a forced redirect.

## Architectural recommendation

### Keep `apps/web` as an upstream mirror

This is the most important decision.

Do not delete `apps/web` right now.

Reason:

- Upstream already organizes docs there.
- Pulling from `vercel-labs/emulate` stays much easier if the upstream docs tree remains intact.
- The Svelte app can read those files at build time.
- This avoids re authoring the same content twice.

### Make `apps/web-svelte` read upstream docs content directly

Preferred approach:

1. Build a docs source layer inside `apps/web-svelte`, likely under something like `src/lib/docs-source/`.
2. Load raw MDX from `apps/web/app/**/page.mdx` with `import.meta.glob(..., { eager: true, query: '?raw', import: 'default' })` or an equivalent approach.
3. Normalize the raw MDX through a single cleanup pipeline.
4. Render the normalized markdown or HTML inside a shared Svelte docs template.
5. Apply local route metadata, nav grouping, branding, and page level overrides in Svelte.

This is better than today’s pattern of many hand maintained `+page.svelte` copies.

### Avoid per page manual imports where possible

Current Svelte search code manually imports many sibling MDX files.

That works, but it scales poorly for upstream drift.

Preferred direction:

- Replace manual per page imports with a generated map via `import.meta.glob`.
- Keep one local manifest that defines:
  - route slug
  - title override if needed
  - nav group
  - visibility in sidebar
  - visibility in search
  - whether the page is fully local or backed by upstream content

### Allow thin local overrides, not full content forks

We still want local control.

Examples of acceptable local overrides:

- custom homepage
- Foundry focused landing sections
- extra hero copy
- Nyrra CTA blocks
- page lead override
- nav order overrides
- metadata overrides

Examples to avoid:

- copying whole upstream docs pages into custom Svelte markup with no strong reason
- editing the same content in both `apps/web` and `apps/web-svelte`

## Foundry first information architecture

The Svelte app should not present Foundry as a hidden or secondary route.

Recommended nav direction:

### Primary section

- Getting Started
- Foundry Overview
- Foundry OAuth
- Current User
- Compute Modules
- Contour Jobs
- Seed Config

### Secondary services section

- Vercel
- GitHub
- Google
- Slack
- Apple
- Microsoft Entra ID
- AWS
- Okta
- MongoDB Atlas
- Resend
- Stripe

### Reference section

- Programmatic API
- Configuration
- Next.js Integration
- Architecture

Note:

- It is acceptable to use one main `/foundry` page first and expand into deeper Foundry pages later.
- The important requirement is that Foundry becomes visible, primary, and easy to reach.

## Cloudflare deployment strategy

### High level direction

- Deploy only `apps/web-svelte` to Cloudflare Workers.
- Switch from `@sveltejs/adapter-auto` to the Cloudflare adapter.
- Add Worker friendly config and deployment docs.

### Important runtime audit

Before locking the deployment path, audit all Node specific usage in `apps/web-svelte`.

Known likely problem areas:

- `apps/web-svelte/src/lib/og-image.server.ts`
  - uses `node:fs/promises`
  - uses local font file reads at runtime
  - uses `@resvg/resvg-js`
- any route that depends on Node only file access at request time

Preferred approach:

- keep docs pages static or prerendered where practical
- keep search simple
- if dynamic OG images are difficult on Workers, replace them with a simpler static OG asset first

Do not let OG image parity delay the rest of the migration.

## Worker loop instructions

The implementation will run through an agentic worker loop one repo up. This document should be detailed enough for that worker.

The worker should also follow the parent repo guidance in:

- `../AGENTS.md`
- `../codex-harness/AGENTS.md`

### Required working style

1. Work in small bounded slices.
2. Do not mix multiple major phases into one worker task.
3. Verify each slice with repo native commands before reporting completion.
4. Report exact commands and outcomes, including exit codes.
5. Self review before handing back to the orchestrator.
6. Commit frequently.

### Commit policy

Frequent commits are mandatory.

The worker must commit after each verified slice. Do not wait for a giant “done” commit.

Commit triggers:

- after each nav or layout slice
- after each deployment config slice
- after introducing the shared docs source layer
- after migrating a pilot page or small route batch
- after any deletion of duplicated pages
- after search or metadata refactors
- after docs or deployment documentation updates

If a task grows beyond a small reviewable change, split it and commit the completed subset first.

### Good commit characteristics

- one concern per commit
- easy to revert
- backed by verification
- commit message explains the user visible intent

Example commit shapes:

- `feat(web-svelte): surface foundry in primary navigation`
- `feat(web-svelte): add upstream mdx docs source manifest`
- `feat(web-svelte): render inherited docs through shared template`
- `chore(web-svelte): switch docs app to cloudflare adapter`
- `refactor(web-svelte): remove duplicated service page markup`
- `feat(web-svelte): add nyrra branding and emulate attribution`

## Suggested phased plan

The orchestrator should send one numbered phase or sub phase at a time.

### Phase 0 — Baseline and guardrails

Goal:

- establish a clean baseline before any broad refactor

Tasks:

1. Confirm current branch and git status.
2. Identify every Svelte route that duplicates upstream docs content.
3. Identify every route that is intentionally local and should likely stay local.
4. Identify every Node only feature that may block Cloudflare Workers.
5. Capture a short written inventory in the worker response.

Expected output:

- inventory of duplicated routes
- inventory of local only routes
- inventory of Worker compatibility risks

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit:

- only if code or docs changed

### Phase 1 — Unhide and prioritize Foundry in the current Svelte shell

Goal:

- make Foundry visible immediately before the larger docs pipeline refactor

Tasks:

1. Add Foundry to visible nav structures.
2. Move Foundry near the top of the docs browse experience.
3. Ensure desktop nav, mobile nav, page metadata, and any local titles are aligned.
4. Update homepage copy or links enough that Foundry is clearly the primary service.

Likely files:

- `apps/web-svelte/src/lib/nav.ts`
- `apps/web-svelte/src/lib/page-titles.ts`
- `apps/web-svelte/src/routes/+page.svelte`
- any header or sidebar component that requires positioning changes

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

### Phase 2 — Cloudflare deployment foundation

Goal:

- make the Svelte app deployable on Cloudflare without changing the docs content model yet

Tasks:

1. Replace `adapter-auto` with the Cloudflare adapter.
2. Add initial Cloudflare config files as needed.
3. Decide which routes can be prerendered and which should stay dynamic.
4. Audit and resolve obvious Worker incompatibilities that block a build.
5. If OG generation blocks Worker compatibility, downgrade to a static fallback and document why.

Likely files:

- `apps/web-svelte/package.json`
- `apps/web-svelte/svelte.config.js`
- `apps/web-svelte/vite.config.ts`
- `apps/web-svelte/src/lib/og-image.server.ts`
- Worker config files such as `wrangler.toml` if chosen

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

If a Cloudflare specific local build command is added, include it too.

Commit required.

### Phase 3 — Shared upstream docs source layer

Goal:

- create one place where Svelte reads and normalizes upstream docs content

Tasks:

1. Create a docs source module inside `apps/web-svelte/src/lib/`.
2. Load upstream MDX from `apps/web/app/**/page.mdx` with an auto discovered import strategy.
3. Normalize the raw MDX into renderable markdown or HTML.
4. Centralize slug discovery and title mapping.
5. Centralize which pages are visible in nav and search.
6. Remove any manual page import lists that the new source layer can replace.

Preferred outcomes:

- search index reads from the shared docs source, not a hand maintained file list
- route rendering can also read from the same source

Likely files:

- `apps/web-svelte/src/lib/docs-source/*`
- `apps/web-svelte/src/lib/search-index.ts`
- `apps/web-svelte/src/lib/docs-search-pages.ts`
- possibly `apps/web-svelte/src/lib/nav.ts`

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

### Phase 4 — Shared docs renderer and pilot migration

Goal:

- prove that inherited upstream docs can render through one shared Svelte template

Tasks:

1. Build a generic docs renderer component or page loader.
2. Support the syntax actually used in upstream MDX pages.
   - headings
   - lists
   - code fences
   - tables
   - links
   - simple inline HTML used by the docs
3. Migrate one or two pilot pages first.

Recommended pilot pages:

- `/foundry`
- one secondary page such as `/configuration` or `/programmatic-api`

Important rule:

- if the renderer hits unsupported upstream syntax, extend the shared transform in one place
- do not fall back to hand duplicating a full page unless the human approves that tradeoff

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

### Phase 5 — FoundryCI branding and shell

Goal:

- make the site clearly feel like a Nyrra operated Foundry focused product while preserving attribution

Tasks:

1. Add a local Nyrra logo asset under `apps/web-svelte/static/`.
2. Update header branding to something like “FoundryCI by Nyrra”.
3. Add a footer with clear upstream credit.
4. Add or refine homepage sections that put Foundry first.
5. Keep non Foundry services accessible but visually secondary.
6. Add a clear link to `nyrra.ai`.

Preferred attribution shape:

- primary brand in header: Nyrra / FoundryCI
- explicit footer credit: built on emulate by Vercel Labs

Likely files:

- `apps/web-svelte/src/lib/components/Header.svelte`
- `apps/web-svelte/src/routes/+page.svelte`
- footer or layout component files
- metadata helpers
- static assets

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

### Phase 6 — Migrate remaining duplicated routes

Goal:

- reduce or eliminate hand maintained duplicated docs pages in Svelte

Tasks:

1. Move remaining inherited pages to the shared docs renderer path.
2. Keep only intentionally custom local pages as true bespoke Svelte pages.
3. Delete duplicated page specific markup once the replacement is verified.
4. Keep route behavior, titles, search presence, and navigation stable.

Suggested order:

1. Foundry adjacent pages
2. high traffic generic pages
3. remaining service reference pages

Important deletion rule:

- when removing an old duplicated page, do it in a separate small commit from the renderer addition if the change is large

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required after each small route batch.

### Phase 7 — Search, metadata, and SEO cleanup

Goal:

- ensure the final app is coherent after the content migration

Tasks:

1. Make search index derive from the shared docs source.
2. Ensure page titles and metadata reflect the FoundryCI branding where appropriate.
3. Ensure Foundry pages have strong metadata and OG behavior.
4. Simplify or replace any remaining Worker hostile metadata code.
5. Verify hidden versus visible pages are intentional.

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

### Phase 8 — Deployment docs and upstream sync docs

Goal:

- make future maintenance and upstream merging straightforward

Tasks:

1. Document how `apps/web-svelte` is deployed to Cloudflare.
2. Document that `apps/web` remains in repo as upstream source and is not deployed.
3. Document how to pull upstream and what to check after a merge.
4. Document the shared docs source layer so future contributors do not re introduce duplication.
5. Document branding and attribution expectations.

Suggested docs topics:

- deployment command
- domain assumptions for `foundryci.com`
- where the Nyrra logo asset lives
- how upstream MDX changes flow into Svelte
- what to do if upstream adds unsupported MDX syntax

Verification:

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte build
pnpm --filter web-svelte lint
```

Commit required.

## Known relevant files for the worker

### Svelte app

- `apps/web-svelte/package.json`
- `apps/web-svelte/svelte.config.js`
- `apps/web-svelte/vite.config.ts`
- `apps/web-svelte/src/lib/nav.ts`
- `apps/web-svelte/src/lib/docs-search-pages.ts`
- `apps/web-svelte/src/lib/search-index.ts`
- `apps/web-svelte/src/lib/mdx-to-markdown.ts`
- `apps/web-svelte/src/lib/page-metadata.ts`
- `apps/web-svelte/src/lib/page-titles.ts`
- `apps/web-svelte/src/lib/og-image.server.ts`
- `apps/web-svelte/src/routes/+page.svelte`
- `apps/web-svelte/src/routes/foundry/+page.svelte`
- `apps/web-svelte/src/routes/api/search/+server.ts`

### Upstream docs source

- `apps/web/app/**/*.mdx`
- `apps/web/lib/docs-navigation.ts`

### Root repo files

- `README.md`
- `AGENTS.md`
- `turbo.json`

## Non goals for this refactor

1. Do not rewrite emulator runtime code unless a docs or deployment issue truly requires it.
2. Do not redesign unrelated service behavior.
3. Do not delete `apps/web` in this phase.
4. Do not keep large shadow copies of the same docs content in both apps.
5. Do not block the migration on perfect OG feature parity.

## Definition of done

The refactor is successful when all of the following are true:

1. `apps/web-svelte` is the only deployed docs app.
2. The site is deployable on Cloudflare Workers under `foundryci.com`.
3. Foundry is the clear primary focus in navigation and homepage positioning.
4. Nyrra branding is visible and professional.
5. Upstream attribution remains clear.
6. Most inherited docs content is sourced from upstream `apps/web` content rather than hand duplicated Svelte pages.
7. Pulling upstream changes mostly flows through automatically, with only occasional transformer updates needed.
8. The worker produced a sequence of small, verified commits rather than one large opaque rewrite.

## First implementation slice to send to the worker

When implementation begins, start with Phase 1, not a broad rewrite.

Suggested first worker prompt summary:

- unhide Foundry in the visible Svelte nav
- move Foundry into a primary position
- update homepage links or copy so Foundry is visibly first class
- run `pnpm --filter web-svelte type-check`, `pnpm --filter web-svelte build`, and `pnpm --filter web-svelte lint`
- commit the change immediately after verification
- report exact commands, exit codes, and commit hash
