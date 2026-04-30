"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";

import { OrderCard } from "@/components/order-card";

type MessageBubbleProps = {
  message: UIMessage;
};

function toolNameFromPartType(type: string) {
  return type.startsWith("tool-") ? type.slice(5) : type;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isUser
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100"
        }`}
      >
        <div className="mb-2 text-[11px] uppercase tracking-wide opacity-70">
          {isUser ? "You" : "Meridian Support"}
        </div>

        <div className="space-y-3 whitespace-pre-wrap break-words">
          {message.parts.map((part, index) => {
            if (part.type === "text") {
              return <p key={`${message.id}-text-${index}`}>{part.text}</p>;
            }

            if (!isToolUIPart(part)) {
              return null;
            }

            const toolName =
              part.type === "dynamic-tool"
                ? part.toolName
                : toolNameFromPartType(part.type);

            if (part.state === "output-available") {
              return (
                <OrderCard
                  key={`${message.id}-tool-${index}`}
                  title={toolName}
                  content={part.output}
                />
              );
            }

            if (part.state === "output-error") {
              return (
                <OrderCard
                  key={`${message.id}-tool-error-${index}`}
                  title={`${toolName} error`}
                  content={part.errorText}
                />
              );
            }

            return (
              <p
                key={`${message.id}-tool-state-${index}`}
                className="text-xs text-zinc-500 dark:text-zinc-400"
              >
                Running `{toolName}`...
              </p>
            );
          })}
        </div>
      </div>
    </div>
  );
}
