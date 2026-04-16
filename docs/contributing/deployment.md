# Docs Deployment Workflow

## Target

The docs site is deployed to Cloudflare Workers at `foundryci.com`.

Only `apps/web-svelte` is deployed. `apps/web` is never deployed.

## Build

```bash
pnpm --filter web-svelte build:cloudflare
```

This runs `vite build` with the Cloudflare adapter, producing static HTML for all prerendered pages plus a Workers script for the search API.

## Deploy

### Preview

```bash
PREVIEW_ALIAS=my-branch pnpm --filter web-svelte deploy:preview
```

### Production

```bash
pnpm --filter web-svelte deploy:production
```

### Dry run

```bash
pnpm --filter web-svelte deploy:dry-run
```

## CI

The GitHub Actions workflow at `.github/workflows/deploy-cloudflare.yml` handles:

- Preview deployments on PRs (with alias based on branch name)
- Production deployments on merge to main

## Prerendering

All docs pages are statically prerendered at build time. The search API (`/api/search`) runs as a Cloudflare Worker at request time.

The prerender entry generator reads the unified docs registry and emits one HTML file per page. Pages with nested paths (e.g., `/foundry/auth/oauth`) work the same as top-level pages.

## Verification before deploying

```bash
pnpm --filter web-svelte type-check
pnpm --filter web-svelte lint
pnpm --filter web-svelte test
pnpm --filter web-svelte build
```

All four must pass before deploying.
