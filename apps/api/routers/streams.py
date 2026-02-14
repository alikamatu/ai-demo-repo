"""Server-Sent Events streaming for workflow timelines."""

from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import json
import asyncio
import time

from db import SessionLocal
from models.workflows import WorkflowRun
from models.timeline_event import TimelineEvent

router = APIRouter(prefix="/api/workflows", tags=["streams"])


def get_db():
    """Dependency to get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/{workflow_id}/stream")
async def stream_workflow_timeline(
    workflow_id: int,
    db: Session = Depends(get_db),
):
    """
    Stream workflow timeline events via Server-Sent Events.

    Clients can connect with:
    curl -N http://localhost:8000/api/workflows/1/stream

    Or in JavaScript:
    const es = new EventSource('/api/workflows/1/stream');
    es.addEventListener('step_ready', (e) => console.log(e.data));
    """

    # Verify workflow exists
    run = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow not found")

    async def event_generator():
        """Generate timeline events as SSE stream."""
        last_event_id = 0
        polling_interval = 0.5  # Poll every 500ms

        while True:
            try:
                # Query new events since last poll
                events = (
                    db.query(TimelineEvent)
                    .filter(
                        TimelineEvent.run_id == workflow_id,
                        TimelineEvent.id > last_event_id,
                    )
                    .order_by(TimelineEvent.id)
                    .all()
                )

                # Stream each new event
                for event in events:
                    event_data = {
                        "id": event.id,
                        "event": event.event_type.value,
                        "message": event.message,
                        "timestamp": event.created_at.isoformat(),
                        "metadata": (
                            json.loads(event.metadata)
                            if event.metadata
                            else {}
                        ),
                    }
                    yield f"data: {json.dumps(event_data)}\n\n"
                    last_event_id = event.id

                # Check if workflow is complete
                db.refresh(run)
                from models.workflows import RunState

                if run.state in [RunState.COMPLETED, RunState.FAILED, RunState.CANCELED]:
                    # Send completion event
                    yield f"data: {json.dumps({
                        'event': 'workflow_complete',
                        'message': f'Workflow {run.state.value}',
                        'timestamp': str(time.time()),
                    })}\n\n"
                    break

                # Wait before next poll
                await asyncio.sleep(polling_interval)

            except Exception as e:
                yield f"data: {json.dumps({
                    'event': 'error',
                    'message': f'Error: {str(e)}',
                })}\n\n"
                break

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/{workflow_id}/timeline")
async def get_workflow_timeline(
    workflow_id: int,
    db: Session = Depends(get_db),
) -> dict:
    """Get complete timeline for a workflow (non-streaming)."""
    run = db.query(WorkflowRun).filter(WorkflowRun.id == workflow_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Workflow not found")

    events = (
        db.query(TimelineEvent)
        .filter(TimelineEvent.run_id == workflow_id)
        .order_by(TimelineEvent.id)
        .all()
    )

    return {
        "workflow_id": workflow_id,
        "status": run.state.value,
        "events": [
            {
                "id": e.id,
                "event": e.event_type.value,
                "message": e.message,
                "timestamp": e.created_at.isoformat(),
                "metadata": json.loads(e.metadata) if e.metadata else {},
            }
            for e in events
        ],
    }
