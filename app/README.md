# Meridian Support App

Next.js App Router chatbot that uses:

- `@modelcontextprotocol/sdk` to discover and call Meridian MCP tools
- Vercel AI SDK (`ai` + `@ai-sdk/react`) for chat streaming and tool orchestration
- Google Gemini (`@ai-sdk/google`) for the language model

## Features implemented

- MCP handshake + tool introspection at runtime (`/api/mcp`)
- Dynamic mapping of MCP JSON schemas to AI SDK tools
- Streaming chat API (`/api/chat`) and chat UI
- Security-first tool gating:
  - `get_customer`, `list_orders`, `get_order`, and `create_order` are blocked until `verify_customer_pin` succeeds
- Phase 4 error hardening:
  - Friendly user-facing MCP/tool errors (invalid PIN, missing product, insufficient inventory, timeouts)
  - Timeout fallback message:
    - "I'm having trouble reaching our inventory database. Please try again in a moment."
  - Tracks failed PIN attempts and prompts phone support after 3 failed checks
- Phase 5 reliability and observability:
  - Structured JSON logging with request IDs for chat and tool lifecycle events
  - Optional LangSmith tracing (env-gated)
  - Production smoke test automation for Vercel deployments

## Environment variables

Create `app/.env.local`:

```bash
MCP_SERVER_URL=https://order-mcp-74afyau24q-uc.a.run.app/mcp
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

Alternative key fallback is supported:

```bash
GOOGLE_API_KEY=your_google_key
```

Optional LangSmith observability:

```bash
LANGSMITH_TRACING=true
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=meridian-support
# optional override:
# LANGSMITH_ENDPOINT=https://api.smith.langchain.com
```

## Local development

From `app/`:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test checklist

### 1) MCP connectivity

```bash
curl http://localhost:3000/api/mcp
```

Expect `ok: true` and `toolCount: 8`.

### 2) Chat streaming

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"id":"1","role":"user","parts":[{"type":"text","text":"List available monitors"}]}]}'
```

Expect streamed events with tool call + text output.

### 3) Security gating

In UI, ask: `List my orders`.

Expected behavior:
- assistant asks for email + 4-digit PIN first
- restricted tools are not available until successful verification

### 4) Invalid PIN flow

Fail verification 3 times.

Expected behavior:
- assistant returns verification failure guidance
- assistant suggests calling `1-800-MERIDIAN`

## Automated smoke tests (local + Vercel)

The project includes a PIN verification smoke test script using your 10 test accounts:

- `donaldgarcia@example.net / 7912`
- `michellejames@example.com / 1520`
- `laurahenderson@example.org / 1488`
- `spenceamanda@example.org / 2535`
- `glee@example.net / 4582`
- `williamsthomas@example.net / 4811`
- `justin78@example.net / 9279`
- `jason31@example.com / 1434`
- `samuel81@example.com / 4257`
- `williamleon@example.net / 9928`

What it checks:

1. `/api/mcp` is healthy (`ok: true`)
2. `/api/test/verify-pin` verifies each customer PIN and receives `code=OK`

### Run locally

Start dev server first:

```bash
npm run dev
```

Then, in another terminal:

```bash
npm run test:smoke:local
```

### Run against Vercel deployment

```bash
BASE_URL="https://your-production-domain.vercel.app" npm run test:smoke:vercel
```

Or:

```bash
BASE_URL="https://your-production-domain.vercel.app" npm run test:smoke
```

If running in Vercel CI, you can also rely on `VERCEL_URL` automatically:

```bash
npm run test:smoke:vercel:auto
```

### Post-deploy verification script

Runs three checks:

1. `/api/mcp` health
2. deterministic verify-pin smoke subset
3. `/api/chat` streaming start event

Local:

```bash
npm run test:post-deploy:local
```

Vercel (explicit URL):

```bash
BASE_URL="https://your-production-domain.vercel.app" npm run test:post-deploy:vercel
```

Vercel CI (auto via `VERCEL_URL`):

```bash
npm run test:post-deploy
```

## Structured logging

`/api/chat` now emits JSON logs with:

- `requestId`
- `route`
- event names (`chat.request.received`, `tool.call.start`, `tool.call.finish`, `chat.stream.finish`, etc.)
- timings (`durationMs`) and status fields (`code`, `isError`)

Use your log pipeline (Vercel logs, Datadog, ELK, etc.) to filter/group by `requestId`.

## Production build

```bash
npm run lint
npm run build
npm run start
```

## Deploy (Vercel)

1. Import `app/` as a Vercel project.
2. Set env vars in Vercel Project Settings:
   - `MCP_SERVER_URL`
   - `GOOGLE_GENERATIVE_AI_API_KEY` (or `GOOGLE_API_KEY`)
   - Optional: `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`
3. Deploy and validate:
   - `/api/mcp`
   - `/api/chat`
   - UI flow at `/`

## Custom domain runbook (`support.wido.uy`)

1. In Vercel Project Settings -> Domains, add `support.wido.uy`.
2. Add DNS records exactly as Vercel indicates (typically CNAME for subdomains).
3. Wait for SSL certificate issuance and status `Valid Configuration`.
4. Re-run production smoke tests against the custom domain:

```bash
BASE_URL="https://support.wido.uy" npm run test:smoke:vercel
```
