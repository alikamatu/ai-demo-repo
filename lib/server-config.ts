export type LlmMode = "mock" | "openai" | "ollama" | "llamacpp";

const allowedModes: LlmMode[] = ["mock", "openai", "ollama", "llamacpp"];

export const serverConfig = {
  llmMode: (process.env.LIFEOS_LLM_MODE ?? "llamacpp") as LlmMode,
  openAiApiKey: process.env.OPENAI_API_KEY ?? "",
  openAiModel: process.env.LIFEOS_OPENAI_MODEL ?? "gpt-4.1-mini",
  ollamaBaseUrl: process.env.LIFEOS_OLLAMA_BASE_URL ?? "http://127.0.0.1:11434",
  ollamaModel: process.env.LIFEOS_OLLAMA_MODEL ?? "llama3.2:1b",
  llamaCppBaseUrl: process.env.LIFEOS_LLAMACPP_BASE_URL ?? "http://127.0.0.1:8081",
  llamaCppModel: process.env.LIFEOS_LLAMACPP_MODEL ?? "qwen2.5-0.5b-instruct-q4_k_m.gguf",
  strictIntegrations: (process.env.LIFEOS_STRICT_INTEGRATIONS ?? "true") === "true",
  workflowEngineBaseUrl: process.env.LIFEOS_WORKFLOW_ENGINE_BASE_URL ?? "http://127.0.0.1:8000",
  workflowEngineTimeoutMs: Number.parseInt(process.env.LIFEOS_WORKFLOW_ENGINE_TIMEOUT_MS ?? "8000", 10),
};

export function isOpenAiConfigured() {
  return Boolean(serverConfig.openAiApiKey);
}

export function getLlmModeOptions(): LlmMode[] {
  return allowedModes;
}

export function isValidLlmMode(mode: unknown): mode is LlmMode {
  return typeof mode === "string" && allowedModes.includes(mode as LlmMode);
}
