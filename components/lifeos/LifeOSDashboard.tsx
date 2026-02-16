"use client";

import { motion } from "framer-motion";
import { quickActions } from "@/components/lifeos/data";
import LifeOSHeader from "@/components/lifeos/sections/LifeOSHeader";
import MissionControl from "@/components/lifeos/sections/MissionControl";
import TaskLibrary from "@/components/lifeos/sections/TaskLibrary";
import ApprovalsPanel from "@/components/lifeos/sections/ApprovalsPanel";
import AutomationStudio from "@/components/lifeos/sections/AutomationStudio";
import ExecutionFeed from "@/components/lifeos/sections/ExecutionFeed";
import SafetyPanel from "@/components/lifeos/sections/SafetyPanel";
import ConciergePanel from "@/components/lifeos/sections/ConciergePanel";
import LivePulsePanel from "@/components/lifeos/sections/LivePulsePanel";
import LlmControlPanel from "@/components/lifeos/sections/LlmControlPanel";
import WorkflowEnginePanel from "@/components/lifeos/sections/WorkflowEnginePanel";
import { useLifeOSStore } from "@/components/lifeos/useLifeOSStore";
import { useWorkflowEngine } from "@/components/lifeos/useWorkflowEngine";
import type { AuthUser } from "@/lib/lifeos-contracts";

const sectionReveal = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.5 },
};

type Props = {
  token: string;
  user: AuthUser;
  onLogout: () => void;
};

export default function LifeOSDashboard({ token, user, onLogout }: Props) {
  const {
    assistantText,
    selectedDomain,
    setSelectedDomain,
    stats,
    domains,
    visibleActions,
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
  } = useLifeOSStore(token);

  const {
    workflowStatus,
    workflowError,
    workflowSubmitting,
    workflowRefreshing,
    refreshWorkflowStatus,
    submitIntent,
    toTimelineItem,
  } = useWorkflowEngine(token);

  const combinedError = lastError ?? workflowError;

  async function handleSubmitWorkflowIntent(intent: string) {
    const result = await submitIntent(intent);
    if (!result) {
      setLastError(workflowError ?? "Workflow engine submission failed");
      return;
    }

    setAssistantText(
      `Workflow Engine accepted run #${result.workflowId}. I will mirror timeline updates here while execution continues upstream.`
    );
    setTimeline((previous) => [toTimelineItem(result), ...previous]);
    setLastSyncedAt(new Date().toISOString());
    setLastError(null);
  }

  return (
    <div className="relative min-h-screen pb-20">
      <div className="pointer-events-none fixed inset-0 opacity-[0.2] grid-fabric" />

      <LifeOSHeader
        pendingApprovals={pendingApprovals}
        isHydrating={isHydrating}
        lastSyncedAt={lastSyncedAt}
        llmMode={llmStatus?.mode}
        llmReady={llmStatus?.ready}
        user={user}
        onReset={resetDemo}
        onLogout={onLogout}
      />

      <main className="mx-auto grid w-full max-w-7xl gap-3 px-3 pt-4 sm:px-4 md:gap-5 md:px-8 md:pt-6">
        <MissionControl
          stats={stats}
          assistantText={assistantText}
          lastError={combinedError}
          quickCommands={quickActions}
          runningActionId={runningActionId}
          onRunAction={runQuickAction}
        />

        <motion.div {...sectionReveal}>
          <LivePulsePanel pulse={livePulse} loading={isRefreshingPulse} onRefresh={refreshLivePulse} />
        </motion.div>

        <motion.div {...sectionReveal}>
          <LlmControlPanel
            status={llmStatus}
            loading={isRefreshingLlm}
            switching={isSwitchingLlm}
            onRefresh={refreshLlmStatus}
            onChangeMode={handleLlmModeChange}
          />
        </motion.div>

        <motion.div {...sectionReveal}>
          <WorkflowEnginePanel
            status={workflowStatus}
            error={workflowError}
            submitting={workflowSubmitting}
            refreshing={workflowRefreshing}
            onRefresh={() => {
              void refreshWorkflowStatus();
            }}
            onSubmitIntent={(intent) => {
              void handleSubmitWorkflowIntent(intent);
            }}
          />
        </motion.div>

        <motion.section {...sectionReveal} className="grid gap-3 md:gap-4 xl:grid-cols-[1.3fr_0.7fr]">
          <TaskLibrary
            domains={domains}
            selectedDomain={selectedDomain}
            actions={visibleActions}
            runningActionId={runningActionId}
            onSelectDomain={setSelectedDomain}
            onRunAction={runQuickAction}
          />
          <ApprovalsPanel approvals={pendingApprovals} onApprovalUpdate={handleApprovalUpdate} />
        </motion.section>

        <motion.section {...sectionReveal} className="grid gap-3 md:gap-4 lg:grid-cols-3">
          <AutomationStudio automations={automations} onToggleAutomation={handleToggleAutomation} />
          <ExecutionFeed timeline={timeline} />
          <SafetyPanel rules={trustRules} />
        </motion.section>

        <ConciergePanel />
      </main>
    </div>
  );
}
