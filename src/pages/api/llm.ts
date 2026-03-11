import type { NextApiRequest, NextApiResponse } from "next";

type LlmMessage = { role: "system" | "user" | "assistant"; content: string };

type LlmRequestBody = {
  provider?: "openai" | "anthropic" | "auto";
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  jsonSchemaHint?: string;
};

type LlmResponseBody =
  | { ok: true; provider: "mock"; content: string; raw?: unknown }
  | { ok: true; provider: "openai" | "anthropic"; content: string; raw?: unknown }
  | { ok: false; error: string };

function readJson(req: NextApiRequest) {
  if (typeof req.body === "object" && req.body) return req.body as LlmRequestBody;
  try {
    return JSON.parse(String(req.body ?? "{}")) as LlmRequestBody;
  } catch {
    return null;
  }
}

function mockContent(body: LlmRequestBody) {
  const last = body.messages?.at(-1)?.content ?? "";
  const hint = body.jsonSchemaHint ? "\n\n（已收到 JSON schema hint。）" : "";
  return `【MOCK】LLM 接口未配置 Key。\n你最后一句是：${last.slice(0, 140)}${last.length > 140 ? "…" : ""}${hint}`;
}

async function callOpenAI(body: LlmRequestBody) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const msgs: LlmMessage[] = [
    ...(body.system ? [{ role: "system", content: body.system } as const] : []),
    ...body.messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: msgs,
      temperature: 0.7,
    }),
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const rawObj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null);
  const err =
    rawObj &&
    typeof rawObj.error === "object" &&
    rawObj.error &&
    typeof (rawObj.error as Record<string, unknown>).message === "string"
      ? String((rawObj.error as Record<string, unknown>).message)
      : null;
  if (!res.ok) throw new Error(err ?? `OpenAI error ${res.status}`);

  const choices = rawObj?.choices;
  const first = Array.isArray(choices) ? (choices[0] as unknown) : null;
  const firstObj = first && typeof first === "object" ? (first as Record<string, unknown>) : null;
  const msg = firstObj?.message;
  const content =
    msg && typeof msg === "object" ? (msg as Record<string, unknown>).content : null;
  if (typeof content !== "string") throw new Error("OpenAI: empty content");
  return { provider: "openai" as const, content, raw };
}

async function callAnthropic(body: LlmRequestBody) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";

  const system = body.system ?? "";
  const messages = body.messages.map((m) => ({ role: m.role, content: m.content }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system,
      messages,
      temperature: 0.7,
    }),
  });

  const raw = (await res.json().catch(() => null)) as unknown;
  const rawObj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null);
  const err =
    rawObj &&
    typeof rawObj.error === "object" &&
    rawObj.error &&
    typeof (rawObj.error as Record<string, unknown>).message === "string"
      ? String((rawObj.error as Record<string, unknown>).message)
      : null;
  if (!res.ok) throw new Error(err ?? `Anthropic error ${res.status}`);

  const contentArr = rawObj?.content;
  const first = Array.isArray(contentArr) ? (contentArr[0] as unknown) : null;
  const firstObj = first && typeof first === "object" ? (first as Record<string, unknown>) : null;
  const text = firstObj?.text;
  if (typeof text !== "string") throw new Error("Anthropic: empty content");
  return { provider: "anthropic" as const, content: text, raw };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<LlmResponseBody>) {
  if (req.method !== "POST") {
    res.status(405).json({ ok: false, error: "Method not allowed" });
    return;
  }

  const body = readJson(req);
  if (!body || !Array.isArray(body.messages)) {
    res.status(400).json({ ok: false, error: "Invalid JSON body" });
    return;
  }

  const want = body.provider ?? "auto";
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);

  try {
    if ((want === "openai" || want === "auto") && hasOpenAI) {
      const out = await callOpenAI(body);
      if (out) {
        res.status(200).json({ ok: true, provider: out.provider, content: out.content, raw: out.raw });
        return;
      }
    }
    if ((want === "anthropic" || want === "auto") && hasAnthropic) {
      const out = await callAnthropic(body);
      if (out) {
        res.status(200).json({ ok: true, provider: out.provider, content: out.content, raw: out.raw });
        return;
      }
    }

    res.status(200).json({ ok: true, provider: "mock", content: mockContent(body) });
  } catch (e) {
    res.status(200).json({ ok: false, error: e instanceof Error ? e.message : "Unknown error" });
  }
}

