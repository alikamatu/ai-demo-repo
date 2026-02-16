import { createHmac, timingSafeEqual } from "node:crypto";
import type { AuthUser } from "@/lib/lifeos-contracts";
import { findUserById } from "@/lib/users";

type TokenPayload = {
  sub: string;
  email: string;
  name: string;
  exp: number;
};

const SECRET = process.env.LIFEOS_AUTH_SECRET ?? "lifeos-dev-secret";

function toBase64Url(value: string): string {
  return Buffer.from(value, "utf-8").toString("base64url");
}

function fromBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf-8");
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", SECRET).update(encodedPayload).digest("base64url");
}

export function createToken(user: AuthUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };

  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyToken(token: string): AuthUser | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expected = sign(encodedPayload);
  if (signature.length !== expected.length) return null;

  const isValid = timingSafeEqual(
    Buffer.from(signature, "utf-8"),
    Buffer.from(expected, "utf-8")
  );

  if (!isValid) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as TokenPayload;

    if (typeof payload.exp !== "number" || payload.exp < Date.now()) {
      return null;
    }

    return findUserById(payload.sub);
  } catch {
    return null;
  }
}

function extractToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (header?.startsWith("Bearer ")) {
    return header.slice(7);
  }

  try {
    const url = new URL(request.url);
    const queryToken = url.searchParams.get("token");
    if (queryToken) return queryToken;
  } catch {
    // Ignore bad URL parsing.
  }

  return null;
}

export function requireUser(request: Request): AuthUser {
  const token = extractToken(request);
  if (!token) {
    throw new Error("Unauthorized");
  }

  const user = verifyToken(token);
  if (!user) {
    throw new Error("Unauthorized");
  }

  return user;
}
