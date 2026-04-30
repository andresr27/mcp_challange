"use client";

import { useMemo, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";

import { MessageBubble } from "@/components/message-bubble";

export function ChatContainer() {
  const [input, setInput] = useState("");
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
      }),
    [],
  );

  const { messages, sendMessage, status, stop, error } = useChat({
    transport,
  });

  const isBusy = status === "submitted" || status === "streaming";

  return (
    <main className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col p-4 sm:p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Meridian Support Assistant
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ask about products, order status, or placing a new order.
        </p>
      </div>

      <section className="flex-1 space-y-3 overflow-y-auto rounded-xl border border-zinc-200 bg-zinc-100/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/50">
        {messages.length === 0 ? (
          <div className="rounded-xl bg-white p-4 text-sm text-zinc-600 dark:bg-zinc-900 dark:text-zinc-300">
            Start with product questions like &quot;List available monitors&quot;
            or &quot;Show laptops under $1000.&quot;
          </div>
        ) : null}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}

        {isBusy ? (
          <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
            Agent is thinking...
          </div>
        ) : null}

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            Something went wrong. Please try again.
          </div>
        ) : null}
      </section>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          if (!input.trim() || isBusy) {
            return;
          }

          sendMessage({ text: input.trim() });
          setInput("");
        }}
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-zinc-700"
          placeholder="Ask Meridian Support..."
          disabled={isBusy}
        />
        {isBusy ? (
          <button
            type="button"
            onClick={() => stop()}
            className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Stop
          </button>
        ) : (
          <button
            type="submit"
            className="rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Send
          </button>
        )}
      </form>
    </main>
  );
}
