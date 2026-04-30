import { dynamicTool, jsonSchema } from "ai";

import { callMcpTool, listMcpTools } from "@/lib/mcp";

const RESTRICTED_TOOLS = new Set([
  "get_customer",
  "list_orders",
  "get_order",
  "create_order",
]);

type VerificationState = {
  isVerified: () => boolean;
  markVerified: () => void;
  onToolStart?: (payload: {
    toolName: string;
    input: unknown;
    restricted: boolean;
  }) => void;
  onToolFinish?: (payload: {
    toolName: string;
    isError: boolean;
    code?: string;
    durationMs: number;
  }) => void;
};

type NormalizedMcpResult = {
  isError: boolean;
  text: string;
  structured: unknown;
};

function containsSuccessfulVerification(payload: unknown) {
  const serialized = JSON.stringify(payload).toLowerCase();
  return serialized.includes("success");
}

function extractErrorText(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === "string") {
    return error;
  }

  return JSON.stringify(error);
}

function mapToolError(toolName: string, text: string) {
  const normalized = text.toLowerCase();

  if (
    toolName === "verify_customer_pin" &&
    (normalized.includes("incorrect")
      || normalized.includes("invalid")
      || normalized.includes("not found")
      || normalized.includes("pin"))
  ) {
    return {
      code: "INVALID_PIN_OR_EMAIL",
      userMessage:
        "I couldn't verify those details. Please check your email and 4-digit PIN and try again.",
      retryable: true,
    };
  }

  if (normalized.includes("insufficientinventory")) {
    return {
      code: "INSUFFICIENT_INVENTORY",
      userMessage:
        "The requested quantity is not available in stock. Please adjust the order quantity.",
      retryable: false,
    };
  }

  if (normalized.includes("productnotfound")) {
    return {
      code: "PRODUCT_NOT_FOUND",
      userMessage:
        "I couldn't find that product. Please share the SKU or product name and I'll search alternatives.",
      retryable: false,
    };
  }

  if (normalized.includes("ordernotfound")) {
    return {
      code: "ORDER_NOT_FOUND",
      userMessage:
        "I couldn't locate that order. Please confirm the order ID and try again.",
      retryable: true,
    };
  }

  if (
    normalized.includes("timeout")
    || normalized.includes("timed out")
    || normalized.includes("econn")
    || normalized.includes("503")
    || normalized.includes("502")
    || normalized.includes("network")
  ) {
    return {
      code: "MCP_TIMEOUT",
      userMessage:
        "I'm having trouble reaching our inventory database. Please try again in a moment.",
      retryable: true,
    };
  }

  return {
    code: "MCP_TOOL_ERROR",
    userMessage:
      "I ran into an internal tool error while processing that request. Please try again.",
    retryable: true,
  };
}

function normalizeMcpResult(result: unknown): NormalizedMcpResult {
  if (!result || typeof result !== "object") {
    return {
      isError: false,
      text: typeof result === "string" ? result : "",
      structured: result ?? null,
    };
  }

  const typedResult = result as {
    content?: Array<{ type?: string; text?: string }>;
    structuredContent?: unknown;
    isError?: boolean;
  };

  const textOutput = typedResult.content
    ?.filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text)
    .join("\n")
    .trim();

  return {
    isError: Boolean(typedResult.isError),
    text: textOutput ?? "",
    structured: typedResult.structuredContent ?? null,
  };
}

export async function createMeridianToolSet(state: VerificationState) {
  const mcpTools = await listMcpTools();
  const tools: Record<string, ReturnType<typeof dynamicTool>> = {};

  for (const mcpTool of mcpTools) {
    const toolName = mcpTool.name;
    tools[toolName] = dynamicTool({
      description: mcpTool.description ?? "",
      inputSchema: jsonSchema(
        (mcpTool.inputSchema ?? { type: "object" }) as Record<string, unknown>,
      ),
      execute: async (input) => {
        const startedAt = Date.now();
        state.onToolStart?.({
          toolName,
          input,
          restricted: RESTRICTED_TOOLS.has(toolName),
        });

        if (RESTRICTED_TOOLS.has(toolName) && !state.isVerified()) {
          const response = {
            isError: true,
            code: "AUTH_REQUIRED",
            userMessage:
              "Identity verification is required first. Please provide your email and 4-digit PIN.",
            text: "",
            structured: null,
          };
          state.onToolFinish?.({
            toolName,
            isError: true,
            code: "AUTH_REQUIRED",
            durationMs: Date.now() - startedAt,
          });
          return response;
        }

        try {
          const rawResult = await callMcpTool(
            toolName,
            (input as Record<string, unknown>) ?? {},
          );
          const result = normalizeMcpResult(rawResult);

          if (result?.isError) {
            const mappedError = mapToolError(toolName, result.text ?? "");
            const response = {
              ...result,
              ...mappedError,
            };
            state.onToolFinish?.({
              toolName,
              isError: true,
              code: mappedError.code,
              durationMs: Date.now() - startedAt,
            });
            return response;
          }

          if (
            toolName === "verify_customer_pin" &&
            containsSuccessfulVerification(result)
          ) {
            state.markVerified();
          }

          const response = {
            ...result,
            code: "OK",
            retryable: false,
          };
          state.onToolFinish?.({
            toolName,
            isError: false,
            code: "OK",
            durationMs: Date.now() - startedAt,
          });
          return response;
        } catch (error) {
          const technicalMessage = extractErrorText(error);
          const mappedError = mapToolError(toolName, technicalMessage);

          const response = {
            isError: true,
            text: technicalMessage,
            structured: null,
            ...mappedError,
          };
          state.onToolFinish?.({
            toolName,
            isError: true,
            code: mappedError.code,
            durationMs: Date.now() - startedAt,
          });
          return response;
        }
      },
    });
  }

  return {
    tools,
    restrictedToolNames: Array.from(RESTRICTED_TOOLS),
  };
}

export function hasVerifiedCustomerInHistory(messages: unknown[]) {
  const serialized = JSON.stringify(messages).toLowerCase();
  return (
    serialized.includes("verify_customer_pin") && serialized.includes("success")
  );
}

export function countFailedVerificationAttempts(messages: unknown[]) {
  const serialized = JSON.stringify(messages).toUpperCase();
  const matches = serialized.match(/INVALID_PIN_OR_EMAIL/g);
  return matches ? matches.length : 0;
}
