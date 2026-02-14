"""Workflow orchestration endpoints."""

import json
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session

from db import SessionLocal
from models.workflows import WorkflowRun
from models.timeline_event import TimelineEvent, EventType
from services.orchestrator import Orchestrator
from services.scheduler import Scheduler

router = APIRouter(prefix="/api/workflows", tags=["workflows"])


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/submit")
async def submit_workflow(
    user_id: int,
    intent: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> dict:
    """
    Submit a new workflow.

    This endpoint:
    1. Creates a workflow run
    2. Generates execution plan
    3. Starts scheduler in background
    """
    # Create workflow using orchestrator
    orchestrator = Orchestrator(db)
    run = orchestrator.create_workflow(user_id, intent)

    # Record workflow started event
    event = TimelineEvent(
        run_id=run.id,
        event_type=EventType.WORKFLOW_STARTED,
        message=f"Workflow started: {intent}",
    )
    db.add(event)
    db.commit()

    # Start scheduler in background
    background_tasks.add_task(run_scheduler_loop, run.id)

    return {
        "workflow_id": run.id,
        "status": "submitted",
        "intent": intent,
    }


def run_scheduler_loop(run_id: int):
    """
    Background task: continuously schedule workflow steps.

    This loop:
    1. Finds ready steps
    2. Checks risk levels
    3. Creates approvals if needed
    4. Enqueues ready steps for execution
    """
    db = SessionLocal()
    scheduler = Scheduler(db)

    try:
        max_iterations = 100  # Prevent infinite loops
        iteration = 0

        while iteration < max_iterations:
            iteration += 1

            # Get workflow run
            run = db.query(WorkflowRun).filter(
                WorkflowRun.id == run_id).first()
            if not run:
                break

            # Check if workflow is finished
            from models.workflows import RunState

            if run.state in [RunState.COMPLETED, RunState.FAILED, RunState.CANCELED]:
                break

            # Run one scheduling round
            result = scheduler.schedule_round(run_id)

            ready_steps = result["ready_steps"]
            blocked_steps = result["blocked_steps"]

            # Dispatch ready steps for async execution
            for step in ready_steps:
                record_event(
                    db,
                    run_id,
                    step.id,
                    EventType.STEP_READY,
                    f"Step ready: {step.name}",
                )

                # Enqueue to async executor (Redis/RQ)
                # For now, execute synchronously as demo
                from services.executor import Executor

                executor = Executor(db)
                result = executor.execute_step(step.id)

                if result["success"]:
                    record_event(
                        db,
                        run_id,
                        step.id,
                        EventType.STEP_SUCCEEDED,
                        f"Step succeeded: {step.name}",
                        {"result": result["result"]},
                    )
                else:
                    record_event(
                        db,
                        run_id,
                        step.id,
                        EventType.STEP_FAILED,
                        f"Step failed: {step.name} - {result['error']}",
                    )

            # Record blocked steps
            for step in blocked_steps:
                approval = (
                    db.query(TimelineEvent)
                    .filter(
                        TimelineEvent.run_id == run_id,
                        TimelineEvent.step_id == step.id,
                    )
                    .first()
                )

                record_event(
                    db,
                    run_id,
                    step.id,
                    EventType.STEP_BLOCKED,
                    f"Step blocked pending approval: {step.name}",
                )
                record_event(
                    db,
                    run_id,
                    step.id,
                    EventType.APPROVAL_REQUIRED,
                    f"Approval required: {step.name}",
                )

            # Check if workflow is now complete
            scheduler.update_run_state(run_id)

            # Small delay before next iteration
            import time

            time.sleep(0.1)

    finally:
        db.close()


def record_event(
    db: Session,
    run_id: int,
    step_id: Optional[int],
    event_type: EventType,
    message: str,
    metadata: Optional[dict] = None,
):
    """Helper to record timeline event."""
    event = TimelineEvent(
        run_id=run_id,
        step_id=step_id,
        event_type=event_type,
        message=message,
        metadata=json.dumps(metadata) if metadata else None,
    )
    db.add(event)
    db.commit()
