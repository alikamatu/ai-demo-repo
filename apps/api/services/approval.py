"""Approval service — approval workflow and state management."""

from datetime import datetime, timezone
from typing import Optional

from db import SessionLocal
from models.workflows import WorkflowRun, WorkflowStep, StepState
from models.approvals import Approval, ApprovalStatus


class ApprovalService:
    """Manages approval workflow."""

    def __init__(self, db=None):
        self.db = db or SessionLocal()

    def get_pending_approvals(self, run_id: int) -> list[Approval]:
        """Get all pending approvals for a workflow run."""
        return (
            self.db.query(Approval)
            .filter(
                Approval.run_id == run_id,
                Approval.status == ApprovalStatus.REQUIRED,
            )
            .all()
        )

    def approve_step(
        self,
        approval_id: int,
        decided_by: Optional[int] = None,
    ) -> dict:
        """
        Approve a blocked step.

        Returns dict with:
        - success: bool
        - message: str
        """
        approval = self.db.query(Approval).filter(
            Approval.id == approval_id).first()
        if not approval:
            return {"success": False, "message": "Approval not found"}

        if approval.status != ApprovalStatus.REQUIRED:
            return {"success": False, "message": "Approval is not in REQUIRED state"}

        step = self.db.query(WorkflowStep).filter(
            WorkflowStep.id == approval.step_id).first()
        if not step:
            return {"success": False, "message": "Step not found"}

        # Update approval
        approval.status = ApprovalStatus.APPROVED
        approval.decided_by = decided_by
        approval.decided_at = datetime.now(timezone.utc)

        # Unblock step - transition to ready
        step.state = StepState.READY

        self.db.commit()

        return {"success": True, "message": f"Step '{step.name}' approved and ready to execute"}

    def reject_step(
        self,
        approval_id: int,
        decided_by: Optional[int] = None,
        reason: Optional[str] = None,
    ) -> dict:
        """
        Reject a blocked step.

        Returns dict with:
        - success: bool
        - message: str
        """
        approval = self.db.query(Approval).filter(
            Approval.id == approval_id).first()
        if not approval:
            return {"success": False, "message": "Approval not found"}

        if approval.status != ApprovalStatus.REQUIRED:
            return {"success": False, "message": "Approval is not in REQUIRED state"}

        step = self.db.query(WorkflowStep).filter(
            WorkflowStep.id == approval.step_id).first()
        if not step:
            return {"success": False, "message": "Step not found"}

        # Update approval
        approval.status = ApprovalStatus.REJECTED
        approval.decided_by = decided_by
        approval.decided_at = datetime.now(timezone.utc)
        if reason:
            approval.reason = reason

        # Skip the step
        step.state = StepState.SKIPPED

        self.db.commit()

        return {"success": True, "message": f"Step '{step.name}' rejected and marked as skipped"}

    def close(self):
        """Close database session."""
        self.db.close()
