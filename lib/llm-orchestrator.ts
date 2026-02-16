import { runPipeline } from "@/lib/llm/pipeline";
import type { LlmMode } from "@/lib/server-config";

type ComposeInput = {
  userId: string;
  actionId: string;
  llmMode?: LlmMode;
};

type ComposeOutput = {
  assistantText: string;
  provider: "mock" | "openai" | "ollama" | "llamacpp";
  model: string;
};

export async function composeAssistantText(input: ComposeInput): Promise<ComposeOutput> {
  const output = await runPipeline(input);

  return {
    assistantText: output.assistantText,
    provider: output.provider,
    model: output.model,
  };
}
