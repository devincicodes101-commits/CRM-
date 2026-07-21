import Anthropic from "@anthropic-ai/sdk";

// Server-side Anthropic wrapper for the AI Tools. Degrades gracefully when the
// key isn't set (returns a clear error rather than throwing at import time).

const client = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";

// A user-message content block (text, or a base64 document/image for the survey tool).
export type ContentBlock =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string } }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

export type AiResult = { ok: true; text: string } | { ok: false; error: string };

export async function generateText(opts: {
  system: string;
  content: string | ContentBlock[];
  maxTokens?: number;
}): Promise<AiResult> {
  if (!client) {
    return { ok: false, error: "AI is not configured yet — add ANTHROPIC_API_KEY on the server." };
  }
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: opts.maxTokens ?? 2500,
      system: opts.system,
      messages: [
        {
          role: "user",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content: (typeof opts.content === "string" ? [{ type: "text", text: opts.content }] : opts.content) as any,
        },
      ],
    });
    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { ok: true, text };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}
