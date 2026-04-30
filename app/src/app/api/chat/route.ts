import { createGoogleGenerativeAI, google } from "@ai-sdk/google";
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";

import {
  countFailedVerificationAttempts,
  createMeridianToolSet,
  hasVerifiedCustomerInHistory,
} from "@/lib/meridian-tools";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const SYSTEM_PROMPT = `
You are a Meridian Electronics support representative.
Be professional, helpful, and concise.

Security requirements:
- Before any account/order-sensitive action, ask for customer email and 4-digit PIN.
- You must verify identity with verify_customer_pin first.
- Never call get_customer, list_orders, get_order, or create_order before verification succeeds.
- If PIN verification fails, allow up to 3 attempts, then suggest phone support at 1-800-MERIDIAN.

Privacy requirements:
- Never reveal full addresses or full credit card details.
- Return order status and product information only.

Operational requirements:
- Use only Meridian MCP tools for product/order data.
- If inventory lookup fails or MCP times out, apologize and say:
  "I'm having trouble reaching our inventory database. Please try again in a moment."
- When a tool returns isError=true, explain the userMessage field to the user and suggest the next action.
`;

type ChatRequest = {
  messages: UIMessage[];
};

function getGoogleModel() {
  const apiKey =
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    return google("gemini-2.5-flash");
  }

  const provider = createGoogleGenerativeAI({
    apiKey,
  });

  return provider("gemini-2.5-flash");
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ChatRequest;
    const messages = Array.isArray(body.messages) ? body.messages : [];

    let isVerified = hasVerifiedCustomerInHistory(messages);
    const failedVerificationAttempts = countFailedVerificationAttempts(messages);
    const runtimeInstruction =
      failedVerificationAttempts >= 3
        ? "The customer has already failed verification 3 times. Suggest phone support at 1-800-MERIDIAN before attempting another sensitive action."
        : "";

    const { tools, restrictedToolNames } = await createMeridianToolSet({
      isVerified: () => isVerified,
      markVerified: () => {
        isVerified = true;
      },
    });

    const modelMessages = await convertToModelMessages(messages, { tools });
    const activeTools = isVerified
      ? undefined
      : Object.keys(tools).filter((toolName) => {
          return !restrictedToolNames.includes(toolName);
        });

    const result = streamText({
      model: getGoogleModel(),
      system: `${SYSTEM_PROMPT}\n${runtimeInstruction}`.trim(),
      messages: modelMessages,
      tools,
      activeTools,
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse({
      onError: () => {
        return "I'm having trouble reaching our inventory database. Please try again in a moment.";
      },
    });
  } catch {
    return Response.json(
      {
        ok: false,
        error:
          "I'm having trouble reaching our inventory database. Please try again in a moment.",
      },
      { status: 500 },
    );
  }
}
