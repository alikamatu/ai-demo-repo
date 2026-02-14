"""Approval decision endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from db import SessionLocal
from models.approvals import Approval
from models.timeline_event import TimelineEvent, EventType
from services.approval import ApprovalService

router = APIRouter(prefix="/api/approvals", tags=["approvals"])


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class ApprovalDecision(BaseModel):
    """Approval decision payload."""

    decision: str  # "approve" or "reject"
    decided_by: int  # User ID making decision
    reason: str = None  # Optional reason for rejection


@router.get("/{approval_id}")
async def get_approval(
    approval_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get approval details."""
    approval = db.query(Approval).filter(Approval.id == approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")

    return {
        "id": approval.id,
        "run_id": approval.run_id,
        "step_id": approval.step_id,
        "status": approval.status.value,
        "reason": approval.reason,
        "decided_by": approval.decided_by,
        "decided_at": approval.decided_at.isoformat() if approval.decided_at else None,
        "created_at": approval.created_at.isoformat(),
    }


@router.post("/{approval_id}/decision")
async def make_approval_decision(
    approval_id: int,
    payload: ApprovalDecision,
    db: Session = Depends(get_db),
) -> dict:
    """
    Make an approval decision (approve or reject).

    This endpoint:
    1. Updates the approval status
    2. Unblocks or skips the step
    3. Triggers scheduler to resume
    """
    approval_service = ApprovalService(db)

    if payload.decision.lower() == "approve":
        result = approval_service.approve_step(approval_id, payload.decided_by)

        if result["success"]:
            # Record approval event
            approval = db.query(Approval).filter(
                Approval.id == approval_id).first()
            event = TimelineEvent(
                run_id=approval.run_id,
                step_id=approval.step_id,
                approval_id=approval.id,
                event_type=EventType.APPROVAL_APPROVED,
                message=f"Approval granted: {approval.reason}",
            )
            db.add(event)
            db.commit()

    elif payload.decision.lower() == "reject":
        result = approval_service.reject_step(
            approval_id, payload.decided_by, payload.reason
        )

        if result["success"]:
            # Record rejection event
            approval = db.query(Approval).filter(
                Approval.id == approval_id).first()
            event = TimelineEvent(
                run_id=approval.run_id,
                step_id=approval.step_id,
                approval_id=approval.id,
                event_type=EventType.APPROVAL_REJECTED,
                message=f"Approval rejected: {payload.reason or 'No reason provided'}",
            )
            db.add(event)
            db.commit()

    else:
        raise HTTPException(
            status_code=400,
            detail="Decision must be 'approve' or 'reject'",
        )

    return result


@router.get("/workflow/{workflow_id}")
async def get_workflow_approvals(
    workflow_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get all approvals for a workflow."""
    approvals = (
        db.query(Approval)
        .filter(Approval.run_id == workflow_id)
        .order_by(Approval.created_at.desc())
        .all()
    )

    return {
        "workflow_id": workflow_id,
        "approvals": [
            {
                "id": a.id,
                "step_id": a.step_id,
                "status": a.status.value,
                "reason": a.reason,
                "decided_by": a.decided_by,
                "decided_at": a.decided_at.isoformat() if a.decided_at else None,
                "created_at": a.created_at.isoformat(),
            }
            for a in approvals
        ],
    }
