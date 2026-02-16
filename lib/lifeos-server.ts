import { quickActions } from "@/components/lifeos/data";
import type { ApprovalItem, StatItem, TimelineItem } from "@/components/lifeos/types";
import type {
  ApprovalUpdateRequest,
  ApprovalUpdateResponse,
  AutomationToggleRequest,
  AutomationToggleResponse,
  DashboardResponse,
  RunActionRequest,
  RunActionResponse,
} from "@/lib/lifeos-contracts";
import { composeAssistantText } from "@/lib/llm-orchestrator";
import { getActionExecutionDetails } from "@/lib/action-execution";
import { readSnapshot, readUserLlmMode, resetSnapshot, writeSnapshot } from "@/lib/lifeos-db";

function nowTimeLabel(): string {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function bumpTaskCount(stats: StatItem[]): StatItem[] {
  return stats.map((item) => {
    if (item.id !== "tasks") return item;

    const current = Number.parseInt(item.value, 10);
    if (Number.isNaN(current)) return item;
    return { ...item, value: String(current + 1) };
  });
}

function buildActionTimeline(actionTitle: string, info: string): TimelineItem {
  return {
    id: crypto.randomUUID(),
    time: nowTimeLabel(),
    event: `Executed: ${actionTitle}`,
    info,
  };
}

function buildActionApprovals(actionId: string): ApprovalItem[] {
  if (actionId === "event-planner") {
    return [
      {
        id: `event-budget-${Date.now()}`,
        title: "Confirm event budget before booking",
        note: "Estimated spend: $312 across venue + food.",
        cta: "Approve",
        status: "pending",
      },
    ];
  }

  return [];
}

export async function getDashboard(userId: string): Promise<DashboardResponse> {
  return readSnapshot(userId);
}

export async function runAction(userId: string, request: RunActionRequest): Promise<RunActionResponse> {
  const action = quickActions.find((item) => item.id === request.actionId);
  if (!action) {
    throw new Error("Unknown actionId");
  }

  const snapshot = await readSnapshot(userId);
  const execution = await getActionExecutionDetails(action.id);
  const timeline = buildActionTimeline(action.title, execution.timelineInfo);
  const approvals = buildActionApprovals(action.id);
  const nextStats = bumpTaskCount(snapshot.stats);

  const llmMode = await readUserLlmMode(userId);
  const llm = await composeAssistantText({ userId, actionId: request.actionId, llmMode });

  const next = {
    ...snapshot,
    assistantText: `${llm.assistantText}\n\n${execution.assistantSuffix}`,
    stats: nextStats,
    timeline: [timeline, ...snapshot.timeline].slice(0, 60),
    approvals: [...approvals, ...snapshot.approvals],
    updatedAt: new Date().toISOString(),
  };

  await writeSnapshot(userId, next);

  return {
    assistantText: next.assistantText,
    timeline,
    approvals,
    stats: nextStats,
    orchestration: {
      provider: llm.provider,
      model: llm.model,
    },
  };
}

export async function updateApproval(
  userId: string,
  request: ApprovalUpdateRequest
): Promise<ApprovalUpdateResponse> {
  const snapshot = await readSnapshot(userId);
  const existing = snapshot.approvals.find((item) => item.id === request.approvalId);

  if (!existing) {
    throw new Error("Unknown approvalId");
  }

  const approval = { ...existing, status: request.status };
  const assistantText =
    request.status === "approved"
      ? `Confirmed: ${existing.title}. I will continue execution and keep you updated.`
      : `Stopped: ${existing.title}. I will not proceed unless you update the policy.`;

  const next = {
    ...snapshot,
    assistantText,
    approvals: snapshot.approvals.map((item) => (item.id === approval.id ? approval : item)),
    updatedAt: new Date().toISOString(),
  };

  await writeSnapshot(userId, next);

  return {
    approval,
    assistantText,
    updatedAt: next.updatedAt,
  };
}

export async function toggleAutomation(
  userId: string,
  request: AutomationToggleRequest
): Promise<AutomationToggleResponse> {
  const snapshot = await readSnapshot(userId);
  const existing = snapshot.automations.find((item) => item.id === request.automationId);

  if (!existing) {
    throw new Error("Unknown automationId");
  }

  const automation = { ...existing, status: request.status };

  const next = {
    ...snapshot,
    automations: snapshot.automations.map((item) =>
      item.id === automation.id ? automation : item
    ),
    updatedAt: new Date().toISOString(),
  };

  await writeSnapshot(userId, next);

  return {
    automation,
    updatedAt: next.updatedAt,
  };
}

export async function resetDashboard(userId: string) {
  return resetSnapshot(userId);
}
