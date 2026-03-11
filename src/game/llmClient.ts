export type LlmProvider = "auto" | "openai" | "anthropic";

export type LlmClientRequest = {
  provider?: LlmProvider;
  system?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  jsonSchemaHint?: string;
};

export type LlmClientResponse =
  | { ok: true; provider: "mock" | "openai" | "anthropic"; content: string; raw?: unknown }
  | { ok: false; error: string };

export async function callLLM(payload: LlmClientRequest): Promise<LlmClientResponse> {
  try {
    const res = await fetch("/api/llm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => null)) as LlmClientResponse | null;
    if (!data) return { ok: false, error: "Invalid JSON response" };
    return data;
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Network error" };
  }
}

