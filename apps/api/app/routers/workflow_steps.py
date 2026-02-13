"""Workflow Steps — CRUD endpoints scoped under a run."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.workflow_step import (
    WorkflowStepCreate,
    WorkflowStepResponse,
    WorkflowStepUpdate,
)
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.get("/", response_model=list[WorkflowStepResponse])
def list_steps(
    run_id: int,
    db: Session = Depends(get_db),
):
    """List all steps for a workflow run."""
    service = WorkflowService(db)
    # Verify run exists
    if not service.get_run(run_id):
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return service.list_steps(run_id)


@router.post("/", response_model=WorkflowStepResponse, status_code=status.HTTP_201_CREATED)
def create_step(
    run_id: int,
    payload: WorkflowStepCreate,
    db: Session = Depends(get_db),
):
    """Create a new step within a workflow run."""
    service = WorkflowService(db)
    if not service.get_run(run_id):
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return service.create_step(run_id, payload)


@router.get("/{step_id}", response_model=WorkflowStepResponse)
def get_step(
    run_id: int,
    step_id: int,
    db: Session = Depends(get_db),
):
    """Get a single step by ID."""
    service = WorkflowService(db)
    step = service.get_step(run_id, step_id)
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")
    return step


@router.patch("/{step_id}", response_model=WorkflowStepResponse)
def update_step(
    run_id: int,
    step_id: int,
    payload: WorkflowStepUpdate,
    db: Session = Depends(get_db),
):
    """Update a workflow step."""
    service = WorkflowService(db)
    step = service.update_step(run_id, step_id, payload)
    if not step:
        raise HTTPException(status_code=404, detail="Workflow step not found")
    return step
