import type { Intent, PlanStep } from "@/lib/llm/types";
import { isOpenAiConfigured, serverConfig } from "@/lib/server-config";
import type { LlmMode } from "@/lib/server-config";
import { openAiText } from "@/lib/llm/openai-client";
import { ollamaText } from "@/lib/llm/ollama-client";
import { llamaCppText } from "@/lib/llm/llamacpp-client";

function mockPlan(intent: Intent, actionId: string): PlanStep[] {
  return [
    {
      id: "step-1",
      name: `Analyze context for ${intent.intent}`,
      tool: "context-analyzer",
      input: { actionId, goal: intent.goal },
    },
    {
      id: "step-2",
      name: "Execute primary automation",
      tool: "workflow-runner",
      input: { intent: intent.intent },
    },
    {
      id: "step-3",
      name: "Generate user update",
      tool: "status-writer",
      input: { tone: "clear" },
    },
  ];
}

function planFromText(text: string, intent: Intent, actionId: string, fallback: PlanStep[]): PlanStep[] {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);

  return lines.length
    ? lines.map((line, index) => ({
        id: `step-${index + 1}`,
        name: line.replace(/^[-*\d.\s]+/, ""),
        tool: index === 0 ? "context-analyzer" : index === 1 ? "workflow-runner" : "status-writer",
        input: { intent: intent.intent, actionId },
      }))
    : fallback;
}

export async function planWorkflow(
  intent: Intent,
  actionId: string,
  llmMode: LlmMode = serverConfig.llmMode
): Promise<{ plan: PlanStep[]; provider: "mock" | "openai" | "ollama" | "llamacpp"; model: string }> {
  const base = mockPlan(intent, actionId);
  const system = "You output concise 3-step automation plans.";
  const prompt = `Intent: ${intent.intent}. Goal: ${intent.goal}. Return 3 bullet lines only.`;

  if (llmMode === "openai") {
    if (!isOpenAiConfigured()) {
      return {
        plan: base,
        provider: "mock",
        model: "rule-based-v1",
      };
    }

    const text = await openAiText(system, prompt);
    if (!text) {
      return {
        plan: base,
        provider: "mock",
        model: "rule-based-v1",
      };
    }

    return {
      plan: planFromText(text, intent, actionId, base),
      provider: "openai",
      model: serverConfig.openAiModel,
    };
  }

  if (llmMode === "ollama") {
    const text = await ollamaText(system, prompt);
    if (!text) {
      return {
        plan: base,
        provider: "mock",
        model: "rule-based-v1",
      };
    }

    return {
      plan: planFromText(text, intent, actionId, base),
      provider: "ollama",
      model: serverConfig.ollamaModel,
    };
  }

  if (llmMode === "llamacpp") {
    const text = await llamaCppText(system, prompt);
    if (!text) {
      return {
        plan: base,
        provider: "mock",
        model: "rule-based-v1",
      };
    }

    return {
      plan: planFromText(text, intent, actionId, base),
      provider: "llamacpp",
      model: serverConfig.llamaCppModel,
    };
  }

  return {
    plan: base,
    provider: "mock",
    model: "rule-based-v1",
  };
}
