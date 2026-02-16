import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  approvalSeed,
  assistantDefaultText,
  automationSeed,
  statsSeed,
  timelineSeed,
} from "@/components/lifeos/data";
import type { DashboardSnapshot } from "@/lib/lifeos-contracts";
import type { LlmMode } from "@/lib/server-config";
import { isValidLlmMode, serverConfig } from "@/lib/server-config";

type DatabaseSchema = {
  users: Record<string, DashboardSnapshot>;
  llmModes: Record<string, LlmMode>;
};

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "lifeos-db.json");

function initialSnapshot(): DashboardSnapshot {
  return {
    assistantText: assistantDefaultText,
    stats: statsSeed,
    approvals: approvalSeed,
    automations: automationSeed,
    timeline: timelineSeed,
    updatedAt: new Date().toISOString(),
  };
}

function defaultSchema(): DatabaseSchema {
  return { users: {}, llmModes: {} };
}

async function ensureDbFile() {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf-8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify(defaultSchema(), null, 2), "utf-8");
  }
}

async function readSchema(): Promise<DatabaseSchema> {
  await ensureDbFile();
  const raw = await readFile(DB_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema & DashboardSnapshot>;

    if (parsed.users && typeof parsed.users === "object") {
      const rawModes = parsed.llmModes;
      const llmModes =
        rawModes && typeof rawModes === "object"
          ? Object.fromEntries(
              Object.entries(rawModes).filter((entry): entry is [string, LlmMode] =>
                isValidLlmMode(entry[1])
              )
            )
          : {};

      return { users: parsed.users, llmModes };
    }

    // Legacy migration path from single snapshot structure.
    if (parsed.assistantText && parsed.stats && parsed.approvals) {
      return {
        users: { legacy_user: parsed as unknown as DashboardSnapshot },
        llmModes: {},
      };
    }

    return defaultSchema();
  } catch {
    return defaultSchema();
  }
}

async function writeSchema(schema: DatabaseSchema): Promise<void> {
  await ensureDbFile();
  await writeFile(DB_FILE, JSON.stringify(schema, null, 2), "utf-8");
}

export async function readSnapshot(userId: string): Promise<DashboardSnapshot> {
  const schema = await readSchema();
  const existing = schema.users[userId];

  if (existing) {
    return {
      ...initialSnapshot(),
      ...existing,
      updatedAt: existing.updatedAt ?? new Date().toISOString(),
    };
  }

  const next = initialSnapshot();
  schema.users[userId] = next;
  await writeSchema(schema);
  return next;
}

export async function writeSnapshot(userId: string, snapshot: DashboardSnapshot): Promise<void> {
  const schema = await readSchema();
  schema.users[userId] = snapshot;
  await writeSchema(schema);
}

export async function resetSnapshot(userId: string): Promise<DashboardSnapshot> {
  const schema = await readSchema();
  const next = initialSnapshot();
  schema.users[userId] = next;
  await writeSchema(schema);
  return next;
}

export async function readUserLlmMode(userId: string): Promise<LlmMode> {
  const schema = await readSchema();
  return schema.llmModes[userId] ?? serverConfig.llmMode;
}

export async function writeUserLlmMode(userId: string, mode: LlmMode): Promise<void> {
  const schema = await readSchema();
  schema.llmModes[userId] = mode;
  await writeSchema(schema);
}
