/**
 * React Query hooks for data fetching and mutations.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './endpoints';
import type { CreateRunPayload, UpdateRunPayload } from '../types';

// ── Query keys ─────────────────────────────────────

export const queryKeys = {
  health: ['health'] as const,
  runs: ['runs'] as const,
  run: (id: number) => ['runs', id] as const,
  steps: (runId: number) => ['runs', runId, 'steps'] as const,
};

// ── Health ─────────────────────────────────────────

export function useHealth() {
  return useQuery({
    queryKey: queryKeys.health,
    queryFn: api.getHealth,
    refetchInterval: 30_000, // Poll every 30s
  });
}

// ── Runs ───────────────────────────────────────────

export function useRuns() {
  return useQuery({
    queryKey: queryKeys.runs,
    queryFn: () => api.listRuns(),
  });
}

export function useRun(runId: number) {
  return useQuery({
    queryKey: queryKeys.run(runId),
    queryFn: () => api.getRun(runId),
    enabled: runId > 0,
  });
}

export function useCreateRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRunPayload) => api.createRun(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runs });
    },
  });
}

export function useUpdateRun(runId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateRunPayload) => api.updateRun(runId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.run(runId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.runs });
    },
  });
}

export function useDeleteRun() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (runId: number) => api.deleteRun(runId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.runs });
    },
  });
}

// ── Steps ──────────────────────────────────────────

export function useSteps(runId: number) {
  return useQuery({
    queryKey: queryKeys.steps(runId),
    queryFn: () => api.listSteps(runId),
    enabled: runId > 0,
  });
}
