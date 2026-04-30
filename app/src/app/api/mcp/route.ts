import { listMcpTools, MCP_SERVER_URL } from "@/lib/mcp";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const tools = await listMcpTools();

    return Response.json({
      ok: true,
      serverUrl: MCP_SERVER_URL,
      toolCount: tools.length,
      tools: tools.map((tool) => ({
        name: tool.name,
        description: tool.description ?? "",
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MCP error";

    return Response.json(
      {
        ok: false,
        serverUrl: MCP_SERVER_URL,
        error: message,
      },
      { status: 502 },
    );
  }
}
