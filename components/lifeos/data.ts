import type { ApprovalItem, Automation, QuickAction, StatItem, TimelineItem } from "@/components/lifeos/types";

export const quickActions: QuickAction[] = [
  {
    id: "job-sprint",
    title: "Apply to 12 matched jobs",
    shortLabel: "Job Sprint",
    detail: "AI customizes CV + cover letters, fills forms, and drafts recruiter follow-ups.",
    eta: "17 min",
    domain: "Career",
    assistantResponse:
      "Starting full career sprint: role discovery, CV tuning, applications, and follow-up scheduling.",
  },
  {
    id: "content-launch",
    title: "Publish today's 4 social posts",
    shortLabel: "Launch Content",
    detail: "Writes captions, generates visuals, schedules LinkedIn/X/Instagram/TikTok.",
    eta: "8 min",
    domain: "Social",
    assistantResponse:
      "Generating a 7-day social campaign with captions, visuals, and platform scheduling.",
  },
  {
    id: "event-planner",
    title: "Plan a budget dinner event",
    shortLabel: "Plan Event",
    detail: "Selects venue, checks guest availability, drafts invite sequence, and books food.",
    eta: "13 min",
    domain: "Lifestyle",
    assistantResponse:
      "Building your dinner plan with venue shortlist, invites, reminders, and food ordering.",
  },
  {
    id: "doc-vault",
    title: "Sort docs into tax-ready vault",
    shortLabel: "Sort Docs",
    detail: "Extracts key data from receipts/contracts and files by legal and finance policy.",
    eta: "11 min",
    domain: "Admin",
    assistantResponse:
      "Organizing uploaded documents into legal, finance, personal, and tax-ready collections.",
  },
];

export const statsSeed: StatItem[] = [
  { id: "tasks", value: "128", label: "Tasks completed this week" },
  { id: "automations", value: "23", label: "Automations running" },
  { id: "auto-rate", value: "94%", label: "Actions done without manual effort" },
];

export const automationSeed: Automation[] = [
  {
    id: "morning-brief",
    name: "Morning Command Brief",
    trigger: "Daily at 6:45 AM",
    effect: "Delivers top priorities, urgent tasks, weather, meetings, and commute risk.",
    status: "active",
  },
  {
    id: "opportunity-hunter",
    name: "Opportunity Hunter",
    trigger: "Every 3 hours",
    effect: "Finds relevant job openings, ranks fit score, and drafts instant applications.",
    status: "active",
  },
  {
    id: "household-pulse",
    name: "Household Pulse",
    trigger: "Thursday at 7:00 PM",
    effect: "Creates groceries plan, utility reminders, maintenance tasks, and family schedule.",
    status: "review",
  },
  {
    id: "document-guardian",
    name: "Document Guardian",
    trigger: "When file is uploaded",
    effect: "Renames, tags, summarizes, and stores docs with source link + retention policy.",
    status: "active",
  },
];

export const approvalSeed: ApprovalItem[] = [
  {
    id: "offer-letter",
    title: "Send signed offer letter",
    note: "High impact legal action",
    cta: "Review",
    status: "pending",
  },
  {
    id: "catering",
    title: "Order catering for 24 guests",
    note: "$284 estimated total",
    cta: "Approve",
    status: "pending",
  },
  {
    id: "opinion-post",
    title: "Publish political-opinion post",
    note: "Outside standard social policy",
    cta: "Edit",
    status: "pending",
  },
];

export const timelineSeed: TimelineItem[] = [
  {
    id: "1",
    time: "08:00",
    event: "Submitted 4 tailored applications",
    info: "Target roles: Product Designer, AI UX Engineer, Frontend Lead",
  },
  {
    id: "2",
    time: "09:25",
    event: "Auto-updated CV for FinTech role",
    info: "Added impact metrics and built a role-specific summary section",
  },
  {
    id: "3",
    time: "11:00",
    event: "Scheduled 6 social posts",
    info: "Balanced educational, thought-leadership, and project demo content",
  },
  {
    id: "4",
    time: "14:10",
    event: "Prepared birthday dinner logistics",
    info: "Reservation confirmed, reminders sent, dietary options included",
  },
];

export const trustRules = [
  "No payment above $50 without approval",
  "Never submit legal documents without review",
  "Post social content only between 8 AM and 7 PM",
  "Auto-apply to jobs with fit score above 82%",
];

export const assistantDefaultText =
  "I can run today's tasks end-to-end. Tap any action and I will execute with your policy rules.";
