/**
 * API endpoint functions — thin wrappers around the Axios client.
 */

import apiClient from './client';
import type {
  WorkflowRun,
  WorkflowStep,
  CreateRunPayload,
  UpdateRunPayload,
  CreateStepPayload,
  UpdateStepPayload,
} from '../types';

// ── Health ─────────────────────────────────────────

export async function getHealth(): Promise<{ status: string }> {
  const { data } = await apiClient.get('/health');
  return data;
}

// ── Workflow Runs ──────────────────────────────────

export async function listRuns(skip = 0, limit = 50): Promise<WorkflowRun[]> {
  const { data } = await apiClient.get('/api/runs/', { params: { skip, limit } });
  return data;
}

export async function getRun(runId: number): Promise<WorkflowRun> {
  const { data } = await apiClient.get(`/api/runs/${runId}`);
  return data;
}

export async function createRun(payload: CreateRunPayload): Promise<WorkflowRun> {
  const { data } = await apiClient.post('/api/runs/', payload);
  return data;
}

export async function updateRun(runId: number, payload: UpdateRunPayload): Promise<WorkflowRun> {
  const { data } = await apiClient.patch(`/api/runs/${runId}`, payload);
  return data;
}

export async function deleteRun(runId: number): Promise<void> {
  await apiClient.delete(`/api/runs/${runId}`);
}

// ── Workflow Steps ─────────────────────────────────

export async function listSteps(runId: number): Promise<WorkflowStep[]> {
  const { data } = await apiClient.get(`/api/runs/${runId}/steps/`);
  return data;
}

export async function createStep(runId: number, payload: CreateStepPayload): Promise<WorkflowStep> {
  const { data } = await apiClient.post(`/api/runs/${runId}/steps/`, payload);
  return data;
}

export async function updateStep(
  runId: number,
  stepId: number,
  payload: UpdateStepPayload,
): Promise<WorkflowStep> {
  const { data } = await apiClient.patch(`/api/runs/${runId}/steps/${stepId}`, payload);
  return data;
}
