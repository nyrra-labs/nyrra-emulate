# Docs Platform Architecture

## Overview

The emulate monorepo serves two docs surfaces from one codebase:

- **apps/web** is a Next.js app that mirrors the upstream `vercel-labs/emulate` docs. It is the read-only source of truth for inherited content. It is never deployed by Nyrra.
- **apps/web-svelte** is a SvelteKit app deployed to Cloudflare Workers at `foundryci.com`. It is FoundryCI-branded and Foundry-first, but surfaces every upstream service doc through a shared content pipeline.

## Ownership boundaries

### apps/web (upstream mirror)

- Treat as a read-only input. Do not add FoundryCI-specific content, branding, or routing here.
- Local edits are limited to upstream sync support (dependency bumps, build fixes).
- Contains canonical MDX content for each upstream service page, plus shared metadata and nav constants consumed by the ingestion layer.

### packages/docs-upstream (ingestion boundary)

- The sole interface between the upstream mirror and the deployed docs app.
- Runs a sync script that reads `apps/web` at build time and produces committed, deterministic artifacts: a docs manifest, raw MDX copies, nav grouping data, and upstream metadata constants.
- apps/web-svelte depends on `packages/docs-upstream` as a workspace package. It never reaches into `apps/web` directly.
- A CI check (`docs:sync:check`) validates that the committed artifacts match what the sync script would produce, catching stale syncs before merge.

### apps/web-svelte (deployed docs app)

Owns:

- **Local shell**: layout, header, footer, sidebar, mobile nav, theme toggle, search UI, deployment config.
- **Homepage**: fully local, hand-authored FoundryCI hero and quick-start content.
- **Foundry docs tree**: local nested hierarchy under `/foundry/*` that can grow independently of upstream.
- **Metadata and branding**: FoundryCI/Nyrra brand constants, per-page metadata, OG images.
- **Search and nav integration**: unified docs registry that merges upstream-backed and local pages.

Consumes:

- `packages/docs-upstream` for upstream-backed content, nav section hrefs, label overrides, and site metadata constants.
- `packages/emulate/src/service-names` for runtime default-startup and supported-service lists (used on the homepage).

### @emulators/foundry (runtime package)

- One published npm package. Internals split by domain: auth, admin, connectivity, ontologies, compute-modules.
- Exposes a route registry that docs tooling can consume for generated reference content (endpoint tables, scope matrices).
- The public API surface is the `foundryPlugin` ServicePlugin export. Internal domain modules are not re-exported.

## Content model

The docs registry recognizes two source kinds:

| Kind | Source | Example routes |
|------|--------|----------------|
| `upstream` | `packages/docs-upstream` generated manifest | `/vercel`, `/github`, `/configuration` |
| `local` | `apps/web-svelte/src/content/` | `/`, `/foundry`, `/foundry/auth/oauth` |

Both kinds produce the same `DocsSource` shape (`{ title, href, raw, kind }`). Nav, search, metadata, and prerendering consume the unified registry without caring about the source kind.

## Routing model

The docs router supports nested paths, not just single-segment slugs. Routes like `/foundry/auth/oauth` use a SvelteKit rest-param route (`[...slug]`) and resolve against the unified docs registry.

## Import boundary rule

apps/web-svelte must not import from apps/web directly. All upstream content flows through `packages/docs-upstream`. An ESLint `no-restricted-imports` rule enforces this at lint time, and CI catches violations.
