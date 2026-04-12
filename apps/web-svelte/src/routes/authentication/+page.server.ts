import type { PageServerLoad } from "./$types";
import { highlightAll } from "$lib/code-highlight.server";

export const prerender = true;

const codes = {
  vercelCurl: {
    lang: "bash" as const,
    code: `curl -H "Authorization: Bearer <token>" \\
  http://localhost:4000/v2/user`,
  },
  githubTokensYaml: {
    lang: "yaml" as const,
    code: `tokens:
  gho_test_token_admin:
    login: admin
    scopes:
      - repo
      - user
      - admin:org
      - admin:repo_hook
  gho_test_token_user1:
    login: octocat
    scopes:
      - repo
      - user`,
  },
  githubCurl: {
    lang: "bash" as const,
    code: `curl -H "Authorization: Bearer gho_test_token_admin" \\
  http://localhost:4001/user`,
  },
  githubAppsCurl: {
    lang: "bash" as const,
    code: `curl -X POST \\
  -H "Authorization: Bearer <jwt>" \\
  http://localhost:4001/app/installations/100/access_tokens`,
  },
  googleCurl: {
    lang: "bash" as const,
    code: `curl http://localhost:4002/.well-known/openid-configuration`,
  },
  slackTypescript: {
    lang: "typescript" as const,
    code: `import { WebClient } from '@slack/web-api'

const client = new WebClient(token, {
  slackApiUrl: 'http://localhost:4003/api/',
})`,
  },
  appleCurl: {
    lang: "bash" as const,
    code: `curl http://localhost:4004/.well-known/openid-configuration`,
  },
  microsoftCurl: {
    lang: "bash" as const,
    code: `curl http://localhost:4005/.well-known/openid-configuration`,
  },
  foundryCurl: {
    lang: "bash" as const,
    code: `curl -X POST http://localhost:4000/multipass/api/oauth2/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "client_id=foundry-web&\\
client_secret=foundry-secret&\\
grant_type=client_credentials&\\
scope=api:admin-read"`,
  },
  awsCurl: {
    lang: "bash" as const,
    code: `curl http://localhost:4006/s3/ \\
  -H "Authorization: Bearer test_token_admin"`,
  },
};

export const load: PageServerLoad = async () => {
  const codeBlocks = await highlightAll(codes);
  return { codeBlocks };
};
