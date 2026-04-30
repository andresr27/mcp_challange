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
3. Deploy and validate:
   - `/api/mcp`
   - `/api/chat`
   - UI flow at `/`
