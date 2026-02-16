"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  approvalSeed,
  assistantDefaultText,
  automationSeed,
  quickActions,
  statsSeed,
  timelineSeed,
  trustRules,
} from "@/components/lifeos/data";
import type { ApprovalItem, Automation, Domain, StatItem, TimelineItem } from "@/components/lifeos/types";
import type { LlmMode, LlmStatusResponse, LivePulse, StreamEvent } from "@/lib/lifeos-contracts";
import * as api from "@/lib/lifeos-api";

function fallbackStats(previous: StatItem[]): StatItem[] {
  return previous.map((item) => {
    if (item.id !== "tasks") return item;

    const numeric = Number.parseInt(item.value, 10);
    if (Number.isNaN(numeric)) return item;

    return { ...item, value: String(numeric + 1) };
  });
}

export function useLifeOSStore(token: string | null) {
  const [assistantText, setAssistantText] = useState(assistantDefaultText);
  const [selectedDomain, setSelectedDomain] = useState<Domain>("All");
  const [approvals, setApprovals] = useState<ApprovalItem[]>(approvalSeed);
  const [automations, setAutomations] = useState<Automation[]>(automationSeed);
  const [timeline, setTimeline] = useState<TimelineItem[]>(timelineSeed);
  const [stats, setStats] = useState<StatItem[]>(statsSeed);
  const [livePulse, setLivePulse] = useState<LivePulse | null>(null);
  const [isRefreshingPulse, setIsRefreshingPulse] = useState(false);
  const [runningActionId, setRunningActionId] = useState<string | null>(null);
  const [isHydrating, setIsHydrating] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [llmStatus, setLlmStatus] = useState<LlmStatusResponse | null>(null);
  const [isRefreshingLlm, setIsRefreshingLlm] = useState(false);
  const [isSwitchingLlm, setIsSwitchingLlm] = useState(false);

  const hydrateDashboard = useCallback(async () => {
    if (!token) {
      setIsHydrating(false);
      return;
    }

    setIsHydrating(true);
    try {
      const snapshot = await api.fetchDashboard(token);
      setAssistantText(snapshot.assistantText);
      setApprovals(snapshot.approvals);
      setAutomations(snapshot.automations);
      setTimeline(snapshot.timeline);
      setStats(snapshot.stats);
      setLastSyncedAt(snapshot.updatedAt);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch dashboard";
      setLastError(message);
    }

    setIsHydrating(false);
  }, [token]);

  const refreshLivePulse = useCallback(async () => {
    if (!token) return;

    setIsRefreshingPulse(true);
    try {
      const snapshot = await api.fetchLivePulse(token);
      setLivePulse(snapshot);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to refresh live pulse";
      setLastError(message);
    }
    setIsRefreshingPulse(false);
  }, [token]);

  const refreshLlmStatus = useCallback(async () => {
    if (!token) return;
    setIsRefreshingLlm(true);
    try {
      const next = await api.fetchLlmStatus(token);
      setLlmStatus(next);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to fetch LLM status";
      setLastError(message);
    }
    setIsRefreshingLlm(false);
  }, [token]);

  useEffect(() => {
    void hydrateDashboard();
    void refreshLivePulse();
    void refreshLlmStatus();
  }, [hydrateDashboard, refreshLivePulse, refreshLlmStatus]);

  useEffect(() => {
    if (!token) return;

    const stream = new EventSource(`/api/lifeos/stream?token=${encodeURIComponent(token)}`);

    stream.addEventListener("pulse", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as StreamEvent;
        if (parsed.payload.livePulse) {
          setLivePulse(parsed.payload.livePulse);
        }
      } catch {
        // Ignore malformed stream payload.
      }
    });

    stream.addEventListener("sync", (event) => {
      try {
        const parsed = JSON.parse((event as MessageEvent).data) as StreamEvent;
        setLastSyncedAt(parsed.payload.updatedAt);
      } catch {
        // Ignore malformed stream payload.
      }
    });

    return () => {
      stream.close();
    };
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const interval = window.setInterval(() => {
      void refreshLlmStatus();
    }, 20000);
    return () => {
      window.clearInterval(interval);
    };
  }, [refreshLlmStatus, token]);

  const domains = useMemo(
    () => ["All", ...Array.from(new Set(quickActions.map((item) => item.domain)))] as Domain[],
    []
  );

  const visibleActions = useMemo(
    () =>
      selectedDomain === "All"
        ? quickActions
        : quickActions.filter((item) => item.domain === selectedDomain),
    [selectedDomain]
  );

  const pendingApprovals = useMemo(
    () => approvals.filter((item) => item.status === "pending"),
    [approvals]
  );

  const runQuickAction = useCallback(async (actionId: string) => {
    if (!token) return;

    const action = quickActions.find((item) => item.id === actionId);
    if (!action) return;

    setRunningActionId(action.id);
    try {
      const response = await api.runAction(token, action);
      setAssistantText(response.assistantText);
      setTimeline((previous) => [response.timeline, ...previous]);
      setApprovals((previous) => [...response.approvals, ...previous]);
      setStats((previous) => (response.stats.length ? response.stats : fallbackStats(previous)));
      setLastSyncedAt(new Date().toISOString());
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to run action";
      setLastError(message);
    }
    setRunningActionId(null);
  }, [token]);

  const handleApprovalUpdate = useCallback(async (approvalId: string, status: "approved" | "rejected") => {
    if (!token) return;

    const approval = approvals.find((item) => item.id === approvalId);
    if (!approval) return;

    try {
      const response = await api.updateApproval(token, approval, status);
      setApprovals((previous) =>
        previous.map((item) => (item.id === response.approval.id ? response.approval : item))
      );
      setAssistantText(response.assistantText);
      setLastSyncedAt(response.updatedAt);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update approval";
      setLastError(message);
    }
  }, [approvals, token]);

  const handleToggleAutomation = useCallback(async (automationId: string) => {
    if (!token) return;

    const automation = automations.find((item) => item.id === automationId);
    if (!automation) return;

    try {
      const response = await api.toggleAutomation(token, automation);
      setAutomations((previous) =>
        previous.map((item) => (item.id === response.automation.id ? response.automation : item))
      );
      setLastSyncedAt(response.updatedAt);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to toggle automation";
      setLastError(message);
    }
  }, [automations, token]);

  const resetDemo = useCallback(async () => {
    if (!token) return;

    try {
      const snapshot = await api.resetDashboard(token);
      setAssistantText(snapshot.assistantText);
      setSelectedDomain("All");
      setApprovals(snapshot.approvals);
      setAutomations(snapshot.automations);
      setTimeline(snapshot.timeline);
      setStats(snapshot.stats);
      setLastSyncedAt(snapshot.updatedAt);
      setRunningActionId(null);
      setLastError(null);

      await refreshLivePulse();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to reset dashboard";
      setLastError(message);
    }
  }, [refreshLivePulse, token]);

  const handleLlmModeChange = useCallback(async (mode: LlmMode) => {
    if (!token) return;
    setIsSwitchingLlm(true);
    try {
      const next = await api.updateLlmMode(token, mode);
      setLlmStatus(next);
      setLastError(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to switch LLM mode";
      setLastError(message);
    }
    setIsSwitchingLlm(false);
  }, [token]);

  return {
    assistantText,
    selectedDomain,
    setSelectedDomain,
    stats,
    domains,
    visibleActions,
    approvals,
    pendingApprovals,
    automations,
    timeline,
    trustRules,
    livePulse,
    isRefreshingPulse,
    runningActionId,
    isHydrating,
    lastSyncedAt,
    lastError,
    llmStatus,
    isRefreshingLlm,
    isSwitchingLlm,
    runQuickAction,
    handleApprovalUpdate,
    handleToggleAutomation,
    handleLlmModeChange,
    refreshLlmStatus,
    refreshLivePulse,
    resetDemo,
    setAssistantText,
    setTimeline,
    setLastError,
    setLastSyncedAt,
  };
}
