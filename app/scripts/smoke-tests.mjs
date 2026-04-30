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

const TEST_CUSTOMERS = [
  { email: "donaldgarcia@example.net", pin: "7912" },
  { email: "michellejames@example.com", pin: "1520" },
  { email: "laurahenderson@example.org", pin: "1488" },
  { email: "spenceamanda@example.org", pin: "2535" },
  { email: "glee@example.net", pin: "4582" },
  { email: "williamsthomas@example.net", pin: "4811" },
  { email: "justin78@example.net", pin: "9279" },
  { email: "jason31@example.com", pin: "1434" },
  { email: "samuel81@example.com", pin: "4257" },
  { email: "williamleon@example.net", pin: "9928" },
];

async function fetchJson(path) {
  const response = await fetch(`${baseUrl}${path}`);
  if (!response.ok) {
    throw new Error(`GET ${path} failed with ${response.status}`);
  }
  return response.json();
}

async function verifyCustomerPin(email, pin) {
  const response = await fetch(`${baseUrl}/api/test/verify-pin`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      pin,
    }),
  });

  const output = await response.json();
  return { status: response.status, output };
}

async function main() {
  console.log(`\n[smoke] Base URL: ${baseUrl}`);

  const mcpStatus = await fetchJson("/api/mcp");
  if (!mcpStatus.ok) {
    throw new Error("MCP connectivity test failed: /api/mcp returned ok=false.");
  }
  console.log(
    `[smoke] /api/mcp ok=true, toolCount=${mcpStatus.toolCount ?? "unknown"}`,
  );

  let passed = 0;
  const failures = [];

  for (const customer of TEST_CUSTOMERS) {
    try {
      const { status, output } = await verifyCustomerPin(
        customer.email,
        customer.pin,
      );
      const isSuccess = status === 200 && output?.code === "OK" && output?.ok;

      if (!isSuccess) {
        throw new Error(
          `Expected status=200 and code=OK, got status=${status} code=${output?.code ?? "undefined"} message=${output?.message ?? "n/a"}`,
        );
      }

      passed += 1;
      console.log(`[pass] ${customer.email}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push({ email: customer.email, message });
      console.log(`[fail] ${customer.email} -> ${message}`);
    }
  }

  console.log(`\n[summary] ${passed}/${TEST_CUSTOMERS.length} passed`);

  if (failures.length > 0) {
    console.log("[summary] Failures:");
    for (const failure of failures) {
      console.log(` - ${failure.email}: ${failure.message}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[fatal] ${message}`);
  process.exit(1);
});
