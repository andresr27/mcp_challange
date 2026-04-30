"use client";

type OrderCardProps = {
  title: string;
  content: unknown;
};

function formatContent(content: unknown) {
  if (content == null) {
    return "No data returned.";
  }

  if (typeof content === "string") {
    return content;
  }

  return JSON.stringify(content, null, 2);
}

export function OrderCard({ title, content }: OrderCardProps) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {title}
      </p>
      <pre className="whitespace-pre-wrap break-words">{formatContent(content)}</pre>
    </div>
  );
}
