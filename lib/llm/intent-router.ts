import type { Intent } from "@/lib/llm/types";

export function routeIntent(actionId: string): Intent {
  switch (actionId) {
    case "job-sprint":
      return {
        intent: "career.apply",
        goal: "Find relevant roles and submit tailored applications.",
        riskLevel: "medium",
      };
    case "content-launch":
      return {
        intent: "social.publish",
        goal: "Prepare and publish social content across channels.",
        riskLevel: "medium",
      };
    case "event-planner":
      return {
        intent: "lifestyle.plan",
        goal: "Coordinate event logistics and bookings.",
        riskLevel: "high",
      };
    case "doc-vault":
      return {
        intent: "admin.organize",
        goal: "Classify and structure documents with metadata.",
        riskLevel: "low",
      };
    default:
      return {
        intent: "generic.execute",
        goal: "Execute requested workflow.",
        riskLevel: "medium",
      };
  }
}
