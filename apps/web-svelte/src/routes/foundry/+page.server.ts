import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";

export const prerender = true;

const codes = {
  computeModulesSeed: {
    lang: "yaml" as const,
    code: `foundry:
  compute_modules:
    deployed_apps:
      - deployed_app_rid: ri.foundry.main.deployed-app.agent-loop
        branch: master
        runtime_id: agent-loop
        display_name: Agent Loop
        active: true
    runtimes:
      - runtime_id: agent-loop
        module_auth_token: local-module-auth-token`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
