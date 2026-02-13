"""WorkflowRun SQLAlchemy model."""

import enum
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum, Integer, String

from app.core.database import Base


class RunState(str, enum.Enum):
    """Possible states for a workflow run."""

    queued = "queued"
    planning = "planning"
    waiting_approval = "waiting_approval"
    executing = "executing"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"


class WorkflowRun(Base):
    """A single workflow execution."""

    __tablename__ = "workflow_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False, index=True)
    intent = Column(String, nullable=False)
    state = Column(Enum(RunState), default=RunState.queued, nullable=False)
    risk_level = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
