import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

type PushDevice = {
  userId: string;
  deviceId: string;
  platform: "ios" | "android" | "web";
  token: string;
  updatedAt: string;
};

type PushSchema = {
  devices: PushDevice[];
};

const DB_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DB_DIR, "push-db.json");

async function ensureDbFile() {
  await mkdir(DB_DIR, { recursive: true });

  try {
    await readFile(DB_FILE, "utf-8");
  } catch {
    await writeFile(DB_FILE, JSON.stringify({ devices: [] }, null, 2), "utf-8");
  }
}

async function readSchema(): Promise<PushSchema> {
  await ensureDbFile();
  const raw = await readFile(DB_FILE, "utf-8");

  try {
    const parsed = JSON.parse(raw) as PushSchema;
    return {
      devices: Array.isArray(parsed.devices) ? parsed.devices : [],
    };
  } catch {
    return { devices: [] };
  }
}

async function writeSchema(schema: PushSchema): Promise<void> {
  await ensureDbFile();
  await writeFile(DB_FILE, JSON.stringify(schema, null, 2), "utf-8");
}

export async function upsertPushDevice(device: PushDevice): Promise<void> {
  const schema = await readSchema();
  const nextDevices = schema.devices.filter(
    (item) => !(item.userId === device.userId && item.deviceId === device.deviceId)
  );
  nextDevices.push(device);

  await writeSchema({ devices: nextDevices });
}

export async function listUserPushTokens(userId: string): Promise<string[]> {
  const schema = await readSchema();
  return schema.devices
    .filter((item) => item.userId === userId)
    .map((item) => item.token);
}
