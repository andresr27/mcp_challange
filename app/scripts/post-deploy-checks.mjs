#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://localhost:3000";
const baseUrlArgIndex = process.argv.indexOf("--baseUrl");
const vercelDerivedBaseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : undefined;
const baseUrl =
  (baseUrlArgIndex >= 0 ? process.argv[baseUrlArgIndex + 1] : undefined) ||
  process.env.BASE_URL ||
  vercelDerivedBaseUrl ||
  DEFAULT_BASE_URL;

async function runSmokeSuite() {
  const smokeUrl = `${baseUrl}/api/test/verify-pin`;
  console.log(`[post-deploy] Smoke suite via ${smokeUrl}`);

  const customers = [
    { email: "donaldgarcia@example.net", pin: "7912" },
    { email: "michellejames@example.com", pin: "1520" },
    { email: "laurahenderson@example.org", pin: "1488" },
  ];

  for (const customer of customers) {
    const response = await fetch(smokeUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customer),
    });
    const result = await response.json();
    if (!response.ok || result.code !== "OK") {
      throw new Error(
        `Smoke check failed for ${customer.email}: status=${response.status} code=${result.code ?? "n/a"}`,
      );
    }
  }

  console.log("[post-deploy] Smoke suite passed");
}

async function runChatHealthCheck() {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [
        {
          id: "post-deploy-chat-check",
          role: "user",
          parts: [{ type: "text", text: "List available monitors" }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`/api/chat failed with status ${response.status}`);
  }

  const text = await response.text();
  if (!text.includes('data: {"type":"start"}')) {
    throw new Error("Chat stream did not return a valid start event.");
  }

  console.log("[post-deploy] Chat stream health check passed");
}

async function runMcpHealthCheck() {
  const response = await fetch(`${baseUrl}/api/mcp`);
  if (!response.ok) {
    throw new Error(`/api/mcp failed with status ${response.status}`);
  }
  const result = await response.json();
  if (!result.ok) {
    throw new Error("/api/mcp returned ok=false");
  }

  console.log(
    `[post-deploy] MCP health passed (toolCount=${result.toolCount ?? "unknown"})`,
  );
}

async function main() {
  console.log(`[post-deploy] Base URL: ${baseUrl}`);
  await runMcpHealthCheck();
  await runSmokeSuite();
  await runChatHealthCheck();
  console.log("[post-deploy] All checks passed");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[post-deploy] FAILED: ${message}`);
  process.exit(1);
});
