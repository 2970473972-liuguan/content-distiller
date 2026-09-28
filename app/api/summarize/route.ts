import { NextRequest, NextResponse } from "next/server";

type Mode = "summary" | "plot-cards" | "reading-notes";

const MAX_INPUT_LENGTH = 50_000;
const MAX_MODEL_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 12;
const RATE_LIMIT_MAP_MAX = 10_000;

const ALLOWED_MODELS = new Set(["deepseek-chat", "deepseek-flash", "deepseek-reasoner"]);

const MODE_PROMPTS: Record<Mode, string> = {
  summary:
    "请将以下文本蒸馏成一段精简摘要(300字以内),只保留核心内容,不要逐句复述原文。",
  "plot-cards":
    "请从以下文本中提取关键情节节点(按时间顺序列出)和主要人物卡片(姓名 + 一句话人物特征)。用清晰的列表格式输出。",
  "reading-notes":
    "请从以下文本中提炼值得记录的读书笔记:核心观点、值得注意的细节、以及你的一句话点评。",
};

const rateHits = new Map<string, number[]>();

function isValidMode(mode: unknown): mode is Mode {
  return typeof mode === "string" && mode in MODE_PROMPTS;
}

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers.get("x-real-ip") || "unknown";
}

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const hits = (rateHits.get(ip) || []).filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  if (hits.length >= RATE_LIMIT_MAX) {
    rateHits.set(ip, hits);
    return true;
  }

  hits.push(now);
  rateHits.set(ip, hits);

  if (rateHits.size > RATE_LIMIT_MAP_MAX) {
    const oldest = [...rateHits.keys()].slice(0, Math.floor(RATE_LIMIT_MAP_MAX / 2));
    oldest.forEach((key) => rateHits.delete(key));
  }

  return false;
}

function pickModel(value: unknown, fallback: string): string {
  if (typeof value === "string" && value.trim()) {
    const model = value.trim();
    if (model.length > MAX_MODEL_LENGTH) {
      return fallback;
    }
    return ALLOWED_MODELS.has(model) ? model : fallback;
  }
  return fallback;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "请求过于频繁,请稍后再试。" },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const text: unknown = body?.text;
  const mode: unknown = body?.mode;
  const clientApiKey: unknown = body?.apiKey;
  const clientModel: unknown = body?.model;

  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json(
      { error: "text 必须是非空字符串。" },
      { status: 400 }
    );
  }

  if (text.length > MAX_INPUT_LENGTH) {
    return NextResponse.json(
      { error: `文本过长,请控制在 ${MAX_INPUT_LENGTH} 字以内。` },
      { status: 413 }
    );
  }

  if (!isValidMode(mode)) {
    return NextResponse.json(
      { error: "mode 参数无效。" },
      { status: 400 }
    );
  }

  const serverApiKey = process.env.DEEPSEEK_API_KEY;
  const apiKey =
    typeof clientApiKey === "string" && clientApiKey.trim()
      ? clientApiKey.trim()
      : serverApiKey;

  if (!apiKey) {
    return NextResponse.json(
      { error: "请在页面设置中填入你的 DeepSeek API Key。" },
      { status: 500 }
    );
  }

  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = pickModel(clientModel, process.env.DEEPSEEK_MODEL || "deepseek-flash");

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: "你是一个擅长提炼长文本核心内容的助手,输出简洁、准确、不编造原文没有的信息。",
          },
          {
            role: "user",
            content: `${MODE_PROMPTS[mode]}\n\n---\n${text}`,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("DeepSeek API error:", response.status, errText);
      const hint =
        response.status === 401
          ? "API Key 无效,请检查后重试。"
          : response.status === 402
          ? "该账户余额不足,请先充值。"
          : "调用大模型失败,请稍后再试。";
      return NextResponse.json({ error: hint }, { status: 502 });
    }

    const data = await response.json();
    const result: string = data.choices?.[0]?.message?.content ?? "";

    return NextResponse.json({ result: result || "" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "服务暂时不可用,请稍后再试。" },
      { status: 500 }
    );
  }
}
