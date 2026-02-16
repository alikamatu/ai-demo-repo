import { useCallback, useEffect, useMemo, useState } from "react";
import * as api from "@/src/services/api";
import {
  enqueue,
  readDashboardCache,
  readPulseCache,
  readQueue,
  saveDashboardCache,
  savePulseCache,
  writeQueue,
} from "@/src/services/offline-store";
import type {
  ApprovalItem,
  Automation,
  DashboardSnapshot,
  LlmMode,
  LlmStatusResponse,
  LivePulse,
  QueuedMutation,
  RunActionResponse,
  StatItem,
  TimelineItem,
} from "@/src/types/lifeos";

const quickActions = [
  { id: "job-sprint", label: "Run Job Sprint" },
  { id: "content-launch", label: "Launch Content" },
  { id: "event-planner", label: "Plan Event" },
  { id: "doc-vault", label: "Sort Documents" },
] as const;

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function optimisticTaskBump(stats: StatItem[]): StatItem[] {
  return stats.map((item) => {
    if (item.id !== "tasks") return item;

    const value = Number.parseInt(item.value, 10);
    if (Number.isNaN(value)) return item;

    return { ...item, value: String(value + 1) };
  });
}

export function useDashboard(token: string | null, userId: string | null) {
  const [dashboard, setDashboard] = useState<DashboardSnapshot | null>(null);
  const [livePulse, setLivePulse] = useState<LivePulse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [queueCount, setQueueCount] = useState(0);
  const [offlineMode, setOfflineMode] = useState(false);
  const [llmStatus, setLlmStatus] = useState<LlmStatusResponse | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmSwitching, setLlmSwitching] = useState(false);
  const [lastOrchestration, setLastOrchestration] = useState<RunActionResponse["orchestration"] | null>(null);
  const [lastProviderCheckAt, setLastProviderCheckAt] = useState<string | null>(null);
  const [providerCheckRunning, setProviderCheckRunning] = useState(false);

  const applyQueueMutation = useCallback((snapshot: DashboardSnapshot, mutation: QueuedMutation): DashboardSnapshot => {
    if (mutation.type === "run-action") {
      const action = quickActions.find((item) => item.id === mutation.payload.actionId);
      const timeline: TimelineItem = {
        id: mutation.id,
        time: nowTimeLabel(),
        event: `Queued: ${action?.label ?? mutation.payload.actionId}`,
        info: "Stored offline and will sync automatically when network is available.",
      };

      return {
        ...snapshot,
        assistantText: `Queued action: ${action?.label ?? mutation.payload.actionId}`,
        timeline: [timeline, ...snapshot.timeline],
        stats: optimisticTaskBump(snapshot.stats),
        updatedAt: new Date().toISOString(),
      };
    }

    if (mutation.type === "update-approval") {
      const approvals = snapshot.approvals.map((item) =>
        item.id === mutation.payload.approvalId ? { ...item, status: mutation.payload.status } : item
      );

      return {
        ...snapshot,
        approvals,
        assistantText: `Queued approval update: ${mutation.payload.approvalId}`,
        updatedAt: new Date().toISOString(),
      };
    }

    const automations = snapshot.automations.map((item) =>
      item.id === mutation.payload.automationId ? { ...item, status: mutation.payload.status } : item
    );

    return {
      ...snapshot,
      automations,
      assistantText: `Queued automation update: ${mutation.payload.automationId}`,
      updatedAt: new Date().toISOString(),
    };
  }, []);

  const flushQueue = useCallback(async () => {
    if (!token || !userId) return;

    const queue = await readQueue(userId);
    if (!queue.length) {
      setQueueCount(0);
      return;
    }

    const pending: QueuedMutation[] = [];

    for (const mutation of queue) {
      if (mutation.type === "run-action") {
        const response = await api.runAction(token, mutation.payload.actionId);
        if (!response) {
          pending.push(mutation);
          continue;
        }
      }

      if (mutation.type === "update-approval") {
        const response = await api.updateApproval(token, mutation.payload.approvalId, mutation.payload.status);
        if (!response) {
          pending.push(mutation);
          continue;
        }
      }

      if (mutation.type === "toggle-automation") {
        const response = await api.toggleAutomation(token, mutation.payload.automationId, mutation.payload.status);
        if (!response) {
          pending.push(mutation);
          continue;
        }
      }
    }

    await writeQueue(userId, pending);
    setQueueCount(pending.length);
    setOfflineMode(pending.length > 0);
  }, [token, userId]);

  const hydrate = useCallback(async () => {
    if (!token || !userId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    const [cachedDash, cachedPulse, queue] = await Promise.all([
      readDashboardCache(userId),
      readPulseCache(userId),
      readQueue(userId),
    ]);

    if (cachedDash) setDashboard(cachedDash);
    if (cachedPulse) setLivePulse(cachedPulse);
    setQueueCount(queue.length);

    await flushQueue();

    const [dash, pulse] = await Promise.all([
      api.getDashboard(token),
      api.getLivePulse(token),
    ]);
    const llm = await api.getLlmStatus(token);

    if (dash) {
      const freshQueue = await readQueue(userId);
      const withQueued = freshQueue.reduce(applyQueueMutation, dash);
      setDashboard(withQueued);
      await saveDashboardCache(userId, withQueued);
      setOfflineMode(false);
    } else {
      setOfflineMode(true);
    }

    if (pulse) {
      setLivePulse(pulse);
      await savePulseCache(userId, pulse);
    }

    if (llm) {
      setLlmStatus(llm);
    }

    setLoading(false);
  }, [applyQueueMutation, flushQueue, token, userId]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const refresh = useCallback(async () => {
    if (!token || !userId) return;

    setRefreshing(true);
    await flushQueue();

    const [dash, pulse] = await Promise.all([
      api.getDashboard(token),
      api.getLivePulse(token),
    ]);
    const llm = await api.getLlmStatus(token);

    if (dash) {
      const queue = await readQueue(userId);
      const withQueued = queue.reduce(applyQueueMutation, dash);
      setDashboard(withQueued);
      await saveDashboardCache(userId, withQueued);
      setOfflineMode(false);
    } else {
      setOfflineMode(true);
    }

    if (pulse) {
      setLivePulse(pulse);
      await savePulseCache(userId, pulse);
    }

    if (llm) {
      setLlmStatus(llm);
    }

    setRefreshing(false);
  }, [applyQueueMutation, flushQueue, token, userId]);

  const refreshLlmStatus = useCallback(async () => {
    if (!token) return;
    setLlmLoading(true);
    const next = await api.getLlmStatus(token);
    if (next) {
      setLlmStatus(next);
    }
    setLlmLoading(false);
  }, [token]);

  const changeLlmMode = useCallback(async (mode: LlmMode) => {
    if (!token) return;
    setLlmSwitching(true);
    const next = await api.setLlmMode(token, mode);
    if (next) {
      setLlmStatus(next);
    }
    setLlmSwitching(false);
  }, [token]);

  const runAction = useCallback(async (actionId: string) => {
    if (!token || !userId || !dashboard) return;

    const response = await api.runAction(token, actionId);
    if (response) {
      const next: DashboardSnapshot = {
        ...dashboard,
        assistantText: response.assistantText,
        timeline: [response.timeline, ...dashboard.timeline],
        approvals: [...response.approvals, ...dashboard.approvals],
        stats: response.stats.length ? response.stats : optimisticTaskBump(dashboard.stats),
        updatedAt: new Date().toISOString(),
      };

      setDashboard(next);
      setLastOrchestration(response.orchestration ?? null);
      await saveDashboardCache(userId, next);
      return response;
    }

    const mutation: QueuedMutation = {
      id: `${Date.now()}-${actionId}`,
      type: "run-action",
      payload: { actionId },
      createdAt: Date.now(),
    };

    await enqueue(userId, mutation);
    const queued = applyQueueMutation(dashboard, mutation);
    setDashboard(queued);
    setQueueCount((count) => count + 1);
    setOfflineMode(true);
    await saveDashboardCache(userId, queued);
    return null;
  }, [applyQueueMutation, dashboard, token, userId]);

  const runProviderCheck = useCallback(async () => {
    setProviderCheckRunning(true);
    const response = await runAction("job-sprint");
    if (response?.orchestration) {
      setLastOrchestration(response.orchestration);
      setLastProviderCheckAt(new Date().toISOString());
    }
    setProviderCheckRunning(false);
  }, [runAction]);

  const updateApproval = useCallback(async (approvalId: string, status: "approved" | "rejected") => {
    if (!token || !userId || !dashboard) return;

    const response = await api.updateApproval(token, approvalId, status);
    if (response) {
      const next: DashboardSnapshot = {
        ...dashboard,
        approvals: dashboard.approvals.map((item) =>
          item.id === response.approval.id ? response.approval : item
        ),
        assistantText: response.assistantText,
        updatedAt: response.updatedAt,
      };

      setDashboard(next);
      await saveDashboardCache(userId, next);
      return;
    }

    const mutation: QueuedMutation = {
      id: `${Date.now()}-${approvalId}`,
      type: "update-approval",
      payload: { approvalId, status },
      createdAt: Date.now(),
    };

    await enqueue(userId, mutation);
    const queued = applyQueueMutation(dashboard, mutation);
    setDashboard(queued);
    setQueueCount((count) => count + 1);
    setOfflineMode(true);
    await saveDashboardCache(userId, queued);
  }, [applyQueueMutation, dashboard, token, userId]);

  const toggleAutomation = useCallback(async (automation: Automation) => {
    if (!token || !userId || !dashboard) return;

    const nextStatus: Automation["status"] = automation.status === "active" ? "paused" : "active";
    const response = await api.toggleAutomation(token, automation.id, nextStatus);

    if (response) {
      const next: DashboardSnapshot = {
        ...dashboard,
        automations: dashboard.automations.map((item) =>
          item.id === response.automation.id ? response.automation : item
        ),
        updatedAt: response.updatedAt,
      };

      setDashboard(next);
      await saveDashboardCache(userId, next);
      return;
    }

    const mutation: QueuedMutation = {
      id: `${Date.now()}-${automation.id}`,
      type: "toggle-automation",
      payload: { automationId: automation.id, status: nextStatus },
      createdAt: Date.now(),
    };

    await enqueue(userId, mutation);
    const queued = applyQueueMutation(dashboard, mutation);
    setDashboard(queued);
    setQueueCount((count) => count + 1);
    setOfflineMode(true);
    await saveDashboardCache(userId, queued);
  }, [applyQueueMutation, dashboard, token, userId]);

  const sendPushTest = useCallback(async () => {
    if (!token) return null;
    return api.sendPushTest(token);
  }, [token]);

  const pendingApprovals = useMemo(
    () => dashboard?.approvals.filter((item: ApprovalItem) => item.status === "pending") ?? [],
    [dashboard]
  );

  return {
    dashboard,
    livePulse,
    loading,
    refreshing,
    queueCount,
    offlineMode,
    llmStatus,
    llmLoading,
    llmSwitching,
    lastOrchestration,
    lastProviderCheckAt,
    providerCheckRunning,
    pendingApprovals,
    quickActions,
    refresh,
    refreshLlmStatus,
    changeLlmMode,
    runProviderCheck,
    runAction,
    updateApproval,
    toggleAutomation,
    sendPushTest,
  };
}
