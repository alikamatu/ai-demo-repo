import type { ApprovalItem, Automation, QuickAction } from "@/components/lifeos/types";
import type {
  ApiError,
  ApprovalUpdateResponse,
  AutomationToggleResponse,
  DashboardResponse,
  LlmMode,
  LlmStatusResponse,
  LivePulseResponse,
  LoginResponse,
  MeResponse,
  RegisterRequest,
  ResetResponse,
  RunActionResponse,
  SubmitWorkflowEngineResponse,
  WorkflowEngineStatusResponse,
} from "@/lib/lifeos-contracts";

const API_BASE = process.env.NEXT_PUBLIC_LIFEOS_API_URL;

function buildHeaders(token?: string, initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return headers;
}

async function request<T>(path: string, token?: string, init?: RequestInit): Promise<T> {
  const base = API_BASE ?? "";

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: buildHeaders(token, init?.headers),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiError | null;
    const message = errorBody?.error ?? `Request failed (${response.status})`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/login", undefined, {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(payload: RegisterRequest): Promise<LoginResponse> {
  return request<LoginResponse>("/api/auth/register", undefined, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function me(token: string): Promise<MeResponse> {
  return request<MeResponse>("/api/auth/me", token, { method: "GET" });
}

export async function fetchDashboard(token: string): Promise<DashboardResponse> {
  return request<DashboardResponse>("/api/lifeos/dashboard", token);
}

export async function fetchLivePulse(token: string): Promise<LivePulseResponse> {
  return request<LivePulseResponse>("/api/lifeos/live", token);
}

export async function resetDashboard(token: string): Promise<ResetResponse> {
  return request<ResetResponse>("/api/lifeos/reset", token, { method: "POST" });
}

export async function runAction(token: string, action: QuickAction): Promise<RunActionResponse> {
  return request<RunActionResponse>("/api/lifeos/actions/run", token, {
    method: "POST",
    body: JSON.stringify({ actionId: action.id }),
  });
}

export async function updateApproval(
  token: string,
  item: ApprovalItem,
  status: "approved" | "rejected"
): Promise<ApprovalUpdateResponse> {
  return request<ApprovalUpdateResponse>("/api/lifeos/approvals/update", token, {
    method: "POST",
    body: JSON.stringify({ approvalId: item.id, status }),
  });
}

export async function toggleAutomation(
  token: string,
  automation: Automation
): Promise<AutomationToggleResponse> {
  const nextStatus: Automation["status"] = automation.status === "active" ? "paused" : "active";

  return request<AutomationToggleResponse>("/api/lifeos/automations/toggle", token, {
    method: "POST",
    body: JSON.stringify({ automationId: automation.id, status: nextStatus }),
  });
}

export async function fetchLlmStatus(token: string): Promise<LlmStatusResponse> {
  return request<LlmStatusResponse>("/api/lifeos/llm/status", token, { method: "GET" });
}

export async function updateLlmMode(token: string, mode: LlmMode): Promise<LlmStatusResponse> {
  return request<LlmStatusResponse>("/api/lifeos/llm/mode", token, {
    method: "POST",
    body: JSON.stringify({ mode }),
  });
}

export async function fetchWorkflowEngineStatus(token: string): Promise<WorkflowEngineStatusResponse> {
  return request<WorkflowEngineStatusResponse>("/api/lifeos/workflow-engine/status", token, {
    method: "GET",
  });
}

export async function submitWorkflowEngineIntent(
  token: string,
  intent: string
): Promise<SubmitWorkflowEngineResponse> {
  return request<SubmitWorkflowEngineResponse>("/api/lifeos/workflow-engine/submit", token, {
    method: "POST",
    body: JSON.stringify({ intent }),
  });
}
