import { routeIntent } from "@/lib/llm/intent-router";
import { planWorkflow } from "@/lib/llm/planner";
import { evaluatePolicy } from "@/lib/llm/policy-guard";
import { writeAssistantResponse } from "@/lib/llm/response-writer";
import { executePlan } from "@/lib/llm/tool-executor";
import type { PipelineResult } from "@/lib/llm/types";
import type { LlmMode } from "@/lib/server-config";

type Input = {
  userId: string;
  actionId: string;
  llmMode?: LlmMode;
};

export async function runPipeline(input: Input): Promise<PipelineResult> {
  const intent = routeIntent(input.actionId);
  const planning = await planWorkflow(intent, input.actionId, input.llmMode);

  const policy = evaluatePolicy(intent, planning.plan);
  const results = policy.allowed ? await executePlan(planning.plan) : [];

  const assistantText = writeAssistantResponse(intent, planning.plan, policy, results);

  return {
    assistantText,
    provider: planning.provider,
    model: planning.model,
    intent,
    plan: planning.plan,
    policy,
    results,
  };
}
