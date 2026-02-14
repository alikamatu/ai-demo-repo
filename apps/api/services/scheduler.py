"""Scheduler — DAG resolution and step readiness determination."""

from datetime import datetime, timezone
from typing import Optional, List

from db import SessionLocal
from models.workflows import WorkflowRun, WorkflowStep, RunState, StepState
from models.approvals import Approval, ApprovalStatus


class Scheduler:
    """Manages workflow scheduling and DAG execution."""

    def __init__(self, db=None):
        self.db = db or SessionLocal()

    def get_ready_steps(self, run_id: int) -> List[WorkflowStep]:
        """
        Find all steps that are ready to execute.

        A step is ready if:
        - state == pending
        - all dependencies are succeeded
        """
        run = self.db.query(WorkflowRun).filter(
            WorkflowRun.id == run_id).first()
        if not run:
            return []

        pending_steps = (
            self.db.query(WorkflowStep)
            .filter(WorkflowStep.run_id == run_id, WorkflowStep.state == StepState.PENDING)
            .all()
        )

        ready = []
        for step in pending_steps:
            if not step.depends_on:
                # No dependencies - ready immediately
                ready.append(step)
                continue

            # Check if all dependencies are succeeded
            dependency_steps = (
                self.db.query(WorkflowStep)
                .filter(WorkflowStep.id.in_(step.depends_on))
                .all()
            )

            all_deps_succeeded = all(
                dep.state == StepState.SUCCEEDED for dep in dependency_steps
            )

            if all_deps_succeeded:
                ready.append(step)

        return ready

    # Returns step state
    def process_step(self, step_id: int) -> Optional[str]:
        """
        Process a single step:
        - Check risk level
        - Create approval if needed
        - Transition to ready or blocked

        Returns the new state (ready, blocked).
        """
        step = self.db.query(WorkflowStep).filter(
            WorkflowStep.id == step_id).first()
        if not step:
            return None

        # Determine if approval is needed based on risk level
        needs_approval = step.risk_level in ["L2", "L3"]

        if needs_approval:
            # Create approval record
            approval = Approval(
                run_id=step.run_id,
                step_id=step.id,
                reason=f"High-risk operation: {step.name} (risk level: {step.risk_level})",
                status=ApprovalStatus.REQUIRED,
            )
            self.db.add(approval)

            # Mark step as blocked
            step.state = StepState.BLOCKED
            self.db.commit()

            return "blocked"
        else:
            # Mark as ready for execution
            step.state = StepState.READY
            self.db.commit()

            return "ready"

    def schedule_round(self, run_id: int) -> dict:
        """
        Execute one scheduling round:
        - Find ready steps
        - Determine which can execute
        - Return list of steps to enqueue

        Returns dict with:
        - ready_steps: list of WorkflowStep
        - blocked_steps: list of WorkflowStep
        """
        run = self.db.query(WorkflowRun).filter(
            WorkflowRun.id == run_id).first()
        if not run:
            return {"ready_steps": [], "blocked_steps": []}

        # Get all pending steps whose dependencies are satisfied
        ready_candidates = self.get_ready_steps(run_id)

        ready_to_dispatch = []
        blocked = []

        for step in ready_candidates:
            result = self.process_step(step.id)
            self.db.refresh(step)  # Reload to get new state

            if result == "ready":
                ready_to_dispatch.append(step)
            elif result == "blocked":
                blocked.append(step)

        # Update run state based on schedule result
        self.update_run_state(run_id)

        return {"ready_steps": ready_to_dispatch, "blocked_steps": blocked}

    def update_run_state(self, run_id: int) -> None:
        """Update workflow run state based on step states."""
        run = self.db.query(WorkflowRun).filter(
            WorkflowRun.id == run_id).first()
        if not run:
            return

        steps = self.db.query(WorkflowStep).filter(
            WorkflowStep.run_id == run_id).all()

        if not steps:
            run.state = RunState.COMPLETED
            self.db.commit()
            return

        # Count step states
        state_counts = {}
        for step in steps:
            state_counts[step.state] = state_counts.get(step.state, 0) + 1

        # Determine run state
        if state_counts.get(StepState.BLOCKED, 0) > 0:
            run.state = RunState.WAITING_APPROVAL
        elif state_counts.get(StepState.RUNNING, 0) > 0:
            run.state = RunState.EXECUTING
        elif state_counts.get(StepState.FAILED, 0) > 0:
            # If any step failed and we can't recover, mark failed
            # (In a real system, would check if workflow is still viable)
            if state_counts.get(StepState.PENDING, 0) == 0 and state_counts.get(
                StepState.READY, 0
            ) == 0:
                run.state = RunState.FAILED
            else:
                run.state = RunState.EXECUTING
        elif state_counts.get(StepState.SUCCEEDED, 0) == len(steps):
            # All steps succeeded
            run.state = RunState.COMPLETED
        else:
            run.state = RunState.EXECUTING

        self.db.commit()

    def close(self):
        """Close database session."""
        self.db.close()
