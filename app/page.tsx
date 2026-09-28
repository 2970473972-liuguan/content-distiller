"use client";

import { useState } from "react";

type Mode = "summary" | "plot-cards" | "reading-notes";

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: "summary", label: "精简摘要", hint: "几段话讲清楚这段内容在说什么" },
  { id: "plot-cards", label: "情节 + 人物卡片", hint: "拆出关键情节节点和主要人物" },
  { id: "reading-notes", label: "读书笔记", hint: "提炼值得记下来的观点与细节" },
];

export default function Home() {
  const [mode, setMode] = useState<Mode>("summary");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDistill() {
    if (!input.trim()) {
      setError("先粘贴一段文字,再开始蒸馏。");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: input, mode }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "蒸馏失败,请稍后再试。");
      }
      const data = await res.json();
      setResult(data.result as string);
    } catch (err) {
      setError(err instanceof Error ? err.message : "蒸馏失败,请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-ink px-6 py-16 sm:py-24">
      <div className="mx-auto max-w-[640px]">
        <header className="mb-12">
          <h1 className="font-serif text-4xl font-medium leading-tight text-text sm:text-5xl">
            把一段故事,
            <br />
            蒸馏成它的核心。
          </h1>
          <p className="mt-4 max-w-[46ch] text-[15px] leading-relaxed text-muted">
            粘贴一段小说节选或视频文案,选一种蒸馏方式,几秒钟拿到你真正需要的那部分内容。
          </p>
        </header>

        <section className="mb-6 flex flex-wrap gap-x-6 gap-y-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`border-b-2 pb-1 text-sm transition-colors ${
                mode === m.id
                  ? "border-brass text-text"
                  : "border-transparent text-muted hover:text-text"
              }`}
            >
              {m.label}
            </button>
          ))}
        </section>
        <p className="mb-4 text-xs text-muted">
          {MODES.find((m) => m.id === mode)?.hint}
        </p>

        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="粘贴小说节选、视频文案或任意长文本……"
          maxLength={50000}
          rows={10}
          className="w-full resize-y rounded-md border border-surface bg-surface/60 p-4 text-[15px] leading-relaxed text-text placeholder:text-muted"
        />

        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={handleDistill}
            disabled={loading}
            className="rounded-md bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-opacity disabled:opacity-50"
          >
            {loading ? "蒸馏中…" : "开始蒸馏"}
          </button>
          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        {result && (
          <section className="result-appear mt-10 rounded-md bg-paper p-6 text-ink">
            <p className="mb-3 text-xs text-ink/50">
              {MODES.find((m) => m.id === mode)?.label}
            </p>
            <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
              {result}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
