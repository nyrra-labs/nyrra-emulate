import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";

export const prerender = true;

const codes = {
  quickStart: {
    lang: "bash" as const,
    code: `npx emulate`,
  },
  cli: {
    lang: "bash" as const,
    code: `# Start the default startup set
emulate

# Start specific services
emulate --service vercel,github,foundry

# Custom port
emulate --port 3000

# Use a seed config file
emulate --seed config.yaml

# Generate a starter config
emulate init

# Generate config for a specific service
emulate init --service foundry

# List available services
emulate list`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
