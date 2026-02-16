"use client";

import { useCallback, useEffect, useState } from "react";
import type { TimelineItem } from "@/components/lifeos/types";
import type { SubmitWorkflowEngineResponse, WorkflowEngineStatusResponse } from "@/lib/lifeos-contracts";
import * as api from "@/lib/lifeos-api";

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

type UseWorkflowEngineResult = {
  workflowStatus: WorkflowEngineStatusResponse | null;
  workflowError: string | null;
  workflowSubmitting: boolean;
  workflowRefreshing: boolean;
  refreshWorkflowStatus: () => Promise<void>;
  submitIntent: (intent: string) => Promise<SubmitWorkflowEngineResponse | null>;
  toTimelineItem: (result: SubmitWorkflowEngineResponse) => TimelineItem;
};

export function useWorkflowEngine(token: string): UseWorkflowEngineResult {
  const [workflowStatus, setWorkflowStatus] = useState<WorkflowEngineStatusResponse | null>(null);
  const [workflowError, setWorkflowError] = useState<string | null>(null);
  const [workflowSubmitting, setWorkflowSubmitting] = useState(false);
  const [workflowRefreshing, setWorkflowRefreshing] = useState(false);

  const refreshWorkflowStatus = useCallback(async () => {
    setWorkflowRefreshing(true);
    try {
      const next = await api.fetchWorkflowEngineStatus(token);
      setWorkflowStatus(next);
      setWorkflowError(next.error ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch workflow engine status";
      setWorkflowError(message);
    }
    setWorkflowRefreshing(false);
  }, [token]);

  const submitIntent = useCallback(async (intent: string) => {
    setWorkflowSubmitting(true);
    try {
      const result = await api.submitWorkflowEngineIntent(token, intent);
      setWorkflowError(null);
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to submit workflow intent";
      setWorkflowError(message);
      return null;
    } finally {
      setWorkflowSubmitting(false);
    }
  }, [token]);

  useEffect(() => {
    void refreshWorkflowStatus();
  }, [refreshWorkflowStatus]);

  const toTimelineItem = useCallback((result: SubmitWorkflowEngineResponse): TimelineItem => {
    return {
      id: crypto.randomUUID(),
      time: nowTimeLabel(),
      event: `Workflow Engine: run #${result.workflowId}`,
      info: `Submitted intent: ${result.intent}`,
    };
  }, []);

  return {
    workflowStatus,
    workflowError,
    workflowSubmitting,
    workflowRefreshing,
    refreshWorkflowStatus,
    submitIntent,
    toTimelineItem,
  };
}
