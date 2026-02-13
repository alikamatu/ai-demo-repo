"""WorkflowStep SQLAlchemy model."""

import enum

from sqlalchemy import Column, Enum, ForeignKey, Integer, JSON, String

from app.core.database import Base


class StepState(str, enum.Enum):
    """Possible states for a workflow step."""

    pending = "pending"
    ready = "ready"
    running = "running"
    blocked = "blocked"
    succeeded = "succeeded"
    failed = "failed"
    skipped = "skipped"


class WorkflowStep(Base):
    """A single step within a workflow run."""

    __tablename__ = "workflow_steps"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("workflow_runs.id"), nullable=False, index=True)
    name = Column(String, nullable=False)
    depends_on = Column(JSON, default=list)
    state = Column(Enum(StepState), default=StepState.pending, nullable=False)
    attempt = Column(Integer, default=0)
    tool = Column(String, nullable=True)
    result_ref = Column(String, nullable=True)
