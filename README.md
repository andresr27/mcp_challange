# Meridian Electronics MCP Chatbot

Meridian Support chatbot built with Next.js, Vercel AI SDK, Google Gemini, and an `order-mcp` backend.

## Project structure

- `app/`: production Next.js application (UI + API routes)
- `src/`: early prototype scripts and experiments
- `gameplan.md`: implementation plan (Phases 1-4)
- `AGENTS.md`: behavior and security guardrails

## Current status

All planned phases are implemented in `app/`:

- **Phase 1:** MCP connectivity and tool introspection
- **Phase 2:** Dynamic MCP tool mapping + auth-first tool gating
- **Phase 3:** Chat UI (`ChatContainer`, `MessageBubble`, `OrderCard`)
- **Phase 4:** Error hardening, deployment docs, and deterministic smoke tests
- **Phase 5:** Post-deploy checks, structured logging, custom domain runbook, and LangSmith observability

## Run locally

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required environment variables

Set in `app/.env.local` (local) and Vercel Project Settings (production):

```bash
MCP_SERVER_URL=https://order-mcp-74afyau24q-uc.a.run.app/mcp
GOOGLE_GENERATIVE_AI_API_KEY=your_google_key
```

Fallback supported:

```bash
GOOGLE_API_KEY=your_google_key
```

## API endpoints

- `GET /api/mcp`: MCP connectivity + tool list
- `POST /api/chat`: streaming chat with dynamic tool calls
- `POST /api/test/verify-pin`: deterministic verification endpoint for tests

## Smoke tests

From `app/`:

```bash
npm run test:smoke:local
```

Against Vercel:

```bash
BASE_URL="https://your-domain.vercel.app" npm run test:smoke:vercel
```

Post-deploy verification (MCP health + smoke subset + chat stream):

```bash
npm run --prefix app test:post-deploy:vercel
```

## Deploy to Vercel

1. Import this repo in Vercel.
2. Set **Root Directory** to `app`.
3. Add environment variables listed above.
4. Deploy and verify:
   - `/`
   - `/api/mcp`
   - `/api/chat`

## Screenshots

### Smoke test evidence

![Smoke tests](images/tests-smoke-placeholder.png)

### Vercel production UI

![Vercel UI](images/ui-vercel-placeholder.png)

### LangSmith observability

![LangSmith observability](images/ui-langsmith-placeholder.png)
