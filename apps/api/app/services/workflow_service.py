"""Business logic for workflow runs and steps."""

from __future__ import annotations

from sqlalchemy.orm import Session

from app.models.workflow_run import WorkflowRun
from app.models.workflow_step import WorkflowStep
from app.schemas.workflow_run import WorkflowRunCreate, WorkflowRunUpdate
from app.schemas.workflow_step import WorkflowStepCreate, WorkflowStepUpdate


class WorkflowService:
    """Encapsulates all workflow-related business logic."""

    def __init__(self, db: Session) -> None:
        self.db = db

    # ── Runs ────────────────────────────────────────

    def list_runs(self, *, skip: int = 0, limit: int = 50) -> list[WorkflowRun]:
        """Return paginated list of workflow runs (newest first)."""
        return (
            self.db.query(WorkflowRun)
            .order_by(WorkflowRun.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    def get_run(self, run_id: int) -> WorkflowRun | None:
        """Fetch a single workflow run by ID."""
        return self.db.query(WorkflowRun).filter(WorkflowRun.id == run_id).first()

    def create_run(self, payload: WorkflowRunCreate) -> WorkflowRun:
        """Create and persist a new workflow run."""
        run = WorkflowRun(**payload.model_dump())
        self.db.add(run)
        self.db.commit()
        self.db.refresh(run)
        return run

    def update_run(self, run_id: int, payload: WorkflowRunUpdate) -> WorkflowRun | None:
        """Update fields on an existing run."""
        run = self.get_run(run_id)
        if not run:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(run, field, value)
        self.db.commit()
        self.db.refresh(run)
        return run

    def delete_run(self, run_id: int) -> bool:
        """Delete a run and all its steps."""
        run = self.get_run(run_id)
        if not run:
            return False
        # Delete associated steps first
        self.db.query(WorkflowStep).filter(WorkflowStep.run_id == run_id).delete()
        self.db.delete(run)
        self.db.commit()
        return True

    # ── Steps ───────────────────────────────────────

    def list_steps(self, run_id: int) -> list[WorkflowStep]:
        """Return all steps for a given workflow run."""
        return (
            self.db.query(WorkflowStep)
            .filter(WorkflowStep.run_id == run_id)
            .order_by(WorkflowStep.id)
            .all()
        )

    def get_step(self, run_id: int, step_id: int) -> WorkflowStep | None:
        """Fetch a single step within a run."""
        return (
            self.db.query(WorkflowStep)
            .filter(WorkflowStep.run_id == run_id, WorkflowStep.id == step_id)
            .first()
        )

    def create_step(self, run_id: int, payload: WorkflowStepCreate) -> WorkflowStep:
        """Create a new step for a workflow run."""
        step = WorkflowStep(run_id=run_id, **payload.model_dump())
        self.db.add(step)
        self.db.commit()
        self.db.refresh(step)
        return step

    def update_step(
        self, run_id: int, step_id: int, payload: WorkflowStepUpdate
    ) -> WorkflowStep | None:
        """Update fields on an existing step."""
        step = self.get_step(run_id, step_id)
        if not step:
            return None
        for field, value in payload.model_dump(exclude_unset=True).items():
            setattr(step, field, value)
        self.db.commit()
        self.db.refresh(step)
        return step
