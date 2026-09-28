"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  BookOpen,
  Check,
  Copy,
  Download,
  FileText,
  KeyRound,
  Layers,
  Loader2,
  Send,
  Server,
  Settings2,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react";

type Mode = "summary" | "plot-cards" | "reading-notes";

type Settings = {
  useOwnKey: boolean;
  apiKey: string;
  model: string;
};

type LucideIcon = typeof Sparkles;

const MODES: { id: Mode; label: string; hint: string; icon: LucideIcon }[] = [
  {
    id: "summary",
    label: "精简摘要",
    hint: "几段话讲清楚这段内容在说什么",
    icon: Sparkles,
  },
  {
    id: "plot-cards",
    label: "情节 + 人物",
    hint: "拆出关键情节节点和主要人物",
    icon: Layers,
  },
  {
    id: "reading-notes",
    label: "读书笔记",
    hint: "提炼观点、细节和一句点评",
    icon: BookOpen,
  },
];

const MODEL_OPTIONS = [
  { value: "deepseek-flash", label: "DeepSeek Flash（快）" },
  { value: "deepseek-chat", label: "DeepSeek Chat（稳）" },
  { value: "deepseek-reasoner", label: "DeepSeek Reasoner（推理）" },
];

const SETTINGS_KEY = "content-distiller:settings";
const MAX_INPUT_LENGTH = 50_000;

const DEFAULT_SETTINGS: Settings = {
  useOwnKey: false,
  apiKey: "",
  model: "deepseek-flash",
};

