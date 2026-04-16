# Upstream Docs Sync Workflow

## When to sync

Run a docs sync whenever:

- You pull new commits from `vercel-labs/emulate` into `apps/web`
- A page is added, renamed, or removed in the upstream docs
- Upstream nav grouping or metadata constants change

## How to sync

```bash
pnpm docs:sync
```

This runs the sync script in `packages/docs-upstream` which:

1. Reads every `apps/web/app/**/page.mdx` file
2. Reads shared constants from `apps/web/lib/` (docs-pages, docs-nav-sections, site-metadata, service-labels)
3. Produces committed artifacts in `packages/docs-upstream/generated/`:
   - `manifest.json`: ordered page registry with slugs, titles, and hrefs
   - `content/`: raw MDX copies keyed by slug
   - `nav.json`: nav section groupings and label overrides
   - `metadata.ts`: re-exported upstream site metadata constants

4. Writes the artifacts to disk deterministically (sorted keys, stable output)

## Checking for staleness

```bash
pnpm docs:sync:check
```

Runs the sync in dry-run mode and exits non-zero if the committed artifacts would change. CI runs this check on every PR.

## After syncing

If the sync adds a new upstream page:

1. Decide whether to surface it in `apps/web-svelte` nav or mark it as intentionally unsurfaced
2. If surfacing: add an entry to the docs registry's upstream manifest
3. If deferring: add the href to the unsurfaced allowlist in the docs registry

The build-time contract validation in `apps/web-svelte` will abort if an upstream page exists without a conscious decision.

## Resolving conflicts

When merging upstream changes:

1. Accept upstream's changes to `apps/web/` files (they own the content)
2. Re-run `pnpm docs:sync` to regenerate the ingestion artifacts
3. Check that `apps/web-svelte` builds cleanly
4. If a page was renamed or removed upstream, update the docs registry and nav accordingly
