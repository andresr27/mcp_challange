# MCP Changelog

## 2026-04-30

### Added

- Implemented MCP client integration in `app/src/lib/mcp.ts` with dynamic tool discovery and tool calling.
- Added streaming chat API route at `app/src/app/api/chat/route.ts` using Vercel AI SDK + Gemini.
- Added dynamic MCP-to-AI tool bridge in `app/src/lib/meridian-tools.ts`.
- Added security gating to block `get_customer`, `list_orders`, `get_order`, and `create_order` before successful `verify_customer_pin`.
- Added frontend chat experience with:
  - `app/src/components/chat-container.tsx`
  - `app/src/components/message-bubble.tsx`
  - `app/src/components/order-card.tsx`
- Added MCP connectivity route `app/src/app/api/mcp/route.ts`.
- Added deterministic verification test route `app/src/app/api/test/verify-pin/route.ts`.
- Added smoke test script `app/scripts/smoke-tests.mjs` and npm scripts:
  - `test:smoke`
  - `test:smoke:local`
  - `test:smoke:vercel`
- Added structured JSON logging utility in `app/src/lib/logger.ts`.
- Added optional LangSmith tracing integration in `app/src/lib/langsmith.ts`.
- Added post-deploy verification script `app/scripts/post-deploy-checks.mjs`.
- Added screenshot placeholders in `images/` and embedded them in root documentation.
- Added Markdown + GFM table rendering support in chat UI via `react-markdown` and `remark-gfm`.

### Changed

- Replaced default Next.js starter page with Meridian Support chat UI in `app/src/app/page.tsx`.
- Improved tool error mapping and user-safe responses (invalid PIN, inventory issues, not found, timeouts).
- Added failed verification attempt tracking and escalation guidance to `1-800-MERIDIAN` after repeated failures.
- Updated `app/README.md` with local run, API checks, smoke tests, and deployment instructions.
- Updated root `README.md` with project overview and deployment notes.
- Updated `app/README.md` with:
  - LangSmith environment variable setup
  - structured logging behavior
  - custom domain runbook for `support.wido.uy`
  - `VERCEL_URL`-aware smoke test usage
- Updated chat orchestration to emit request/tool lifecycle logs with request IDs.
- Updated smoke tests to auto-derive deployment URL from `VERCEL_URL`.
- Updated chat model path to OpenRouter `google/gemini-3-flash-preview` with Google provider fallback.
- Updated `test:post-deploy:vercel` to explicitly target `https://support.wido.uy`.
- Updated root docs (`README.md`, `AGENTS.md`, `gameplan.md`) to reflect Phase 5 completion and current model/formatting behavior.

### Fixed

- Resolved AI SDK and schema typing issues for dynamic tools in production builds.
- Updated model configuration to a supported Gemini model for current provider behavior.
- Fixed Vercel deployment guidance for monorepo root-directory setup (`app`).
- Fixed OpenRouter compatibility issue by moving from Responses API usage to Chat Completions mode for tool-calling flows.
- Reduced false "Something went wrong" outcomes after successful tool output by stabilizing provider configuration.

### Next Steps

- Add CI workflow to run `npm run --prefix app test:post-deploy` after production deployments.
- Promote screenshot placeholders to versioned release assets and document update cadence.
- Expand observability with dashboard-level alerts for MCP timeout spikes and verification failure rate.
- Add negative automated tests for invalid PIN, missing product SKU, and insufficient inventory paths.
- Add retention/redaction policy for structured logs to protect sensitive operational metadata.