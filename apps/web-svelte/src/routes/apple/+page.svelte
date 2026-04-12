<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Apple Sign In
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Sign in with Apple emulation with authorization code flow, PKCE support, RS256 ID tokens, and
	OIDC discovery.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Endpoints
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /.well-known/openid-configuration</code
		> - OIDC discovery document
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /auth/keys</code
		> - JSON Web Key Set (JWKS)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /auth/authorize</code
		> - authorization endpoint (shows user picker)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /auth/token</code
		> - token exchange (authorization code and refresh token grants)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /auth/revoke</code
		> - token revocation
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Authorization Flow
</h2>

<ol class="mb-4 list-decimal space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		Redirect the user to
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>/auth/authorize</code
		>
		with
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>client_id</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>redirect_uri</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>scope</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>state</code
		>, and optionally
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>nonce</code
		>
		and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>response_mode</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		The emulator renders a user picker page where the user selects a seeded account
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		On selection, the emulator redirects (or auto-submits a form for
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>form_post</code
		>
		mode) to
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>redirect_uri</code
		>
		with
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>code</code
		>
		and
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>state</code
		>
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		On the first authorization per user/client pair, a
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>user</code
		> JSON blob is also included (matching Apple's real behavior)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		Exchange the code for tokens via
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /auth/token</code
		>
	</li>
</ol>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	ID Token
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	The <code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>id_token</code
	>
	is an RS256 JWT containing
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">sub</code>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">email</code>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>email_verified</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>is_private_email</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>real_user_status</code
	>,
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>auth_time</code
	>, and optional
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800">nonce</code>.
</p>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Users with
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>is_private_email: true</code
	>
	in the seed config receive a generated
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>@privaterelay.appleid.com</code
	>
	email in the
	<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
		>id_token</code
	> instead of their real email, matching Apple's Hide My Email behavior.
</p>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Supported Parameters
</h2>

<table>
	<thead>
		<tr>
			<th>Param</th>
			<th>Description</th>
		</tr>
	</thead>
	<tbody>
		<tr>
			<td><code>client_id</code></td>
			<td>OAuth client ID (Apple Services ID)</td>
		</tr>
		<tr>
			<td><code>redirect_uri</code></td>
			<td>Callback URL</td>
		</tr>
		<tr>
			<td><code>scope</code></td>
			<td>Space-separated scopes (<code>openid email name</code>)</td>
		</tr>
		<tr>
			<td><code>state</code></td>
			<td>Opaque state for CSRF protection</td>
		</tr>
		<tr>
			<td><code>nonce</code></td>
			<td>Nonce for ID token (optional)</td>
		</tr>
		<tr>
			<td><code>response_mode</code></td>
			<td>
				<code>query</code> (default), <code>form_post</code>, or <code>fragment</code>
			</td>
		</tr>
	</tbody>
</table>
