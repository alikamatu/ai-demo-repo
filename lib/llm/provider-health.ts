import { serverConfig } from "@/lib/server-config";
import type { LlmMode } from "@/lib/server-config";

export type LlmHealth = {
  mode: LlmMode;
  ready: boolean;
  reason: string;
};

async function withTimeout(input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function checkOpenAi(): Promise<LlmHealth> {
  if (!serverConfig.openAiApiKey) {
    return { mode: "openai", ready: false, reason: "OPENAI_API_KEY missing" };
  }

  try {
    const response = await withTimeout("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${serverConfig.openAiApiKey}` },
    });
    if (!response.ok) {
      return { mode: "openai", ready: false, reason: `OpenAI HTTP ${response.status}` };
    }
    return { mode: "openai", ready: true, reason: "ok" };
  } catch {
    return { mode: "openai", ready: false, reason: "OpenAI unreachable" };
  }
}

async function checkOllama(): Promise<LlmHealth> {
  try {
    const response = await withTimeout(`${serverConfig.ollamaBaseUrl}/api/tags`);
    if (!response.ok) {
      return { mode: "ollama", ready: false, reason: `Ollama HTTP ${response.status}` };
    }
    return { mode: "ollama", ready: true, reason: "ok" };
  } catch {
    return { mode: "ollama", ready: false, reason: "Ollama unreachable" };
  }
}

async function checkLlamaCpp(): Promise<LlmHealth> {
  try {
    const response = await withTimeout(`${serverConfig.llamaCppBaseUrl}/v1/models`);
    if (!response.ok) {
      return { mode: "llamacpp", ready: false, reason: `llama.cpp HTTP ${response.status}` };
    }
    return { mode: "llamacpp", ready: true, reason: "ok" };
  } catch {
    return { mode: "llamacpp", ready: false, reason: "llama.cpp unreachable" };
  }
}

export async function checkLlmHealth(mode: LlmMode = serverConfig.llmMode): Promise<LlmHealth> {
  switch (mode) {
    case "openai":
      return checkOpenAi();
    case "ollama":
      return checkOllama();
    case "llamacpp":
      return checkLlamaCpp();
    default:
      return { mode: "mock", ready: true, reason: "mock mode" };
  }
}
