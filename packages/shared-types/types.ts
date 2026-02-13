/**
 * Shared TypeScript types — API contract between frontend and backend.
 *
 * These types are the single source of truth for the shape of data
 * exchanged between the mobile app and the FastAPI backend.
 */

// ── Enums ──────────────────────────────────────────

export type RunState =
  | 'queued'
  | 'planning'
  | 'waiting_approval'
  | 'executing'
  | 'completed'
  | 'failed'
  | 'canceled';

export type StepState =
  | 'pending'
  | 'ready'
  | 'running'
  | 'blocked'
  | 'succeeded'
  | 'failed'
  | 'skipped';

// ── Domain models ──────────────────────────────────

export interface WorkflowRun {
  id: number;
  user_id: number;
  intent: string;
  state: RunState;
  risk_level: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowStep {
  id: number;
  run_id: number;
  name: string;
  depends_on: string[];
  state: StepState;
  attempt: number;
  tool: string | null;
  result_ref: string | null;
}

// ── Request payloads ───────────────────────────────

export interface CreateRunPayload {
  user_id: number;
  intent: string;
  risk_level?: string;
}

export interface UpdateRunPayload {
  intent?: string;
  state?: RunState;
  risk_level?: string;
}

export interface CreateStepPayload {
  name: string;
  depends_on?: string[];
  tool?: string;
}

export interface UpdateStepPayload {
  name?: string;
  state?: StepState;
  depends_on?: string[];
  tool?: string;
  result_ref?: string;
}

// ── API response wrappers ──────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  skip: number;
  limit: number;
}

// ── Health ──────────────────────────────────────────

export interface HealthResponse {
  status: string;
}