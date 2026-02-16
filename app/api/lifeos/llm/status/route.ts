import { NextResponse } from "next/server";
import type { ApiError, LlmStatusResponse } from "@/lib/lifeos-contracts";
import { requireUser } from "@/lib/auth";
import { readUserLlmMode } from "@/lib/lifeos-db";
import { checkLlmHealth } from "@/lib/llm/provider-health";
import { getLlmModeOptions, serverConfig } from "@/lib/server-config";
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

export async function GET(request: Request) {
  try {
    const user = requireUser(request);
    const mode = await readUserLlmMode(user.id);

    const health = await checkLlmHealth(mode);
    return NextResponse.json<LlmStatusResponse>({
      mode,
      options: getLlmModeOptions(),
      ready: health.ready,
      reason: health.reason,
      model: resolveActiveModel(mode),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message === "Unauthorized" ? 401 : 500;
    return NextResponse.json<ApiError>({ error: message }, { status });
  }
}
