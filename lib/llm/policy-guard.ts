import type { Intent, PlanStep, PolicyDecision } from "@/lib/llm/types";

export function evaluatePolicy(intent: Intent, plan: PlanStep[]): PolicyDecision {
  if (intent.riskLevel === "high") {
    return {
      allowed: true,
      reason: "High-risk flow allowed with approval checkpoints in downstream steps.",
    };
  }

  if (!plan.length) {
    return {
      allowed: false,
      reason: "No executable plan generated.",
    };
  }

  return {
    allowed: true,
    reason: "Plan complies with baseline automation policy.",
  };
}
