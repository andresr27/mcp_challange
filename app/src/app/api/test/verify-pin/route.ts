import { callMcpTool } from "@/lib/mcp";

export const dynamic = "force-dynamic";

type VerifyPinRequest = {
  email?: string;
  pin?: string;
};

function extractText(result: unknown) {
  if (!result || typeof result !== "object") {
    return "";
  }

  const typedResult = result as {
    content?: Array<{ type?: string; text?: string }>;
  };

  return (
    typedResult.content
      ?.filter((part) => part.type === "text" && typeof part.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim() ?? ""
  );
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as VerifyPinRequest;
    const email = body.email?.trim();
    const pin = body.pin?.trim();

    if (!email || !pin) {
      return Response.json(
        { ok: false, code: "INVALID_INPUT", message: "email and pin required" },
        { status: 400 },
      );
    }

    try {
      const result = await callMcpTool("verify_customer_pin", { email, pin });
      const text = extractText(result);

      return Response.json({
        ok: true,
        code: "OK",
        message: text || "Verification succeeded.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const normalized = message.toLowerCase();
      const invalidPin =
        normalized.includes("incorrect") ||
        normalized.includes("invalid") ||
        normalized.includes("not found") ||
        normalized.includes("pin");

      return Response.json(
        {
          ok: false,
          code: invalidPin ? "INVALID_PIN_OR_EMAIL" : "MCP_ERROR",
          message,
        },
        { status: invalidPin ? 401 : 502 },
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid request";
    return Response.json(
      {
        ok: false,
        code: "REQUEST_ERROR",
        message,
      },
      { status: 400 },
    );
  }
}
