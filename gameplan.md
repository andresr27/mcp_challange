**Title:** Meridian Support Chatbot Implementation Strategy  
**Engineer:** Gemini (AI Collaborator)  
**Timeline:** 180 Minutes  

#### Phase 1: Infrastructure & Discovery (Minutes 0–30)

- **Next.js Scaffold:** Initialize App Router project with Tailwind CSS and Lucide.
- **MCP Handshake:** Establish connection to `https://order-mcp-74afyau24q-uc.a.run.app/mcp` using the `@modelcontextprotocol/sdk`.
- **Tool Introspection:** Dynamically fetch the list of 8 tools (`list_products`, `verify_customer_pin`, etc.) to verify connectivity.

#### Phase 2: The Logic Engine (Minutes 30–90)

- **Dynamic Tool Mapping:** Implement the bridge that maps Meridian’s MCP JSON schemas to the Vercel AI SDK `tool` format.
- **Auth Middleware Logic:** Encode the "Security-First" requirement. The agent must be instructed to never call `list_orders` without a successful `verify_customer_pin` response in the chat history.
- **Stream Implementation:** Set up `streamText` with Gemini 1.5 Flash for cost-efficiency.

#### Phase 3: The Front-End (Minutes 90–140)

- **Component Architecture:** Create a `ChatContainer`, `MessageBubble` (with distinct User/Bot styles), and `OrderCard` (for rendering tool results like SKUs or Order Status).
- **Loading States:** Implement optimistic UI updates and "Agent is thinking..." indicators to manage latency during MCP tool execution.

#### Phase 4: Production Readiness & Deploy (Minutes 140–180)

- **Error Handling:** Wrap tool calls in try/catch blocks. If the MCP server returns an error, the bot should explain the issue (e.g., "Invalid PIN") rather than crashing.
- **Vercel Deployment:** Push to production, configure environment variables, and verify the live URL.
- **Documentation:** Finalize `README.md` and `AGENTS.md`.

#### Phase 5: Reliability, Domain, and Observability (Minutes 180–240)

- **Vercel Smoke Tests:** Run post-deploy smoke tests against the production URL (`/api/mcp` + `/api/test/verify-pin`) and fail rollout if any critical check fails.
- **Structured Logging:** Implement JSON structured logs for chat requests, MCP tool calls, verification outcomes, and error categories (with request IDs and timestamps).
- **Custom Domain Setup:** Configure and validate `support.wido.uy` in Vercel (DNS records, SSL certificate, and production alias verification).
- **LangSmith Observability:** Add LangSmith tracing for request lifecycle, model calls, tool invocations, and latency/error metrics with environment-based toggles.

