import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type Entry = {
  userId: string;
  operation: string;
  key: string;
  status: number;
  response: unknown;
  createdAt: string;
};

type Schema = {
  entries: Entry[];
};

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "idempotency-db.json");

async function ensure() {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf-8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify({ entries: [] }, null, 2), "utf-8");
  }
}

async function readSchema(): Promise<Schema> {
  await ensure();
  const raw = await readFile(DB_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as Schema;
    return { entries: Array.isArray(parsed.entries) ? parsed.entries : [] };
  } catch {
    return { entries: [] };
  }
}

async function writeSchema(schema: Schema): Promise<void> {
  await ensure();
  await writeFile(DB_FILE, JSON.stringify(schema, null, 2), "utf-8");
}

export async function getIdempotentEntry(userId: string, operation: string, key: string) {
  const schema = await readSchema();
  return (
    schema.entries.find(
      (entry) =>
        entry.userId === userId && entry.operation === operation && entry.key === key
    ) ?? null
  );
}

export async function saveIdempotentEntry(
  userId: string,
  operation: string,
  key: string,
  status: number,
  response: unknown
) {
  const schema = await readSchema();
  const entries = schema.entries.filter(
    (entry) =>
      !(entry.userId === userId && entry.operation === operation && entry.key === key)
  );

  entries.push({
    userId,
    operation,
    key,
    status,
    response,
    createdAt: new Date().toISOString(),
  });

  const limit = 2000;
  const trimmed = entries.slice(Math.max(entries.length - limit, 0));
  await writeSchema({ entries: trimmed });
}
