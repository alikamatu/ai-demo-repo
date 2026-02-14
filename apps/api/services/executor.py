"""Executor — step execution and tool invocation."""

import json
from typing import Optional, Any

from db import SessionLocal
from models.workflows import WorkflowStep, StepState
from models.tool_calls import ToolCall, ToolCallStatus
from services.tools import (
    execute_job_search,
    execute_cv_tailor,
    execute_job_submit,
    execute_calendar_create,
    execute_grocery_plan,
)


class Executor:
    """Executes workflow steps and tool calls."""

    def __init__(self, db=None):
        self.db = db or SessionLocal()

    # Tool registry mapping tool name to executor function
    TOOL_EXECUTORS = {
        "job_search": execute_job_search,
        "cv_tailor": execute_cv_tailor,
        "job_submit": execute_job_submit,
        "calendar_create": execute_calendar_create,
        "grocery_plan": execute_grocery_plan,
        "generic": self._execute_generic,
    }

    def execute_step(self, step_id: int, args: Optional[dict] = None) -> dict:
        """
        Execute a single workflow step.

        Returns dict with:
        - success: bool
        - result: Any
        - error: Optional[str]
        """
        step = self.db.query(WorkflowStep).filter(
            WorkflowStep.id == step_id).first()
        if not step:
            return {"success": False, "result": None, "error": "Step not found"}

        try:
            # Mark as running
            step.state = StepState.RUNNING
            step.attempt = step.attempt + 1
            self.db.commit()

            # Get tool executor
            executor_func = self.TOOL_EXECUTORS.get(
                step.tool, self._execute_generic)

            # Execute tool
            result = executor_func(step, args or {})

            # Create tool call record
            tool_call = ToolCall(
                run_id=step.run_id,
                step_id=step.id,
                connector=step.tool,
                action=step.name,
                args_json=args or {},
                result_json=result,
                status=ToolCallStatus.SUCCESS,
            )
            self.db.add(tool_call)

            # Mark step as succeeded
            step.state = StepState.SUCCEEDED
            step.result_ref = json.dumps(result)
            self.db.commit()

            return {"success": True, "result": result, "error": None}

        except Exception as e:
            # Log tool call failure
            tool_call = ToolCall(
                run_id=step.run_id,
                step_id=step.id,
                connector=step.tool,
                action=step.name,
                args_json=args or {},
                result_json={"error": str(e)},
                status=ToolCallStatus.FAILED,
            )
            self.db.add(tool_call)

            # Check retry count
            if step.attempt >= 3:
                step.state = StepState.FAILED
                step.error_message = f"Max retries exceeded: {str(e)}"
            else:
                step.state = StepState.PENDING  # Reset to pending for retry

            self.db.commit()

            return {"success": False, "result": None, "error": str(e)}

    def _execute_generic(self, step: WorkflowStep, args: dict) -> dict:
        """Generic/fallback tool executor."""
        return {
            "status": "completed",
            "message": f"Executed: {step.name}",
            "step_id": step.id,
        }

    def close(self):
        """Close database session."""
        self.db.close()
