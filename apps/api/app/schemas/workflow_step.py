"""Pydantic schemas for WorkflowStep."""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict

from app.models.workflow_step import StepState


class WorkflowStepCreate(BaseModel):
    """Schema for creating a new workflow step."""

    name: str
    depends_on: list[str] = []
    tool: str | None = None


class WorkflowStepUpdate(BaseModel):
    """Schema for updating a workflow step."""

    name: str | None = None
    state: StepState | None = None
    depends_on: list[str] | None = None
    tool: str | None = None
    result_ref: str | None = None


class WorkflowStepResponse(BaseModel):
    """Schema for workflow step API responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    run_id: int
    name: str
    depends_on: list[str]
    state: StepState
    attempt: int
    tool: str | None
    result_ref: str | None
