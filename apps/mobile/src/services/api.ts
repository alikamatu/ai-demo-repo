import type {
  ApprovalUpdateResponse,
  Automation,
  AutomationToggleResponse,
  DashboardSnapshot,
  HealthResponse,
  LlmMode,
  LlmStatusResponse,
  LivePulse,
  LoginResponse,
  MeResponse,
  RegisterPushResponse,
  RunActionResponse,
} from "@/src/types/lifeos";
import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBase(): string {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL;

  // Respect explicit non-localhost config first.
  if (configured && !configured.includes("localhost")) {
    return configured;
  }

  // When running in Expo on a physical device, infer host LAN IP from hostUri.
  const hostUri =
    (Constants.expoConfig as { hostUri?: string } | null)?.hostUri ??
    (Constants as unknown as { manifest?: { debuggerHost?: string } }).manifest?.debuggerHost ??
    "";
  const host = hostUri.split(":")[0];
  if (host) {
    return `http://${host}:3000`;
  }

  // Android emulator cannot reach host localhost directly.
  if (configured?.includes("localhost") && Platform.OS === "android") {
    return configured.replace("localhost", "10.0.2.2");
  }

  return configured ?? "http://localhost:3000";
}

const API_BASE = resolveApiBase();

export function getApiBaseUrl() {
  return API_BASE;
}

type Method = "GET" | "POST";

function idempotencyKey(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function request<T>(path: string, method: Method, token?: string, body?: unknown, idempotent = false): Promise<T | null> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(idempotent ? { "Idempotency-Key": idempotencyKey(path) } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      console.warn(`[api] ${method} ${path} failed`, response.status);
      return null;
    }
    return (await response.json()) as T;
  } catch {
    console.warn(`[api] ${method} ${path} failed`, "network_error", API_BASE);
    return null;
  }
}

export async function login(email: string, password: string): Promise<LoginResponse | null> {
  return request<LoginResponse>("/api/auth/login", "POST", undefined, { email, password });
}

export async function healthCheck(): Promise<HealthResponse | null> {
  return request<HealthResponse>("/api/healthz", "GET");
}

export async function register(
  name: string,
  email: string,
  password: string
): Promise<LoginResponse | null> {
  return request<LoginResponse>("/api/auth/register", "POST", undefined, { name, email, password });
}

export async function me(token: string): Promise<MeResponse | null> {
  return request<MeResponse>("/api/auth/me", "GET", token);
}

export async function getDashboard(token: string): Promise<DashboardSnapshot | null> {
  return request<DashboardSnapshot>("/api/lifeos/dashboard", "GET", token);
}

export async function getLivePulse(token: string): Promise<LivePulse | null> {
  return request<LivePulse>("/api/lifeos/live", "GET", token);
}

export async function runAction(token: string, actionId: string): Promise<RunActionResponse | null> {
  return request<RunActionResponse>("/api/lifeos/actions/run", "POST", token, { actionId }, true);
}

export async function updateApproval(
  token: string,
  approvalId: string,
  status: "approved" | "rejected"
): Promise<ApprovalUpdateResponse | null> {
  return request<ApprovalUpdateResponse>("/api/lifeos/approvals/update", "POST", token, {
    approvalId,
    status,
  }, true);
}

export async function toggleAutomation(
  token: string,
  automationId: string,
  status: Automation["status"]
): Promise<AutomationToggleResponse | null> {
  return request<AutomationToggleResponse>("/api/lifeos/automations/toggle", "POST", token, {
    automationId,
    status,
  }, true);
}

export async function registerPushToken(
  token: string,
  payload: { deviceId: string; platform: "ios" | "android" | "web"; token: string }
): Promise<RegisterPushResponse | null> {
  return request<RegisterPushResponse>("/api/lifeos/push/register", "POST", token, payload, true);
}

export async function sendPushTest(token: string): Promise<{ ok: boolean; sent: number } | null> {
  return request<{ ok: boolean; sent: number }>("/api/lifeos/push/test", "POST", token);
}

export async function getLlmStatus(token: string): Promise<LlmStatusResponse | null> {
  return request<LlmStatusResponse>("/api/lifeos/llm/status", "GET", token);
}

export async function setLlmMode(token: string, mode: LlmMode): Promise<LlmStatusResponse | null> {
  return request<LlmStatusResponse>("/api/lifeos/llm/mode", "POST", token, { mode });
}
