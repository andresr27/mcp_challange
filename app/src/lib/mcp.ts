import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_SERVER_URL =
  process.env.MCP_SERVER_URL || "https://order-mcp-74afyau24q-uc.a.run.app/mcp";

function createMcpClient() {
  return new Client(
    {
      name: "meridian-support-api",
      version: "0.1.0",
    },
    {
      capabilities: {
      },
    },
  );
}

async function withMcpClient<T>(fn: (client: Client) => Promise<T>) {
  const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
  const client = createMcpClient();

  try {
    await client.connect(transport);
    return await fn(client);
  } finally {
    await client.close();
  }
}

export async function listMcpTools() {
  return withMcpClient(async (client) => {
    const response = await client.listTools();
    return response.tools;
  });
}

export async function callMcpTool(
  name: string,
  args: Record<string, unknown> = {},
) {
  return withMcpClient((client) => client.callTool({ name, arguments: args }));
}

export { MCP_SERVER_URL };
