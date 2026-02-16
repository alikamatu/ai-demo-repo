import { NextResponse } from "next/server";
import type { ApiError, LlmModeUpdateRequest, LlmStatusResponse } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { writeUserLlmMode } from "@/lib/lifeos-db";
import { checkLlmHealth } from "@/lib/llm/provider-health";
import { getLlmModeOptions, isValidLlmMode, serverConfig } from "@/lib/server-config";
import type { LlmMode } from "@/lib/server-config";

export const runtime = "nodejs";

function resolveActiveModel(mode: LlmMode) {
  switch (mode) {
    case "openai":
      return serverConfig.openAiModel;
    case "ollama":
      return serverConfig.ollamaModel;
    case "llamacpp":
      return serverConfig.llamaCppModel;
    default:
      return "rule-based-v1";
  }
}

export async function POST(request: Request) {
  try {
    const user = requireUser(request);
    const body = (await request.json()) as Partial<LlmModeUpdateRequest>;

    if (!body.mode || !isValidLlmMode(body.mode)) {
      return NextResponse.json<ApiError>({ error: "Invalid llm mode" }, { status: 400 });
    }

    await writeUserLlmMode(user.id, body.mode);
    const health = await checkLlmHealth(body.mode);
    return NextResponse.json<LlmStatusResponse>({
      mode: body.mode,
      options: getLlmModeOptions(),
      ready: health.ready,
      reason: health.reason,
      model: resolveActiveModel(body.mode),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
