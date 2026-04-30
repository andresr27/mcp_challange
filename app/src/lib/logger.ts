type LogLevel = "debug" | "info" | "warn" | "error";

type LogPayload = Record<string, unknown> & {
  event: string;
};

function write(level: LogLevel, payload: LogPayload) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    ...payload,
  };

  const serialized = JSON.stringify(entry);
  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export function createLogger(context: Record<string, unknown> = {}) {
  return {
    debug(event: string, payload: Record<string, unknown> = {}) {
      write("debug", { event, ...context, ...payload });
    },
    info(event: string, payload: Record<string, unknown> = {}) {
      write("info", { event, ...context, ...payload });
    },
    warn(event: string, payload: Record<string, unknown> = {}) {
      write("warn", { event, ...context, ...payload });
    },
    error(event: string, payload: Record<string, unknown> = {}) {
      write("error", { event, ...context, ...payload });
    },
  };
}
