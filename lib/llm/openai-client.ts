import { serverConfig } from "@/lib/server-config";

export async function openAiText(system: string, prompt: string): Promise<string | null> {
  try {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serverConfig.openAiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: serverConfig.openAiModel,
        input: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as { output_text?: string };
    const text = data.output_text?.trim();
    return text || null;
  } catch {
    return null;
  }
}
