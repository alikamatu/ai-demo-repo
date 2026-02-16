import type { Intent, PlanStep, PolicyDecision, StepResult } from "@/lib/llm/types";

export function writeAssistantResponse(
  intent: Intent,
  plan: PlanStep[],
  policy: PolicyDecision,
  results: StepResult[]
): string {
  if (!policy.allowed) {
    return `Execution paused. ${policy.reason}`;
  }

  const completed = results.filter((result) => result.status === "success").length;
  const total = plan.length;

  return `Executing ${intent.intent} workflow. ${completed}/${total} steps completed with policy status: ${policy.reason}`;
}
