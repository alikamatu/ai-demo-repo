"""Timeline event tracking for real-time streaming."""

import enum
from datetime import datetime
from typing import Optional

from sqlalchemy import String, ForeignKey, Text, DateTime, Enum, func
from sqlalchemy.orm import Mapped, mapped_column

from db import Base


class EventType(str, enum.Enum):
    """Timeline event types."""

    STEP_READY = "step_ready"
    STEP_RUNNING = "step_running"
    STEP_BLOCKED = "step_blocked"
    STEP_SUCCEEDED = "step_succeeded"
    STEP_FAILED = "step_failed"
    STEP_SKIPPED = "step_skipped"
    APPROVAL_REQUIRED = "approval_required"
    APPROVAL_APPROVED = "approval_approved"
    APPROVAL_REJECTED = "approval_rejected"
    WORKFLOW_STARTED = "workflow_started"
    WORKFLOW_COMPLETED = "workflow_completed"


class TimelineEvent(Base):
    """Event in workflow execution timeline."""

    __tablename__ = "timeline_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    run_id: Mapped[int] = mapped_column(ForeignKey(
        "workflow_runs.id", ondelete="CASCADE"), nullable=False, index=True)
    step_id: Mapped[Optional[int]] = mapped_column(ForeignKey(
        "workflow_steps.id", ondelete="SET NULL"), nullable=True)
    approval_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("approvals.id", ondelete="SET NULL"), nullable=True)

    event_type: Mapped[EventType] = mapped_column(
        Enum(EventType), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    metadata: Mapped[Optional[str]] = mapped_column(
        Text, nullable=True)  # JSON metadata

    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=func.now(), nullable=False)

    def __repr__(self) -> str:
        return f"<TimelineEvent(id={self.id}, run_id={self.run_id}, event_type={self.event_type})>"

    def to_sse(self) -> str:
        """Format event as Server-Sent Event."""
        import json

        return f"data: {json.dumps({
            'event': self.event_type.value,
            'message': self.message,
            'timestamp': self.created_at.isoformat(),
            'metadata': json.loads(self.metadata) if self.metadata else {},
        })}\n\n"
