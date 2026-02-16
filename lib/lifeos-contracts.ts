import type { ApprovalItem, Automation, StatItem, TimelineItem } from "@/components/lifeos/types";

export type LlmMode = "mock" | "openai" | "ollama" | "llamacpp";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  name: string;
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type RegisterPushRequest = {
  deviceId: string;
  platform: "ios" | "android" | "web";
  token: string;
};

export type RegisterPushResponse = {
  ok: true;
  updatedAt: string;
};

export type PushTestResponse = {
  ok: boolean;
  sent: number;
};

export type RunActionRequest = {
  actionId: string;
};

export type RunActionResponse = {
  assistantText: string;
  timeline: TimelineItem;
  approvals: ApprovalItem[];
  stats: StatItem[];
  orchestration?: {
    provider: "mock" | "openai" | "ollama" | "llamacpp";
    model: string;
  };
};

export type ApprovalUpdateRequest = {
  approvalId: string;
  status: "approved" | "rejected";
};

export type AutomationToggleRequest = {
  automationId: string;
  status: "active" | "paused";
};

export type ApiError = {
  error: string;
};

export type LivePulse = {
  weather: {
    city: string;
    temperatureC: number;
    condition: string;
  };
  jobs: {
    source: string;
    role: string;
    company: string;
    location: string;
    url: string;
  };
  news: {
    source: string;
    headline: string;
    url: string;
    points: number;
  };
  updatedAt: string;
};

export type DashboardSnapshot = {
  assistantText: string;
  stats: StatItem[];
  approvals: ApprovalItem[];
  automations: Automation[];
  timeline: TimelineItem[];
  updatedAt: string;
};

export type DashboardResponse = DashboardSnapshot;

export type ApprovalUpdateResponse = {
  approval: ApprovalItem;
  assistantText: string;
  updatedAt: string;
};

export type AutomationToggleResponse = {
  automation: Automation;
  updatedAt: string;
};

export type ResetResponse = DashboardSnapshot;

export type LivePulseResponse = LivePulse;

export type StreamEvent = {
  type: "sync" | "pulse";
  payload: {
    updatedAt: string;
    livePulse?: LivePulse;
  };
};

export type LlmStatusResponse = {
  mode: LlmMode;
  options: LlmMode[];
  ready: boolean;
  reason: string;
  model: string;
  updatedAt: string;
};

export type LlmModeUpdateRequest = {
  mode: LlmMode;
};

export type WorkflowEngineStatusResponse = {
  available: boolean;
  baseUrl: string;
  checkedAt: string;
  health?: Record<string, unknown> | null;
  error?: string;
};

export type SubmitWorkflowEngineRequest = {
  intent: string;
};

export type SubmitWorkflowEngineResponse = {
  ok: true;
  workflowId: number;
  status: string;
  intent: string;
  upstreamUserId: number;
  checkedAt: string;
  upstream?: Record<string, unknown> | null;
};
