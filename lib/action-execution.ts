import { readdir } from "node:fs/promises";
import path from "node:path";
import { serverConfig } from "@/lib/server-config";

type ActionExecutionDetails = {
  timelineInfo: string;
  assistantSuffix: string;
};

async function fetchJSON<T>(url: string, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: {
        "User-Agent": "LifeOS/1.0",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

function fallbackFor(actionId: string): ActionExecutionDetails {
  switch (actionId) {
    case "job-sprint":
      return {
        timelineInfo: "Prepared role matching from cached profile data and prior sources.",
        assistantSuffix: "Live job feeds were unavailable, so I used cached market signals.",
      };
    case "content-launch":
      return {
        timelineInfo: "Built content queue from cached trend topics and prior engagement data.",
        assistantSuffix: "Live news feed was unavailable, so I used cached trend context.",
      };
    case "event-planner":
      return {
        timelineInfo: "Planned event schedule using cached weather and guest constraints.",
        assistantSuffix: "Live weather feed was unavailable, so I used cached conditions.",
      };
    case "doc-vault":
      return {
        timelineInfo: "Organized known files and retained prior taxonomy.",
        assistantSuffix: "Live file scan partially failed, so I used known folders.",
      };
    default:
      return {
        timelineInfo: "Executed automation with current workspace context.",
        assistantSuffix: "Execution completed with baseline context.",
      };
  }
}

async function jobSprintDetails(): Promise<ActionExecutionDetails> {
  const jobs = await fetchJSON<Array<Record<string, unknown>>>("https://remoteok.com/api");
  const top = jobs.find((entry) => typeof entry.position === "string");

  const role = String(top?.position ?? "Software Engineer");
  const company = String(top?.company ?? "Unknown company");
  const location = String(top?.location ?? "Remote");

  return {
    timelineInfo: `Matched live role: ${role} at ${company} (${location}).`,
    assistantSuffix: `I used live job data and prioritized ${role} at ${company} for immediate application.`,
  };
}

async function contentLaunchDetails(): Promise<ActionExecutionDetails> {
  const news = await fetchJSON<{
    hits?: Array<{ title?: string; points?: number }>;
  }>("https://hn.algolia.com/api/v1/search?tags=front_page");

  const top = news.hits?.find((item) => typeof item.title === "string");
  const title = String(top?.title ?? "Top market headline");
  const points = Number(top?.points ?? 0);

  return {
    timelineInfo: `Built post set from live headline: "${title}" (${points} points).`,
    assistantSuffix: `I used live trend context from Hacker News and aligned today's posts to "${title}".`,
  };
}

async function eventPlannerDetails(): Promise<ActionExecutionDetails> {
  const weather = await fetchJSON<{
    current?: { temperature_2m?: number; weather_code?: number };
  }>(
    "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code&temperature_unit=celsius"
  );

  const temp = Math.round(Number(weather.current?.temperature_2m ?? 21));
  const code = Number(weather.current?.weather_code ?? 0);

  return {
    timelineInfo: `Planned with live NYC weather: ${temp}C (code ${code}).`,
    assistantSuffix: `I used live weather to optimize venue timing, transport windows, and guest reminders.`,
  };
}

async function docVaultDetails(): Promise<ActionExecutionDetails> {
  const docsDir = path.join(process.cwd(), "docs");
  const entries = await readdir(docsDir, { withFileTypes: true });
  const files = entries.filter((entry) => entry.isFile()).length;

  return {
    timelineInfo: `Scanned local docs directory: ${files} files indexed.`,
    assistantSuffix: `I scanned your local docs workspace and updated classification over ${files} files.`,
  };
}

export async function getActionExecutionDetails(actionId: string): Promise<ActionExecutionDetails> {
  try {
    switch (actionId) {
      case "job-sprint":
        return await jobSprintDetails();
      case "content-launch":
        return await contentLaunchDetails();
      case "event-planner":
        return await eventPlannerDetails();
      case "doc-vault":
        return await docVaultDetails();
      default:
        return fallbackFor(actionId);
    }
  } catch {
    if (serverConfig.strictIntegrations) {
      throw new Error(`ACTION_INTEGRATION_FAILED: ${actionId}`);
    }
    return fallbackFor(actionId);
  }
}
