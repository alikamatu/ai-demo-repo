import { NextResponse } from "next/server";
import type { ApiError, LoginRequest, LoginResponse } from "@/lib/lifeos-contracts";
import { createToken } from "@/lib/auth";
import { authenticateUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<LoginRequest>;

    if (!body.email || !body.password) {
      return NextResponse.json<ApiError>({ error: "Email and password are required" }, { status: 400 });
    }

    const user = authenticateUser(body.email, body.password);
    if (!user) {
      return NextResponse.json<ApiError>({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = createToken(user);
    return NextResponse.json<LoginResponse>({ token, user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json<ApiError>({ error: message }, { status: 500 });
  }
}
