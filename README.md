# LifeOS Demo Repo

This repo includes:
- Web app (Next.js): `/Users/pro_coder/Documents/New project`
- Mobile app (Expo): `/Users/pro_coder/Documents/New project/apps/mobile`
- LLM orchestration with provider modes: `mock`, `openai`, `ollama`, `llamacpp`
- Persisted auth users with hashed passwords in `.data/lifeos-users.json`

## Quick Start

1. Install dependencies:
```bash
cd "/Users/pro_coder/Documents/New project"
npm install
cd "/Users/pro_coder/Documents/New project/apps/mobile"
npm install
```

2. Create env file:
```bash
cd "/Users/pro_coder/Documents/New project"
cp .env.example .env
```
`LIFEOS_STRICT_INTEGRATIONS=true` means upstream failures are surfaced as real errors (not fallback demo data).

3. Start free local LLM (`llama.cpp`):
```bash
cd "/Users/pro_coder/Documents/New project"
npm run llm:local
```

4. In another terminal, start web:
```bash
cd "/Users/pro_coder/Documents/New project"
npm run dev
```

5. In another terminal, start mobile:
```bash
cd "/Users/pro_coder/Documents/New project/apps/mobile"
EXPO_PUBLIC_API_BASE_URL="http://localhost:3000" npm run start
```

## Verification

- Full stack verification:
```bash
cd "/Users/pro_coder/Documents/New project"
npm run verify:all
```

- Local LLM end-to-end verification:
```bash
cd "/Users/pro_coder/Documents/New project"
npm run verify:llm
```

Expected success output includes:
- `provider: llamacpp`
- `model: qwen2.5-0.5b-instruct-q4_k_m.gguf`

## Health Endpoints

- Liveness: `GET /api/healthz`
- Readiness: `GET /api/readyz`
- LLM status (auth): `GET /api/lifeos/llm/status`
- LLM mode switch (auth): `POST /api/lifeos/llm/mode` with `{ "mode": "mock|openai|ollama|llamacpp" }`
- Auth register: `POST /api/auth/register` with `{ "name": "...", "email": "...", "password": "..." }`

`/api/readyz` now validates:
- DB snapshot read
- Active LLM provider connectivity (based on `LIFEOS_LLM_MODE`)

## LLM Control UI

The dashboard includes an `AI Engine` panel for non-technical users:
- shows current provider, model, and readiness
- allows one-click switching between provider modes
- refreshes provider health automatically
- stores the selected mode per user in `.data/lifeos-db.json` so it survives restarts

## Strict Live Mode

This repo now defaults to strict integration behavior:
- Web client no longer fabricates successful action/approval/automation responses when API calls fail.
- `/api/lifeos/live` returns upstream failure (`502`) when live data providers are unavailable and strict mode is enabled.
