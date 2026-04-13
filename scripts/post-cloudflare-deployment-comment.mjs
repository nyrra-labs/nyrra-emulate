const requiredEnvironmentVariables = [
  "APP_NAME",
  "APP_SLUG",
  "ENVIRONMENT",
  "GITHUB_REPOSITORY",
  "GITHUB_TOKEN",
  "PROVIDER",
  "RUN_URL",
  "SUMMARY",
];

for (const name of requiredEnvironmentVariables) {
  if (!process.env[name]) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

const providerAsciiArt = {
  cloudflare: String.raw`
             .-~~~~-.
         .- ~ ~-(       )_ _
        /                     ~ -.
       |   .-~~-.  .-~~-.       |
        \  \    |  |    /     ./
          ~-^--^----^--^---~
             C L O U D F L A R E
`,
};

const {
  APP_NAME: appName,
  APP_SLUG: appSlug,
  DEPLOYMENT_URL: deploymentUrl,
  ENVIRONMENT: environment,
  GITHUB_EVENT_BEFORE: previousSha,
  GITHUB_REPOSITORY: repository,
  GITHUB_SHA: commitSha,
  GITHUB_TOKEN: githubToken,
  PR_NUMBER: explicitPrNumber,
  PRODUCTION_URL: productionUrl,
  PROVIDER: provider,
  RUN_URL: runUrl,
  SUMMARY: summary,
  VERSION_ID: versionId,
} = process.env;

const [owner, repo] = repository.split("/");
const marker = `<!-- deploy-comment:${provider}:${appSlug}:${environment} -->`;

const api = async (path, init = {}) => {
  const response = await fetch(`https://api.github.com${path}`, {
    ...init,
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${githubToken}`,
      "Content-Type": "application/json",
      "User-Agent": "nyrra-emulate",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`GitHub API ${response.status} for ${path}: ${text}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};

const listIssueComments = async (issueNumber) => {
  const comments = [];
  let page = 1;

  while (true) {
    const batch = await api(
      `/repos/${owner}/${repo}/issues/${issueNumber}/comments?per_page=100&page=${page}`
    );
    comments.push(...batch);
    if (batch.length < 100) {
      return comments;
    }
    page += 1;
  }
};

const associatedPullRequests = new Map();

if (explicitPrNumber) {
  const pullRequest = await api(`/repos/${owner}/${repo}/pulls/${explicitPrNumber}`);
  associatedPullRequests.set(pullRequest.number, pullRequest);
} else if (commitSha) {
  const commitShas = [commitSha];

  if (previousSha && !/^0+$/.test(previousSha)) {
    const comparison = await api(
      `/repos/${owner}/${repo}/compare/${previousSha}...${commitSha}`
    );

    for (const commit of comparison.commits ?? []) {
      commitShas.push(commit.sha);
    }
  }

  for (const sha of new Set(commitShas)) {
    const pullRequests = await api(`/repos/${owner}/${repo}/commits/${sha}/pulls`);
    for (const pullRequest of pullRequests) {
      associatedPullRequests.set(pullRequest.number, pullRequest);
    }
  }
}

if (associatedPullRequests.size === 0) {
  console.log("No associated pull request found for this deployment event.");
  process.exit(0);
}

const links = [
  productionUrl ? `- Production: ${productionUrl}` : null,
  deploymentUrl ? `- Preview: ${deploymentUrl}` : null,
  versionId ? `- Version: \`${versionId}\`` : null,
  `- Run: ${runUrl}`,
].filter(Boolean);

const body = [
  marker,
  `## ${provider[0].toUpperCase()}${provider.slice(1)} ${environment} deployment · ${appName}`,
  "",
  "```text",
  providerAsciiArt[provider] ?? appName,
  "```",
  "",
  summary,
  "",
  ...links,
].join("\n");

for (const pullRequest of associatedPullRequests.values()) {
  const comments = await listIssueComments(pullRequest.number);
  const existingComment = comments.find(
    (comment) =>
      typeof comment.body === "string" && comment.body.includes(marker)
  );

  if (existingComment) {
    await api(`/repos/${owner}/${repo}/issues/comments/${existingComment.id}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
    console.log(`Updated deployment comment on PR #${pullRequest.number}.`);
    continue;
  }

  await api(`/repos/${owner}/${repo}/issues/${pullRequest.number}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
  console.log(`Created deployment comment on PR #${pullRequest.number}.`);
}
