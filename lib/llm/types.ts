export type IntentType =
  | "career.apply"
  | "social.publish"
  | "lifestyle.plan"
  | "admin.organize"
  | "generic.execute";

export type PlanStep = {
  id: string;
  name: string;
  tool: string;
  input: Record<string, unknown>;
};

export type Intent = {
  intent: IntentType;
  goal: string;
  riskLevel: "low" | "medium" | "high";
};

export type PolicyDecision = {
  allowed: boolean;
  reason: string;
};

export type StepResult = {
  stepId: string;
  status: "success" | "skipped";
  summary: string;
};

export type PipelineResult = {
  assistantText: string;
  provider: "mock" | "openai" | "ollama" | "llamacpp";
  model: string;
  intent: Intent;
  plan: PlanStep[];
  policy: PolicyDecision;
  results: StepResult[];
};
