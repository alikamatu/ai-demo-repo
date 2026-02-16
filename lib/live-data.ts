import type { LivePulse } from "@/lib/lifeos-contracts";
import { serverConfig } from "@/lib/server-config";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=40.7128&longitude=-74.0060&current=temperature_2m,weather_code&temperature_unit=celsius";
const JOBS_URL = "https://remoteok.com/api";
const NEWS_URL = "https://hn.algolia.com/api/v1/search?tags=front_page";

let cache: LivePulse | null = null;
let cacheTime = 0;

function weatherCodeToLabel(code: number): string {
  if (code === 0) return "Clear";
  if ([1, 2].includes(code)) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67].includes(code)) return "Rain";
  if ([71, 73, 75, 77].includes(code)) return "Snow";
  if ([80, 81, 82].includes(code)) return "Showers";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Unknown";
}

async function fetchJSON<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "LifeOS-Dashboard/1.0",
      },
      signal: controller.signal,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Upstream request failed: ${response.status}`);
    }

    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}

async function pullLivePulse(): Promise<LivePulse> {
  const nowIso = new Date().toISOString();

  const fallback: LivePulse = {
    weather: {
      city: "New York",
      temperatureC: 21,
      condition: "Unavailable",
    },
    jobs: {
      source: "RemoteOK",
      role: "Frontend Engineer",
      company: "Example Co",
      location: "Remote",
      url: "https://remoteok.com/",
    },
    news: {
      source: "Hacker News",
      headline: "Live feed unavailable, showing fallback",
      url: "https://news.ycombinator.com/",
      points: 0,
    },
    updatedAt: nowIso,
  };

  try {
    const [weatherRaw, jobsRaw, newsRaw] = await Promise.all([
      fetchJSON<{
        current?: {
          temperature_2m?: number;
          weather_code?: number;
        };
      }>(WEATHER_URL),
      fetchJSON<Array<Record<string, unknown>>>(JOBS_URL),
      fetchJSON<{
        hits?: Array<{
          title?: string;
          points?: number;
          url?: string;
        }>;
      }>(NEWS_URL),
    ]);

    const job = (jobsRaw || []).find((entry) => typeof entry.position === "string") ?? null;
    const headline = newsRaw.hits?.find((item) => typeof item.title === "string") ?? null;

    return {
      weather: {
        city: "New York",
        temperatureC: Math.round(weatherRaw.current?.temperature_2m ?? fallback.weather.temperatureC),
        condition: weatherCodeToLabel(weatherRaw.current?.weather_code ?? -1),
      },
      jobs: {
        source: "RemoteOK",
        role: String(job?.position ?? fallback.jobs.role),
        company: String(job?.company ?? fallback.jobs.company),
        location: String(job?.location ?? fallback.jobs.location),
        url: String(job?.url ?? fallback.jobs.url),
      },
      news: {
        source: "Hacker News",
        headline: String(headline?.title ?? fallback.news.headline),
        url: String(headline?.url ?? fallback.news.url),
        points: Number(headline?.points ?? fallback.news.points),
      },
      updatedAt: nowIso,
    };
  } catch (error) {
    if (serverConfig.strictIntegrations) {
      const message = error instanceof Error ? error.message : "Live data fetch failed";
      throw new Error(`LIVE_DATA_UNAVAILABLE: ${message}`);
    }
    return fallback;
  }
}

export async function getLivePulse(force = false): Promise<LivePulse> {
  const now = Date.now();
  if (!force && cache && now - cacheTime < 60_000) {
    return cache;
  }

  const next = await pullLivePulse();
  cache = next;
  cacheTime = now;
  return next;
}
