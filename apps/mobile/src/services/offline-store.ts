import AsyncStorage from "@react-native-async-storage/async-storage";
import type { DashboardSnapshot, LivePulse, QueuedMutation } from "@/src/types/lifeos";

function queueKey(userId: string) {
  return `lifeos.mobile.queue.${userId}`;
}

function dashboardKey(userId: string) {
  return `lifeos.mobile.dashboard.${userId}`;
}

function pulseKey(userId: string) {
  return `lifeos.mobile.pulse.${userId}`;
}

async function readJSON<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeJSON<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

export async function readQueue(userId: string): Promise<QueuedMutation[]> {
  return (await readJSON<QueuedMutation[]>(queueKey(userId))) ?? [];
}

export async function writeQueue(userId: string, queue: QueuedMutation[]): Promise<void> {
  await writeJSON(queueKey(userId), queue);
}

export async function enqueue(userId: string, mutation: QueuedMutation): Promise<void> {
  const queue = await readQueue(userId);
  queue.push(mutation);
  await writeQueue(userId, queue);
}

export async function saveDashboardCache(userId: string, dashboard: DashboardSnapshot): Promise<void> {
  await writeJSON(dashboardKey(userId), dashboard);
}

export async function readDashboardCache(userId: string): Promise<DashboardSnapshot | null> {
  return readJSON<DashboardSnapshot>(dashboardKey(userId));
}

export async function savePulseCache(userId: string, pulse: LivePulse): Promise<void> {
  await writeJSON(pulseKey(userId), pulse);
}

export async function readPulseCache(userId: string): Promise<LivePulse | null> {
  return readJSON<LivePulse>(pulseKey(userId));
}
