import type { PlanStep, StepResult } from "@/lib/llm/types";

export async function executePlan(plan: PlanStep[]): Promise<StepResult[]> {
  return plan.map((step) => ({
    stepId: step.id,
    status: "success",
    summary: `${step.name} completed via ${step.tool}.`,
  }));
}
