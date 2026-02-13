.PHONY: help setup setup-api setup-mobile api mobile test lint clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

# ── Setup ───────────────────────────────────────────

setup: setup-api setup-mobile ## Install all dependencies

setup-api: ## Install API dependencies
	cd apps/api && python -m venv .venv && . .venv/bin/activate && pip install -e ".[dev]"

setup-mobile: ## Install mobile dependencies
	cd apps/mobile && npm install --legacy-peer-deps

# ── Dev servers ─────────────────────────────────────

api: ## Start FastAPI dev server
	cd apps/api && . .venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 --port 8000

mobile: ## Start Expo dev server
	cd apps/mobile && npx expo start

# ── Quality ─────────────────────────────────────────

test: ## Run all tests
	cd apps/api && . .venv/bin/activate && python -m pytest tests/ -v

lint: ## Lint all code
	cd apps/api && . .venv/bin/activate && ruff check .
	cd apps/mobile && npx tsc --noEmit

# ── Cleanup ─────────────────────────────────────────

clean: ## Remove generated files
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
	find . -name "*.pyc" -delete 2>/dev/null || true
