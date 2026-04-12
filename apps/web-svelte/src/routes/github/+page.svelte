<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	GitHub API
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Every endpoint below is fully stateful. Creates, updates, and deletes persist in memory and
	affect related entities.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Users
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /user</code
		> - authenticated user
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PATCH /user</code
		> - update profile
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username</code
		> - get user
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users</code
		> - list users
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username/repos</code
		> - list user repos
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username/orgs</code
		> - list user orgs
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username/followers</code
		> - list followers
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /users/:username/following</code
		> - list following
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Repositories
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo</code
		> - get repo
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /user/repos</code
		> - create user repo
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /orgs/:org/repos</code
		> - create org repo
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PATCH /repos/:owner/:repo</code
		> - update repo
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>DELETE /repos/:owner/:repo</code
		> - delete repo (cascades)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET/PUT /repos/:owner/:repo/topics</code
		> - get/replace topics
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/languages</code
		> - languages
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/contributors</code
		> - contributors
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/forks</code
		> - list forks
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/forks</code
		> - create fork
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET/PUT/DELETE /repos/:owner/:repo/collaborators/:username</code
		> - collaborators
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/collaborators/:username/permission</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/transfer</code
		> - transfer repo
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/tags</code
		> - list tags
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Issues</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/issues</code
		> - list (filter by state, labels, assignee, milestone, creator, since)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/issues</code
		> - create
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/issues/:number</code
		> - get
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PATCH /repos/:owner/:repo/issues/:number</code
		> - update (state transitions, events)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PUT/DELETE /repos/:owner/:repo/issues/:number/lock</code
		> - lock/unlock
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/issues/:number/timeline</code
		> - timeline events
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/issues/:number/events</code
		> - events
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST/DELETE /repos/:owner/:repo/issues/:number/assignees</code
		> - manage assignees
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Pull Requests
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/pulls</code
		> - list (filter by state, head, base)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/pulls</code
		> - create
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/pulls/:number</code
		> - get
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PATCH /repos/:owner/:repo/pulls/:number</code
		> - update
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PUT /repos/:owner/:repo/pulls/:number/merge</code
		> - merge (with branch protection enforcement)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/pulls/:number/commits</code
		> - list commits
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/pulls/:number/files</code
		> - list files
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST/DELETE /repos/:owner/:repo/pulls/:number/requested_reviewers</code
		> - manage reviewers
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PUT /repos/:owner/:repo/pulls/:number/update-branch</code
		> - update branch
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Comments
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Issue comments: full CRUD on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/repos/:owner/:repo/issues/:number/comments</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Review comments: full CRUD on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/repos/:owner/:repo/pulls/:number/comments</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Commit comments: full CRUD on
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/repos/:owner/:repo/commits/:sha/comments</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Repo-wide listings for each type</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Reviews</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /repos/:owner/:repo/pulls/:number/reviews</code
		> - list
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/pulls/:number/reviews</code
		> - create (with inline comments)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET/PUT /repos/:owner/:repo/pulls/:number/reviews/:id</code
		> - get/update
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /repos/:owner/:repo/pulls/:number/reviews/:id/events</code
		> - submit
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PUT /repos/:owner/:repo/pulls/:number/reviews/:id/dismissals</code
		> - dismiss
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Labels &amp; Milestones
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Labels: full CRUD, add/remove from issues, replace all
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Milestones: full CRUD, state transitions, issue counts
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Branches &amp; Git Data
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Branches: list, get, protection CRUD (status checks, PR reviews, enforce admins)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Refs: get, match, create, update, delete
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Commits: get, create</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Trees: get (with recursive), create (with inline content)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Blobs: get, create</li>
	<li class="text-neutral-600 dark:text-neutral-400">Tags: get, create</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Organizations &amp; Teams
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">Orgs: get, update, list</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Org members: list, check, remove, get/set membership
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Teams: full CRUD, members, repos</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Releases
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">Releases: full CRUD, latest, by tag</li>
	<li class="text-neutral-600 dark:text-neutral-400">Release assets: full CRUD, upload</li>
	<li class="text-neutral-600 dark:text-neutral-400">Generate release notes</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Webhooks
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Repo webhooks: full CRUD, ping, test, deliveries
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Org webhooks: full CRUD, ping</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Real HTTP delivery to registered URLs on all state changes
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Search</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/repositories</code
		> - full query syntax (user, org, language, topic, stars, forks, etc.)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/issues</code
		> - issues + PRs (repo, is, author, label, milestone, state, etc.)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/users</code
		> - users + orgs
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/code</code
		> - blob content search
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/commits</code
		> - commit message search
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/topics</code
		> - topic search
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /search/labels</code
		> - label search
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Actions</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Workflows: list, get, enable/disable, dispatch
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Workflow runs: list, get, cancel, rerun, delete, logs
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">Jobs: list, get, logs</li>
	<li class="text-neutral-600 dark:text-neutral-400">Artifacts: list, get, delete</li>
	<li class="text-neutral-600 dark:text-neutral-400">Secrets: repo + org CRUD</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Checks</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Check runs: create, update, get, annotations, rerequest, list by ref/suite
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Check suites: create, get, preferences, rerequest, list by ref
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Automatic suite status rollup from check run results
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Misc</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /rate_limit</code
		> - rate limit status
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /meta</code
		> - server metadata
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /octocat</code
		> - ASCII art
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /emojis</code
		> - emoji URLs
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /zen</code
		> - random zen phrase
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /versions</code
		> - API versions
	</li>
</ul>
