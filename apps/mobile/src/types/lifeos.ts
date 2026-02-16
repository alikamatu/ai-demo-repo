export type AuthUser = {
  id: string;
  email: string;
  name: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type MeResponse = {
  user: AuthUser;
};

export type RegisterPushResponse = {
  ok: true;
  updatedAt: string;
};

export type HealthResponse = {
  ok: boolean;
  service: string;
  llmMode?: string;
  time: string;
};

export type StatItem = {
  id: string;
  value: string;
  label: string;
};

export type ApprovalItem = {
  id: string;
  title: string;
  note: string;
  cta: string;
  status: "pending" | "approved" | "rejected";
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  status: "active" | "review" | "paused";
};

export type TimelineItem = {
  id: string;
  time: string;
  event: string;
  info: string;
};

export type DashboardSnapshot = {
  assistantText: string;
  stats: StatItem[];
  approvals: ApprovalItem[];
  automations: Automation[];
  timeline: TimelineItem[];
  updatedAt: string;
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

export type RunActionResponse = {
  assistantText: string;
  timeline: TimelineItem;
  approvals: ApprovalItem[];
  stats: StatItem[];
  orchestration?: {
    provider: LlmMode;
    model: string;
  };
};

export type ApprovalUpdateResponse = {
  approval: ApprovalItem;
  assistantText: string;
  updatedAt: string;
};

export type AutomationToggleResponse = {
  automation: Automation;
  updatedAt: string;
};

export type LlmMode = "mock" | "openai" | "ollama" | "llamacpp";

export type LlmStatusResponse = {
  mode: LlmMode;
  options: LlmMode[];
  ready: boolean;
  reason: string;
  model: string;
  updatedAt: string;
};

export type QueuedMutation =
  | {
      id: string;
      type: "run-action";
      payload: { actionId: string };
      createdAt: number;
    }
  | {
      id: string;
      type: "update-approval";
      payload: { approvalId: string; status: "approved" | "rejected" };
      createdAt: number;
    }
  | {
      id: string;
      type: "toggle-automation";
      payload: { automationId: string; status: "active" | "paused" };
      createdAt: number;
    };
