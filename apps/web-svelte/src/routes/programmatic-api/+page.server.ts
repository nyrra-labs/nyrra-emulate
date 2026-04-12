import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";

export const prerender = true;

const codes = {
  installEmulate: {
    lang: "bash" as const,
    code: `npm install emulate`,
  },
  createEmulatorExample: {
    lang: "typescript" as const,
    code: `import { createEmulator } from 'emulate'

const github = await createEmulator({ service: 'github', port: 4001 })
const vercel = await createEmulator({ service: 'vercel', port: 4002 })

github.url   // 'http://localhost:4001'
vercel.url   // 'http://localhost:4002'

await github.close()
await vercel.close()`,
  },
  vitestSetup: {
    lang: "typescript" as const,
    code: `// vitest.setup.ts
import { createEmulator, type Emulator } from 'emulate'

let github: Emulator
let vercel: Emulator

beforeAll(async () => {
  ;[github, vercel] = await Promise.all([
    createEmulator({ service: 'github', port: 4001 }),
    createEmulator({ service: 'vercel', port: 4002 }),
  ])
  process.env.GITHUB_EMULATOR_URL = github.url
  process.env.VERCEL_EMULATOR_URL = vercel.url
})

afterEach(() => { github.reset(); vercel.reset() })
afterAll(() => Promise.all([github.close(), vercel.close()]))`,
  },
  installScopedPackages: {
    lang: "bash" as const,
    code: `npm install @emulators/github @emulators/google @emulators/stripe`,
  },
  directUsageExample: {
    lang: "typescript" as const,
    code: `import * as github from '@emulators/github'
import * as stripe from '@emulators/stripe'`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
