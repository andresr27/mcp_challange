"use client";

import type { UIMessage } from "ai";
import { isToolUIPart } from "ai";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";


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
              return (
                <div
                  key={`${message.id}-text-${index}`}
                  className="prose prose-sm max-w-none dark:prose-invert prose-table:border prose-th:px-2 prose-th:py-1 prose-td:px-2 prose-td:py-1"
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {part.text}
                  </ReactMarkdown>
                </div>
              );
            }

            if (!isToolUIPart(part)) {
              return null;
            }

            const toolName =
              part.type === "dynamic-tool"
                ? part.toolName
                : toolNameFromPartType(part.type);

            if (part.state === "output-available") {
              // Tool outputs are consumed by the model and rendered as
              // assistant markdown text. Avoid duplicating raw JSON in UI.
              return null;
            }

            if (part.state === "output-error") {
              return (
                <p
                  key={`${message.id}-tool-error-${index}`}
                  className="text-xs text-red-600 dark:text-red-400"
                >
                  Tool `{toolName}` error: {part.errorText}
                </p>
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
