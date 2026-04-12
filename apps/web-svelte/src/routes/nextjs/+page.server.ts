import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";

export const prerender = true;

const codes = {
  install: {
    lang: "bash" as const,
    code: `npm install @emulators/adapter-next @emulators/github @emulators/google`,
  },
  routeHandler: {
    lang: "typescript" as const,
    code: `// app/emulate/[...path]/route.ts
import { createEmulateHandler } from '@emulators/adapter-next'
import * as github from '@emulators/github'
import * as google from '@emulators/google'

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: {
    github: {
      emulator: github,
      seed: {
        users: [{ login: 'octocat', name: 'The Octocat' }],
        repos: [{ owner: 'octocat', name: 'hello-world', auto_init: true }],
      },
    },
    google: {
      emulator: google,
      seed: {
        users: [{ email: 'test@example.com', name: 'Test User' }],
      },
    },
  },
})`,
  },
  authjs: {
    lang: "typescript" as const,
    code: `import GitHub from 'next-auth/providers/github'

const baseUrl = process.env.VERCEL_URL
  ? \`https://\${process.env.VERCEL_URL}\`
  : 'http://localhost:3000'

GitHub({
  clientId: 'any-value',
  clientSecret: 'any-value',
  authorization: { url: \`\${baseUrl}/emulate/github/login/oauth/authorize\` },
  token: { url: \`\${baseUrl}/emulate/github/login/oauth/access_token\` },
  userinfo: { url: \`\${baseUrl}/emulate/github/user\` },
})`,
  },
  withEmulateBasic: {
    lang: "typescript" as const,
    code: `// next.config.mjs
import { withEmulate } from '@emulators/adapter-next'

export default withEmulate({
  // your normal Next.js config
})`,
  },
  withEmulateRoutePrefix: {
    lang: "typescript" as const,
    code: `export default withEmulate(nextConfig, { routePrefix: '/api/emulate' })`,
  },
  kvAdapter: {
    lang: "typescript" as const,
    code: `import { createEmulateHandler } from '@emulators/adapter-next'
import * as github from '@emulators/github'

const kvAdapter = {
  async load() { return await kv.get('emulate-state') },
  async save(data: string) { await kv.set('emulate-state', data) },
}

export const { GET, POST, PUT, PATCH, DELETE } = createEmulateHandler({
  services: { github: { emulator: github } },
  persistence: kvAdapter,
})`,
  },
  filePersistence: {
    lang: "typescript" as const,
    code: `import { filePersistence } from '@emulators/core'

// persists to a JSON file
persistence: filePersistence('.emulate/state.json'),`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
