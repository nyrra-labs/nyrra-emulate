# Publishing @nyrra/emulate

This repo now follows the same basic release shape as the `@nyrra/*` packages in `prismantix`:

- stable versions live in `packages/emulate/package.json`
- pushes to `main` publish prereleases to the `next` dist-tag
- manual stable releases publish the current manifest version to `latest`
- the published package is built from `packages/emulate/.release`, not directly from the workspace package root

## Package coordinates

- npm package: `@nyrra/emulate`
- npm org: `nyrra`
- GitHub repo: `nyrra-labs/nyrra-emulate`
- CLI binary after install: `emulate`

## First manual publish

Your first publish still needs to happen locally because of your YubiKey.

From the repo root, run:

```bash
pnpm run release:emulate:prepare
npm publish ./packages/emulate/.release --access public
```

That will:

1. build `packages/emulate`
2. create `packages/emulate/.release`
3. publish `@nyrra/emulate`

If you want to inspect the tarball first:

```bash
pnpm run release:emulate:pack
```

If you want a publish preview without uploading:

```bash
pnpm run release:emulate:publish:dry-run
```

## Local prerelease publish

If you want to test the prerelease flow locally before wiring up secrets, compute the next prerelease version, update the package version locally, then publish with the `next` tag.

```bash
next_version=$(node scripts/resolve-next-prerelease-version.mjs)
node -e "const fs=require('node:fs'); const path='packages/emulate/package.json'; const pkg=JSON.parse(fs.readFileSync(path,'utf8')); pkg.version=process.argv[1]; fs.writeFileSync(path, JSON.stringify(pkg, null, 2) + '\n');" "$next_version"
pnpm run release:emulate:prepare
npm publish ./packages/emulate/.release --access public --tag next
```

## GitHub Actions flow

`.github/workflows/release.yml` handles the ongoing release process with npm trusted publishing over OIDC only.

### Prerelease

On every push to `main`, the workflow:

1. verifies the repo
2. resolves the next version like `0.4.2-next.0`
3. builds `packages/emulate/.release`
4. publishes `@nyrra/emulate` with the `next` tag using OIDC trusted publishing

### Stable release

Run the workflow manually with `dry-run = false` after the desired stable version is on `main`.

That workflow will:

1. build `packages/emulate/.release`
2. publish `@nyrra/emulate` with the `latest` tag using OIDC trusted publishing
3. create and push a git tag like `@nyrra/emulate@0.4.1`

### Dry run

Run the same workflow with `dry-run = true` to verify what would be published without uploading anything.

## Trusted publisher setup

Do not add an `NPM_TOKEN` secret for this repo.

Automated publishes should use npm trusted publishing over GitHub Actions OIDC only.

After the first manual publish, add a trusted publisher for `@nyrra/emulate` in npm.

Use these values:

- npm org: `nyrra`
- package: `@nyrra/emulate`
- provider: GitHub Actions
- repository: `nyrra-labs/nyrra-emulate`
- workflow filename: `release.yml`

In the npm trusted publisher UI, enter only the workflow filename, not the full path. The file lives at `.github/workflows/release.yml` in this repo, but npm expects `release.yml`.

You can manage that from the npm package settings UI for the `nyrra` org.

## Verify a publish

```bash
npm view @nyrra/emulate dist-tags --json
npm view @nyrra/emulate version
npx @nyrra/emulate --version
```
