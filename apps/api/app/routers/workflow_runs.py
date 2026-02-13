"""Workflow Runs — CRUD endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.workflow_run import (
    WorkflowRunCreate,
    WorkflowRunResponse,
    WorkflowRunUpdate,
)
from app.services.workflow_service import WorkflowService

router = APIRouter()


@router.get("/", response_model=list[WorkflowRunResponse])
def list_runs(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List all workflow runs with pagination."""
    service = WorkflowService(db)
    return service.list_runs(skip=skip, limit=limit)


@router.post("/", response_model=WorkflowRunResponse, status_code=status.HTTP_201_CREATED)
def create_run(
    payload: WorkflowRunCreate,
    db: Session = Depends(get_db),
):
    """Create a new workflow run."""
    service = WorkflowService(db)
    return service.create_run(payload)


@router.get("/{run_id}", response_model=WorkflowRunResponse)
def get_run(
    run_id: int,
    db: Session = Depends(get_db),
):
    """Get a single workflow run by ID."""
    service = WorkflowService(db)
    run = service.get_run(run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run


@router.patch("/{run_id}", response_model=WorkflowRunResponse)
def update_run(
    run_id: int,
    payload: WorkflowRunUpdate,
    db: Session = Depends(get_db),
):
    """Update a workflow run."""
    service = WorkflowService(db)
    run = service.update_run(run_id, payload)
    if not run:
        raise HTTPException(status_code=404, detail="Workflow run not found")
    return run


@router.delete("/{run_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_run(
    run_id: int,
    db: Session = Depends(get_db),
):
    """Delete a workflow run and its steps."""
    service = WorkflowService(db)
    deleted = service.delete_run(run_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Workflow run not found")
