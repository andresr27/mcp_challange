import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Use a fallback for the URL to prevent crashes
const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "https://order-mcp-74afyau24q-uc.a.run.app/mcp";

export async function getMcpClient() {
  try {
    const transport = new StreamableHTTPClientTransport(new URL(MCP_SERVER_URL));
    
    const client = new Client({
      name: "meridian-web-prototype",
      version: "1.0.0",
    }, {
      capabilities: {
        tools: {} 
      }
    });

    await client.connect(transport);
    return client;
  } catch (error) {
    console.error("❌ MCP Connection Error:", error);
    throw error;
  }
}