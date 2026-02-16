import { serverConfig } from "@/lib/server-config";

type OllamaGenerateResponse = {
  response?: string;
};

export async function ollamaText(system: string, prompt: string): Promise<string | null> {
  try {
    const body = {
      model: serverConfig.ollamaModel,
      prompt: `System:\n${system}\n\nUser:\n${prompt}`,
      stream: false,
      options: {
        temperature: 0.2,
      },
    };

    const response = await fetch(`${serverConfig.ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;

    const data = (await response.json()) as OllamaGenerateResponse;
    const text = data.response?.trim();
    return text || null;
  } catch {
    return null;
  }
}
