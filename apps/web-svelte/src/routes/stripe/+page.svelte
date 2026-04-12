<h1 class="mb-6 text-2xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
	Stripe
</h1>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Stripe API emulation with customers, payment methods, customer sessions, payment intents,
	charges, products, prices, and checkout sessions. Includes a hosted checkout page and webhook
	delivery.
</p>

<h2
	class="mb-4 mt-12 text-lg font-semibold text-neutral-900 first:mt-0 dark:text-neutral-100"
>
	Customers
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/customers</code
		> — create customer
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/customers/:id</code
		> — retrieve customer
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/customers/:id</code
		> — update customer
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>DELETE /v1/customers/:id</code
		> — delete customer
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/customers</code
		> — list customers
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Payment Methods
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/payment_methods</code
		> — list payment methods
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Customer Sessions
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/customer_sessions</code
		> — create customer session
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Payment Intents
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/payment_intents</code
		> — create payment intent
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/payment_intents/:id</code
		> — retrieve payment intent
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/payment_intents/:id</code
		> — update payment intent
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/payment_intents/:id/confirm</code
		> — confirm payment intent
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/payment_intents/:id/cancel</code
		> — cancel payment intent
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/payment_intents</code
		> — list payment intents
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Charges
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/charges/:id</code
		> — retrieve charge
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/charges</code
		> — list charges
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Products
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/products</code
		> — create product
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/products/:id</code
		> — retrieve product
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/products</code
		> — list products
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">Prices</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/prices</code
		> — create price
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/prices/:id</code
		> — retrieve price
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/prices</code
		> — list prices
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Checkout Sessions
</h2>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/checkout/sessions</code
		> — create checkout session
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/checkout/sessions/:id</code
		> — retrieve session
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /v1/checkout/sessions/:id/expire</code
		> — expire session
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /v1/checkout/sessions</code
		> — list sessions (filter by
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>customer</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>status</code
		>,
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>payment_status</code
		>)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>GET /checkout/:id</code
		> — hosted checkout page (HTML)
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>POST /checkout/:id/complete</code
		> — complete payment flow
	</li>
</ul>

<h2 class="mb-4 mt-12 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
	Webhooks
</h2>

<p class="mb-4 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
	Events are delivered to configured webhook URLs:
</p>

<ul class="mb-4 list-disc space-y-1 pl-5 text-sm">
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>checkout.session.completed</code
		> — when a checkout session is completed
	</li>
	<li class="text-neutral-600 dark:text-neutral-400">
		<code class="rounded bg-neutral-100 px-1.5 py-0.5 text-[13px] dark:bg-neutral-800"
			>checkout.session.expired</code
		> — when a checkout session expires
	</li>
</ul>