function loadSettings(): Settings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SETTINGS;
    }
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      useOwnKey: Boolean(parsed.useOwnKey),
      apiKey: typeof parsed.apiKey === "string" ? parsed.apiKey : "",
      model: typeof parsed.model === "string" ? parsed.model : "deepseek-flash",
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("summary");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const activeMode = useMemo(
    () => MODES.find((item) => item.id === mode) ?? MODES[0],
    [mode]
  );

  async function handleDistill() {
    if (!input.trim()) {
      setError("先粘贴一段文字,再开始蒸馏。");
      return;
    }
    if (settings.useOwnKey && !settings.apiKey.trim()) {
      setError("请在设置里填入你自己的 API Key。");
      setSettingsOpen(true);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: input,
          mode,
          apiKey: settings.useOwnKey ? settings.apiKey.trim() : "",
          model: settings.useOwnKey ? settings.model : "",
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "蒸馏失败,请稍后再试。");
      }
      setResult((data.result as string) || "没有返回内容,请换一段文本重试。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "蒸馏失败,请稍后再试。");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setError("复制失败,请手动选择文本。");
    }
  }

  function handleDownload() {
    if (!result) {
      return;
    }
    const blob = new Blob([`# ${activeMode.label}\n\n${result}\n`], {
      type: "text/markdown;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${mode}-${new Date().toISOString().slice(0, 10)}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-ink text-text">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-5 py-6 sm:px-8 sm:py-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-brass/40 bg-brass/10 text-brass">
              <WandSparkles size={20} />
            </span>
            <div>
              <p className="font-serif text-lg leading-tight text-text">内容蒸馏</p>
              <p className="text-xs text-muted">Content Distiller</p>
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-surface bg-surface/40 px-3 py-2 text-sm text-muted transition-colors hover:border-brass/40 hover:text-text"
          >
            <Settings2 size={16} />
            {settings.useOwnKey ? "个人 Key" : "设置"}
          </button>
        </header>

        <section className="mt-12 sm:mt-16">
          <p className="mb-4 inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-brass">
            <FileText size={14} />
            Paste · Distill · Read
          </p>
          <h1 className="max-w-2xl font-serif text-4xl font-medium leading-tight sm:text-5xl">
            把一段故事,
            <br />
            蒸馏成它的核心。
          </h1>
          <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-muted">
            粘贴小说节选或视频文案,选一种蒸馏方式,几秒钟拿到你真正需要的那部分内容。
          </p>
        </section>

        <section className="mt-10 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
          <div className="flex flex-col">
            <div className="mb-3 flex flex-wrap gap-2">
              {MODES.map((item) => {
                const Icon = item.icon;
                const isActive = item.id === mode;
                return (
                  <button
                    key={item.id}
                    onClick={() => setMode(item.id)}
                    className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                      isActive
                        ? "border-brass/60 bg-brass/15 text-text"
                        : "border-surface bg-surface/30 text-muted hover:text-text"
                    }`}
                  >
                    <Icon size={15} />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <p className="mb-3 text-xs text-muted">{activeMode.hint}</p>

            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="粘贴小说节选、视频文案或任意长文本……"
                maxLength={MAX_INPUT_LENGTH}
                rows={14}
                className="w-full resize-y rounded-lg border border-surface bg-surface/50 p-4 pr-12 text-[15px] leading-relaxed text-text outline-none transition-colors placeholder:text-muted/70 focus:border-brass/60"
              />
              <span className="pointer-events-none absolute bottom-3 right-3 text-[11px] tabular-nums text-muted/60">
                {input.length.toLocaleString()}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleDistill}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg bg-brass px-5 py-2.5 text-sm font-medium text-ink transition-opacity disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {loading ? "蒸馏中…" : "开始蒸馏"}
              </button>
              {error && (
                <p className="inline-flex items-center gap-1.5 text-sm text-red-400">
                  <AlertCircle size={15} />
                  {error}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.14em] text-muted">结果</p>
              {result && (
                <div className="flex gap-1">
                  <button
                    onClick={handleCopy}
                    title="复制结果"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface text-muted transition-colors hover:border-brass/40 hover:text-text"
                  >
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                  <button
                    onClick={handleDownload}
                    title="下载 Markdown"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface text-muted transition-colors hover:border-brass/40 hover:text-text"
                  >
                    <Download size={15} />
                  </button>
                </div>
              )}
            </div>

            <div className="min-h-[360px] rounded-lg border border-surface bg-paper p-5 text-ink">
              {loading ? (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-ink/60">
                  <Sparkles size={22} className="animate-pulse text-brass" />
                  <p className="text-sm">正在蒸馏核心内容…</p>
                </div>
              ) : result ? (
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                  {result}
                </div>
              ) : (
                <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-3 text-center text-ink/45">
                  <Layers size={24} />
                  <p className="max-w-[24ch] text-sm">
                    蒸馏结果会出现在这里,可直接复制或下载成 Markdown。
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <footer className="mt-auto pt-10 text-xs text-muted/60">
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface/60 pt-5">
            <span>© 2026 内容蒸馏 · 仅供学习交流</span>
            <span className="inline-flex items-center gap-1.5">
              <KeyRound size={12} />
              API Key 仅保存在你的浏览器本地
            </span>
          </div>
        </footer>
      </div>

      {settingsOpen && (
        <SettingsModal
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onChange={setSettings}
        />
      )}
    </main>
  );
}

function SettingsModal({
  settings,
  onClose,
  onChange,
}: {
  settings: Settings;
  onClose: () => void;
  onChange: (settings: Settings) => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-lg border border-surface bg-ink p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg text-text">使用设置</h2>
            <p className="mt-1 text-xs text-muted">决定调用谁的 DeepSeek 额度</p>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-surface text-muted hover:text-text"
          >
            <X size={16} />
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-surface bg-surface/30 p-4">
          <input
            type="checkbox"
            checked={settings.useOwnKey}
            onChange={(e) =>
              onChange({ ...settings, useOwnKey: e.target.checked })
            }
            className="mt-0.5 h-4 w-4 accent-brass"
          />
          <span className="flex-1">
            <span className="flex items-center gap-2 text-sm text-text">
              <KeyRound size={15} />
              使用我自己的 API Key
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-muted">
              开启后,每次请求会使用你自己的 DeepSeek 额度;Key 只保存在本机浏览器。
            </span>
          </span>
        </label>

        <div
          className={`mt-4 space-y-4 transition-opacity ${
            settings.useOwnKey ? "opacity-100" : "pointer-events-none opacity-45"
          }`}
        >
          <div>
            <label className="mb-1.5 block text-xs text-muted">DeepSeek API Key</label>
            <input
              type="password"
              value={settings.apiKey}
              onChange={(e) => onChange({ ...settings, apiKey: e.target.value })}
              placeholder="sk-…"
              className="w-full rounded-lg border border-surface bg-surface/50 px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/60 focus:border-brass/60"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs text-muted">模型</label>
            <select
              value={settings.model}
              onChange={(e) => onChange({ ...settings, model: e.target.value })}
              className="w-full rounded-lg border border-surface bg-surface/50 px-3 py-2.5 text-sm text-text outline-none focus:border-brass/60"
            >
              {MODEL_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div
          className={`mt-4 flex items-center gap-2 rounded-lg border border-surface/60 bg-surface/20 p-3 text-xs text-muted ${
            settings.useOwnKey ? "hidden" : ""
          }`}
        >
          <Server size={14} />
          当前使用站长配置的默认 Key,请求会消耗站长额度。
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-brass py-2.5 text-sm font-medium text-ink transition-opacity hover:opacity-90"
        >
          完成
        </button>
      </div>
    </div>
  );
}
