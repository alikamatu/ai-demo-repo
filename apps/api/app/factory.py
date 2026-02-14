"""FastAPI application factory."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import engine, Base
from app.routers import health, workflow_runs, workflow_steps, orchestration, streams, approvals


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create database tables on startup."""
    Base.metadata.create_all(bind=engine)
    yield


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.APP_VERSION,
        description="AI-powered workflow orchestration API",
        lifespan=lifespan,
    )

    # ── CORS ────────────────────────────────────────
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Routers ─────────────────────────────────────
    app.include_router(health.router, tags=["Health"])
    app.include_router(
        workflow_runs.router,
        prefix="/api/runs",
        tags=["Workflow Runs"],
    )
    app.include_router(
        workflow_steps.router,
        prefix="/api/runs/{run_id}/steps",
        tags=["Workflow Steps"],
    )
    app.include_router(orchestration.router, tags=["Orchestration"])
    app.include_router(streams.router, tags=["Streams"])
    app.include_router(approvals.router, tags=["Approvals"])

    return app
