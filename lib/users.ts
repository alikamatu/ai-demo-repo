import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { AuthUser } from "@/lib/lifeos-contracts";

type StoredUser = {
  id: string;
  email: string;
  name: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};

type UsersSchema = {
  users: StoredUser[];
};

const DB_DIR = path.join(process.cwd(), ".data");
const USERS_FILE = path.join(DB_DIR, "lifeos-users.json");

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function createStoredUser(input: { id: string; email: string; name: string; password: string }): StoredUser {
  const salt = randomBytes(16).toString("hex");
  return {
    id: input.id,
    email: normalizeEmail(input.email),
    name: input.name.trim(),
    passwordSalt: salt,
    passwordHash: hashPassword(input.password, salt),
    createdAt: new Date().toISOString(),
  };
}

function toAuthUser(user: StoredUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
  };
}

function defaultUsers(): StoredUser[] {
  return [
    createStoredUser({
      id: "user_alex",
      email: "alex@lifeos.dev",
      name: "Alex Carter",
      password: "demo1234",
    }),
    createStoredUser({
      id: "user_career",
      email: "career@lifeos.dev",
      name: "Maya Brooks",
      password: "demo1234",
    }),
    createStoredUser({
      id: "user_family",
      email: "family@lifeos.dev",
      name: "Jordan Lee",
      password: "demo1234",
    }),
  ];
}

function ensureUsersFile(): void {
  mkdirSync(DB_DIR, { recursive: true });

  try {
    readFileSync(USERS_FILE, "utf-8");
  } catch {
    const seeded: UsersSchema = { users: defaultUsers() };
    writeFileSync(USERS_FILE, JSON.stringify(seeded, null, 2), "utf-8");
  }
}

function readUsersSchema(): UsersSchema {
  ensureUsersFile();

  try {
    const raw = readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<UsersSchema>;
    if (Array.isArray(parsed.users)) {
      return { users: parsed.users };
    }
    return { users: defaultUsers() };
  } catch {
    return { users: defaultUsers() };
  }
}

function writeUsersSchema(schema: UsersSchema): void {
  ensureUsersFile();
  writeFileSync(USERS_FILE, JSON.stringify(schema, null, 2), "utf-8");
}

export function listDemoUsers(): AuthUser[] {
  const schema = readUsersSchema();
  return schema.users.slice(0, 3).map(toAuthUser);
}

export function authenticateUser(email: string, password: string): AuthUser | null {
  const schema = readUsersSchema();
  const normalized = normalizeEmail(email);
  const found = schema.users.find((user) => normalizeEmail(user.email) === normalized);
  if (!found) return null;

  const computed = hashPassword(password, found.passwordSalt);
  const valid =
    computed.length === found.passwordHash.length &&
    timingSafeEqual(Buffer.from(computed, "utf-8"), Buffer.from(found.passwordHash, "utf-8"));

  if (!valid) return null;
  return toAuthUser(found);
}

export function findUserById(id: string): AuthUser | null {
  const schema = readUsersSchema();
  const found = schema.users.find((user) => user.id === id);
  return found ? toAuthUser(found) : null;
}

export function createUser(input: {
  email: string;
  name: string;
  password: string;
}): { ok: true; user: AuthUser } | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const password = input.password;

  if (!email || !name || !password) {
    return { ok: false, error: "Name, email, and password are required" };
  }

  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const schema = readUsersSchema();
  const exists = schema.users.some((user) => normalizeEmail(user.email) === email);
  if (exists) {
    return { ok: false, error: "Email already exists" };
  }

  const id = `user_${randomBytes(6).toString("hex")}`;
  const stored = createStoredUser({
    id,
    email,
    name,
    password,
  });

  schema.users.push(stored);
  writeUsersSchema(schema);
  return { ok: true, user: toAuthUser(stored) };
}
