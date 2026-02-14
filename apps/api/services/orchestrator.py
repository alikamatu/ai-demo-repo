"""Workflow orchestrator — plan generation and initialization."""

import uuid
from datetime import datetime, timezone
from typing import Optional

from pydantic import BaseModel

from db import SessionLocal
from models.workflows import WorkflowRun, WorkflowStep, RunState, StepState


class PlanStep(BaseModel):
    """A step in a generated execution plan."""

    name: str
    tool: str
    risk_level: str  # L0, L1, L2, L3
    depends_on: list[int] = None  # List of step indices this depends on


class ExecutionPlan(BaseModel):
    """Complete execution plan for a workflow."""

    steps: list[PlanStep]


class Orchestrator:
    """Generates and initializes workflow execution plans."""

    def __init__(self, db=None):
        self.db = db or SessionLocal()

    def parse_intent(self, intent: str) -> ExecutionPlan:
        """
        Parse user intent into structured execution plan.

        This is a demo mock planner. In production, use an LLM or
        intent parser to generate the structured plan.
        """
        intent_lower = intent.lower()

        steps = []

        # Demo logic: simple keyword-based routing
        if "job" in intent_lower or "apply" in intent_lower:
            steps.append(
                PlanStep(
                    name="Search for backend jobs",
                    tool="job_search",
                    risk_level="L0",
                    depends_on=[],
                )
            )
            steps.append(
                PlanStep(
                    name="Tailor CV to job description",
                    tool="cv_tailor",
                    risk_level="L1",
                    depends_on=[0],  # Depends on job search
                )
            )
            steps.append(
                PlanStep(
                    name="Submit job application",
                    tool="job_submit",
                    risk_level="L3",  # High risk - external write, requires approval
                    depends_on=[1],  # Depends on CV tailor
                )
            )

        if "gym" in intent_lower or "schedule" in intent_lower or "exercise" in intent_lower:
            gym_idx = len(steps)
            steps.append(
                PlanStep(
                    name="Create gym events (3x weekly)",
                    tool="calendar_create",
                    risk_level="L0",  # Calendar access is low risk
                    depends_on=[],
                )
            )

        if "grocer" in intent_lower or "food" in intent_lower or "shop" in intent_lower:
            steps.append(
                PlanStep(
                    name="Generate grocery list",
                    tool="grocery_plan",
                    risk_level="L0",  # No external write
                    depends_on=[],
                )
            )

        # Fallback if no keyword matches
        if not steps:
            steps.append(
                PlanStep(
                    name="Execute user request",
                    tool="generic",
                    risk_level="L1",
                    depends_on=[],
                )
            )

        return ExecutionPlan(steps=steps)

    def create_workflow(self, user_id: int, intent: str) -> WorkflowRun:
        """
        Create a new workflow with generated execution plan.

        Returns the created WorkflowRun.
        """
        # Parse intent into plan
        plan = self.parse_intent(intent)

        # Create workflow run
        run = WorkflowRun(
            user_id=user_id,
            intent=intent,
            state=RunState.PLANNING,
            risk_level="L0",  # Aggregate risk level
        )

        self.db.add(run)
        self.db.flush()  # Get run.id

        # Create steps from plan
        step_models = []
        for idx, plan_step in enumerate(plan.steps):
            # Resolve dependency indices to step IDs
            depends_on_ids = []
            if plan_step.depends_on:
                depends_on_ids = [
                    step_models[dep_idx].id for dep_idx in plan_step.depends_on]

            step = WorkflowStep(
                run_id=run.id,
                name=plan_step.name,
                tool=plan_step.tool,
                risk_level=plan_step.risk_level,
                state=StepState.PENDING,
                depends_on=depends_on_ids,
                attempt=0,
            )
            self.db.add(step)
            self.db.flush()
            step_models.append(step)

        self.db.commit()
        self.db.refresh(run)

        return run

    def close(self):
        """Close database session."""
        self.db.close()
