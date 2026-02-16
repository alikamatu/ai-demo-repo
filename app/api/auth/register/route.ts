import { NextResponse } from "next/server";
import type { ApiError, LoginResponse, RegisterRequest } from "@/lib/lifeos-contracts";
import { createToken } from "@/lib/auth";
import { createUser } from "@/lib/users";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<RegisterRequest>;
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json<ApiError>(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    const result = createUser({
      name: body.name,
      email: body.email,
      password: body.password,
    });

    if (!result.ok) {
      const status = result.error === "Email already exists" ? 409 : 400;
      return NextResponse.json<ApiError>({ error: result.error }, { status });
    }

    const token = createToken(result.user);
    return NextResponse.json<LoginResponse>({ token, user: result.user });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json<ApiError>({ error: message }, { status: 500 });
  }
}
