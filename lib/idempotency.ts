import { NextResponse } from "next/server";
import { getIdempotentEntry, saveIdempotentEntry } from "@/lib/idempotency-db";

export async function runIdempotent<T>(
  request: Request,
  userId: string,
  operation: string,
  handler: () => Promise<T>
) {
  const key = request.headers.get("Idempotency-Key")?.trim();

  if (!key) {
    const response = await handler();
    return NextResponse.json(response);
  }

  const found = await getIdempotentEntry(userId, operation, key);
  if (found) {
    return NextResponse.json(found.response, { status: found.status });
  }

  const response = await handler();
  await saveIdempotentEntry(userId, operation, key, 200, response);
  return NextResponse.json(response);
}
