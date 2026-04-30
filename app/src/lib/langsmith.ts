type TraceStartParams = {
  name: string;
  requestId: string;
  input: unknown;
  metadata?: Record<string, unknown>;
};

type TraceFinishParams = {
  output?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
};

function getConfig() {
  const enabled = process.env.LANGSMITH_TRACING === "true";
  const apiKey = process.env.LANGSMITH_API_KEY;
  const endpoint =
    process.env.LANGSMITH_ENDPOINT?.replace(/\/$/, "") ??
    "https://api.smith.langchain.com";
  const project = process.env.LANGSMITH_PROJECT ?? "meridian-support";

  return { enabled, apiKey, endpoint, project };
}

async function send(
  method: "POST" | "PATCH",
  url: string,
  apiKey: string,
  payload: Record<string, unknown>,
) {
  await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(payload),
  });
}

export async function startLangSmithTrace(params: TraceStartParams) {
  const config = getConfig();
  if (!config.enabled || !config.apiKey) {
    return {
      enabled: false as const,
      async finish(finishPayload: TraceFinishParams) {
        void finishPayload;
      },
    };
  }

  const runId = crypto.randomUUID();

  try {
    await send("POST", `${config.endpoint}/runs`, config.apiKey, {
      id: runId,
      name: params.name,
      run_type: "chain",
      session_name: config.project,
      start_time: new Date().toISOString(),
      inputs: params.input,
      extra: {
        metadata: {
          requestId: params.requestId,
          ...params.metadata,
        },
      },
    });
  } catch {
    // Best effort only. Never break app request path.
    return {
      enabled: false as const,
      async finish(finishPayload: TraceFinishParams) {
        void finishPayload;
      },
    };
  }

  return {
    enabled: true as const,
    async finish(finish: TraceFinishParams) {
      try {
        await send(
          "PATCH",
          `${config.endpoint}/runs/${runId}`,
          config.apiKey!,
          {
            end_time: new Date().toISOString(),
            outputs: finish.output ?? {},
            error: finish.error,
            extra: {
              metadata: finish.metadata ?? {},
            },
          },
        );
      } catch {
        // Best effort only.
      }
    },
  };
}
