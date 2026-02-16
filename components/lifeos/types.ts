export type Domain = "All" | "Career" | "Social" | "Lifestyle" | "Admin";

export type QuickAction = {
  id: string;
  title: string;
  shortLabel: string;
  detail: string;
  eta: string;
  domain: Exclude<Domain, "All">;
  assistantResponse: string;
};

export type Automation = {
  id: string;
  name: string;
  trigger: string;
  effect: string;
  status: "active" | "review" | "paused";
};

export type ApprovalItem = {
  id: string;
  title: string;
  note: string;
  cta: string;
  status: "pending" | "approved" | "rejected";
};

export type TimelineItem = {
  id: string;
  time: string;
  event: string;
  info: string;
};

export type StatItem = {
  id: string;
  value: string;
  label: string;
};
