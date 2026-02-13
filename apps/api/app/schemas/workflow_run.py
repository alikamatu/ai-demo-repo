"""Pydantic schemas for WorkflowRun."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.workflow_run import RunState


class WorkflowRunCreate(BaseModel):
    """Schema for creating a new workflow run."""

    user_id: int
    intent: str
    risk_level: str | None = None


class WorkflowRunUpdate(BaseModel):
    """Schema for updating a workflow run."""

    intent: str | None = None
    state: RunState | None = None
    risk_level: str | None = None


class WorkflowRunResponse(BaseModel):
    """Schema for workflow run API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    intent: str
    state: RunState
    risk_level: str | None
    created_at: datetime
    updated_at: datetime
