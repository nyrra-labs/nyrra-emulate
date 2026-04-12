<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	MongoDB Atlas
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	MongoDB Atlas emulation with Atlas Admin API v2 and Atlas Data API v1. In-memory document
	storage with CRUD, filtering, and aggregation.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Admin API
</h2>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Projects
</h3>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups</code
		> — list projects
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId</code
		> — get project
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /api/atlas/v2/groups</code
		> — create project
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>DELETE /api/atlas/v2/groups/:groupId</code
		> — delete project (cascades clusters and data)
	</li>
</ul>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Clusters
</h3>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/clusters</code
		> — list clusters
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/clusters/:clusterName</code
		> — get cluster
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /api/atlas/v2/groups/:groupId/clusters</code
		> — create cluster
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>PATCH /api/atlas/v2/groups/:groupId/clusters/:clusterName</code
		> — update cluster
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>DELETE /api/atlas/v2/groups/:groupId/clusters/:clusterName</code
		> — delete cluster
	</li>
</ul>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Database Users
</h3>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/databaseUsers</code
		> — list database users
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/databaseUsers/admin/:username</code
		> — get database user
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /api/atlas/v2/groups/:groupId/databaseUsers</code
		> — create database user
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>DELETE /api/atlas/v2/groups/:groupId/databaseUsers/admin/:username</code
		> — delete database user
	</li>
</ul>

<h3 class="mb-3 mt-8 text-base font-semibold text-neutral-900 dark:text-neutral-100">
	Data Explorer
</h3>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/clusters/:clusterName/databases</code
		> — list databases
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /api/atlas/v2/groups/:groupId/clusters/:clusterName/databases/:databaseName/collections</code
		> — list collections
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Data API
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	All operations via
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">POST</code>
	with JSON body specifying
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>dataSource</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>database</code
	>, and
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>collection</code
	>:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/findOne</code
		> — find one document
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/find</code
		> — find many (filter, projection, sort, limit, skip)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/insertOne</code
		> — insert one document
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/insertMany</code
		> — insert many documents
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/updateOne</code
		> — update one document (<code
			class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">$set</code
		>, upsert)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/updateMany</code
		> — update many documents
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/deleteOne</code
		> — delete one document
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/deleteMany</code
		> — delete many documents
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /app/data-api/v1/action/aggregate</code
		> — aggregation pipeline (<code
			class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">$match</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>$limit</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>$skip</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>$sort</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>$project</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>$count</code
		>)
	</li>
</ul>
