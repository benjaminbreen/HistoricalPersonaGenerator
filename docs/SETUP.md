# Setup

Everything needed to run, configure, and deploy the app. The [README](../README.md) covers what it does.

## Getting Started

### Install

```bash
npm install
```

### Run Locally

```bash
npm run dev
```

The app will be available at:

```text
http://localhost:3001
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Gemini Setup

Source-backed persona generation can use Gemini to fill the historical persona annotation schema. For local development, add a Gemini key to `.env.local`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-3.1-flash-lite
```

The Vite dev server exposes a local `/api/gemini-persona` middleware and keeps this key server-side during development. The static browser bundle does not call Gemini directly. Do not use `VITE_GEMINI_API_KEY` or any other `VITE_*` variable for secrets: Vite includes those values in the browser build.

The OpenAI models are the default, and the AI dialog carries a Luna/Nano toggle
so the two can be compared on the same persona. One key covers both:

```bash
OPENAI_API_KEY=your_key_here
```

Model ids are overridable per variant, so a rename upstream is a config change
rather than a deploy. `api/_lib/llm.js` holds the defaults:

```bash
LUNA_MODEL=gpt-5.6-luna   # the default variant
NANO_MODEL=gpt-5-nano
```

`OPENAI_MODEL` is no longer read. It used to set one id for the whole
deployment, which would now resolve both toggle positions to the same model and
make the comparison meaningless — set the two variant keys instead.

Without `OPENAI_API_KEY`, a deployment that has a Gemini key falls back to
Gemini and logs that it did, so adding the OpenAI key can happen after the
deploy rather than before it. `LLM_PROVIDER=gemini` still pins Gemini outright.

On Vercel, add these in **Project Settings → Environment Variables** (Production,
Preview, and/or Development as appropriate). Do not create
`VITE_GEMINI_API_KEY`, `VITE_GOOGLE_AI_API_KEY`, or `VITE_OPENAI_API_KEY`
variables.

### Reading the cost of a call

Every model call logs one line to the platform log:

```
[llm] {"input":4821,"output":233,"reasoning":0,"variant":"luna","model":"gpt-5.6-luna","action":"generate_sketch","promptVersion":"1","promptChars":19204,"ms":1840,"truncated":false}
```

That is what makes a model comparison a measurement rather than an impression —
published per-token prices say nothing about how many tokens each model
actually spends on this workload. `promptVersion` is bumped by hand in
`api/_lib/llm.js` when a prompt changes materially, so a later "did that edit
help?" can be answered against real traffic.

Output ceilings and reasoning effort live in the same file, in `TASK_BUDGETS`.
Effort is always sent explicitly: left unset, a reasoning model spends its own
default number of reasoning tokens, and those bill as output while never
appearing in the response.

For production-style local serving:

```bash
npm run build
npm start
```

`npm start` reads `.env.local` (then `.env`) directly; real environment variables still win, so `GEMINI_API_KEY=... npm start` also works.

### What each AI action costs

Two model actions exist, and they are priced very differently per persona:

| Action | Tokens (in/out) | Cost | Triggered by |
| --- | --- | --- | --- |
| `generate_sketch` | ~1.6k / 0.2k | ~0.07¢ | **Use AI to Develop Persona** (the default) |
| `generate_annotation` | ~7.5k / 1.6k | ~0.43¢ | **AI Schema Record**, and the Source Studio flows |

The annotation prompt carries the whole JSON schema — about 6,500 tokens of the 7,500 it sends — which is why it dominates. The default AI path therefore builds the schema record locally from the procedural seed and pays only for the biography.

### Free use and supporter credits

Each browser receives five free AI biographies. The third request shows a
prominent donation appeal but can still continue; the sixth is stopped.
Procedural personas remain free and unlimited. A verified donation grants 50 AI
credits for 30 days:

- an AI biography uses 1 credit
- a full annotation/schema call uses 6 credits

The limit is enforced in `/api/gemini-persona`, not just in the browser. Visitor
identity is an anonymous, signed, `HttpOnly` cookie; usage and supporter
entitlements are stored in the project’s private Vercel Blob store. Locally they
are written to the ignored `.ai-access/` directory.

Add these production environment variables:

```bash
AI_ACCESS_SECRET=a-long-random-secret
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_DONATION_URL=https://buy.stripe.com/...
STRIPE_AI_PAYMENT_LINK_ID=plink_...
```

`STRIPE_DONATION_URL` defaults to the project’s current donation link.
`STRIPE_AI_PAYMENT_LINK_ID` is optional but strongly recommended so unrelated
Stripe Payment Links cannot grant app credits. `AI_ACCESS_SECRET` falls back to
the server-side Gemini key for compatibility, but a separate random secret is
preferred.

In Stripe:

1. Add a webhook destination at
   `https://historical-persona-generator.vercel.app/api/stripe-webhook`.
2. Subscribe it to `checkout.session.completed` and
   `checkout.session.async_payment_succeeded`.
3. Copy the destination signing secret into `STRIPE_WEBHOOK_SECRET`.
4. Copy the Payment Link’s `plink_...` ID into
   `STRIPE_AI_PAYMENT_LINK_ID`, then redeploy.

The app adds a `client_reference_id` to its payment link. The Stripe webhook
uses that opaque ID to grant access to the same browser; it never trusts a
client-side “I donated” flag. Clearing browser cookies creates a new anonymous
identity, so account-level enforcement would require adding sign-in.

### Rate limits

`/api/gemini-persona` is public, so every route enforces a cost-weighted limit (a schema record counts six times a biography). Defaults, overridable per environment:

```bash
LLM_HOURLY_COST_PER_IP=30     # ~30 biographies or 5 schema records per IP per hour
LLM_DAILY_COST_PER_IP=120
LLM_DAILY_COST_GLOBAL=3000    # backstop on the daily bill (~$3/day at current prices)
```

Over the limit the route returns `429` with `Retry-After`, and the app falls back to procedural generation with a visible notice. Counters live in process memory, so on Vercel they are per warm instance; move them to KV if you need a hard global cap.

Current source-backed records use annotation schema `1.1.0`. The schema keeps `1.0.0` records valid, while new generation prefers compact cross-cultural fields for social position, constraint regimes, public world, religious practice, normative world, and interaction style.

## Persona Share Links

The Share action saves an immutable, versioned snapshot and produces a short URL
such as `/?p=AbCdEf123...`. This preserves the exact procedural or LLM-generated
persona instead of trying to reproduce it from a random seed.

For Vercel production:

1. Open the project’s **Storage** tab.
2. Create a **Private Blob** store and connect it to the project.
3. Confirm that Vercel added `BLOB_READ_WRITE_TOKEN`, or the OIDC-based
   `BLOB_STORE_ID` configuration, to the project.
4. Redeploy.

No storage credential is exposed to the browser. `/api/persona-share` validates,
sanitizes, size-limits, and stores each snapshot server-side. Locally, when Blob
credentials are absent, the same endpoint writes ignored development records to
`.persona-shares/`.

Shared snapshots include the rendered character data, selected portrait engine,
and—when present—the displayed annotation/evidence record and generated sketch.
They deliberately exclude raw pasted source text, uploaded document contents,
source-input form state, and API credentials. Share links should still be
treated as public: anyone with the URL can view the saved persona.

## Developer Tools

### Portrait Gallery

A lightweight portrait QA gallery is available during development:

```text
http://localhost:3001/#portrait-gallery
```

It shows fixed seeded fixtures for checking clothing, headgear, source-derived visual cues, scars/weathering, and regional portrait behavior.
