import { serverConfig } from "@/lib/server-config";

type LlamaCppResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

export async function llamaCppText(system: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch(`${serverConfig.llamaCppBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: serverConfig.llamaCppModel,
        temperature: 0.2,
        max_tokens: 220,
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as LlamaCppResponse;
    const text = data.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}
