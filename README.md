# Life OS

An AI-powered workflow orchestration platform — plan, approve, and execute multi-step workflows with LLM intelligence.

## Architecture

```
ai-demo-repo/
├── apps/
│   ├── api/          # FastAPI backend (Python 3.12+)
│   ├── mobile/       # Expo / React Native mobile app
│   └── worker/       # Background job processor (RQ)
└── packages/
    ├── llm-router/   # LLM provider abstraction (Python)
    └── shared-types/ # TypeScript type contracts
```

## Quick Start

### Prerequisites

- Python 3.12+
- Node.js 20+
- npm 10+

### 1. Setup

```bash
# Clone & install everything
make setup

# Or manually:
cd apps/api   && python -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"
cd apps/mobile && npm install
```

### 2. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
cp apps/mobile/.env.example apps/mobile/.env
```

### 3. Run

```bash
# Terminal 1 — API
make api

# Terminal 2 — Mobile
make mobile
```

- **API docs**: http://localhost:8000/docs
- **Health check**: http://localhost:8000/health

## Development

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `make setup`     | Install all dependencies       |
| `make api`       | Start FastAPI dev server       |
| `make mobile`    | Start Expo dev server          |
| `make test`      | Run all tests                  |
| `make lint`      | Lint Python + TypeScript       |
| `make clean`     | Remove generated files         |

## Project Structure

### API (`apps/api`)

Layered FastAPI application:

- **`app/core/`** — Configuration, database, dependency injection
- **`app/models/`** — SQLAlchemy ORM models
- **`app/schemas/`** — Pydantic request/response schemas
- **`app/routers/`** — HTTP route handlers
- **`app/services/`** — Business logic layer
- **`tests/`** — pytest test suite

### Mobile (`apps/mobile`)

Expo / React Native app with:

- **`src/api/`** — Axios client + React Query hooks
- **`src/screens/`** — App screens
- **`src/navigation/`** — React Navigation stack
- **`src/components/`** — Reusable UI components
- **`src/store/`** — Zustand state management
- **`src/theme/`** — Design tokens

## Contributing

1. Create a feature branch from `main`
2. Follow existing code patterns and naming conventions
3. Add tests for new features
4. Run `make lint && make test` before pushing
5. Open a pull request with a clear description
