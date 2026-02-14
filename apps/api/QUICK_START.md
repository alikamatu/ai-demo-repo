# Life OS Workflow Engine — Quick Start

Production-grade parallel workflow orchestration with risk-based approval.

## ⚡ 30-Second Setup

```bash
cd apps/api

# Install dependencies
pip install -e ".[dev]"

# Initialize database
alembic upgrade head

# Start server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Server running at: http://localhost:8000

## 🎬 Demo (2 Minutes)

### Terminal 1: Start Server

```bash
cd apps/api
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 2: Run Demo Script

```bash
cd apps/api
python demo.py
```

**Expected Output:**

```
🚀 Life OS Workflow Execution Engine Demo
====================================================================

📝 Submitting workflow: Apply to 2 backend jobs, schedule gym 3x this week...

✅ Workflow submitted: ID = 1

🔍 Checking for approval gates...

🛑 Found pending approval:
   Step ID: 3
   Reason: High-risk operation: Submit job application (risk level: L3)
   Approval ID: 1

📊 Current workflow timeline:
  • workflow_started: Workflow started: Apply to 2 backend jobs...
  • step_ready: Step ready: Search for backend jobs
  • step_running: Step running: Search for backend jobs
  • step_succeeded: Step succeeded: Search for backend jobs
  • step_ready: Step ready: Create gym events (3x weekly)

⏸️ Workflow paused at approval gate.
   High-risk steps require manual approval.

Do you want to approve? (yes/no): yes

✅ Approval granted
```

Then real-time streaming begins:

```
🔴 Streaming workflow 1... (Press Ctrl+C to stop)

🟦 [2026-02-14T10:30:01Z] step_ready: Step ready: Tailor CV to job
⏳ [2026-02-14T10:30:02Z] step_running: Step running: Tailor CV to job
✅ [2026-02-14T10:30:03Z] step_succeeded: Step succeeded: Tailor CV to job
🟦 [2026-02-14T10:30:04Z] step_ready: Step ready: Submit job application
⏳ [2026-02-14T10:30:05Z] step_running: Step running: Submit job application
✅ [2026-02-14T10:30:06Z] step_succeeded: Step succeeded: Submit job application
🏁 [2026-02-14T10:30:07Z] workflow_complete: Workflow completed
```

## 📚 Key Components

### 1. Orchestrator

**File:** `services/orchestrator.py`

Parses intent → generates plan → creates workflow

```python
from services.orchestrator import Orchestrator
orch = Orchestrator(db)
run = orch.create_workflow(user_id=1, intent="Apply to jobs, schedule gym...")
```

### 2. Scheduler

**File:** `services/scheduler.py`

Implements DAG scheduling with dependency resolution

```python
from services.scheduler import Scheduler
sched = Scheduler(db)
ready = sched.get_ready_steps(run_id=1)  # Steps ready to execute
sched.schedule_round(run_id=1)  # Process one round
```

### 3. Executor

**File:** `services/executor.py`

Executes steps and invokes tools

```python
from services.executor import Executor
exec = Executor(db)
result = exec.execute_step(step_id=5)  # Execute single step
```

### 4. Approval Service

**File:** `services/approval.py`

Manages approval workflow for high-risk steps

```python
from services.approval import ApprovalService
appr = ApprovalService(db)
appr.approve_step(approval_id=1, decided_by=10)
appr.reject_step(approval_id=1, decided_by=10, reason="Too risky")
```

### 5. Tool Connectors

**File:** `services/tools.py`

Mock implementations of external tools:

- `execute_job_search` — Search jobs (L0)
- `execute_cv_tailor` — Tailor CV (L1)
- `execute_job_submit` — Submit application (L3)
- `execute_calendar_create` — Schedule gym (L0)
- `execute_grocery_plan` — Generate grocery list (L0)

## 🔌 API Endpoints

### Submit Workflow

```bash
POST /api/workflows/submit?user_id=1&intent=Apply%20to%202%20backend%20jobs...
```

### Stream Timeline (SSE)

```bash
curl -N http://localhost:8000/api/workflows/1/stream
```

### Get Timeline (REST)

```bash
GET /api/workflows/1/timeline
```

### Get Approvals

```bash
GET /api/approvals/workflow/1
```

### Make Decision

```bash
POST /api/approvals/1/decision
{
  "decision": "approve",
  "decided_by": 10
}
```

## 🎯 Risk Levels

| Level  | Auto-Execute | Approved | Use Case                              |
| ------ | ------------ | -------- | ------------------------------------- |
| **L0** | ✅           | ❌       | Safe operations (search, plan)        |
| **L1** | ✅           | ❌       | Low-risk writes (calendar)            |
| **L2** | ✅           | Optional | Medium-risk writes                    |
| **L3** | ❌           | ✅       | High-risk operations (submit, delete) |

## 📊 DAG Execution

```
PENDING (no deps met)
  ↓
READY (all deps succeeded)
  ↓
RUNNING (executing)
  ├─→ SUCCEEDED (✅)
  ├─→ FAILED (❌, retry max 3x)
  └─→ BLOCKED (⏸️ waiting for approval)
      ↓
      READY (after approve)
      ↓
      RUNNING
      ├─→ SUCCEEDED
      ├─→ FAILED

SKIPPED (after reject)
```

## 🔄 Complete Workflow Flow

```
1. User submits intent
   ↓
2. Orchestrator parses intent
   ↓
3. Create workflow run + steps in DB
   ↓
4. Background scheduler starts
   ↓
5. Scheduler identifies ready steps
   ├─ L0/L1 steps → READY → DISPATCH
   └─ L3 steps → BLOCKED → CREATE APPROVAL → emit event
   ↓
6. Executor runs ready steps in parallel
   ↓
7. Timeline events stream via SSE
   ├─ Events include: step_ready, step_running, step_succeeded, step_blocked, approval_required, etc
   ↓
8. User makes approval decision
   ↓
9. Scheduler resumes (triggers step → READY)
   ↓
10. Executor runs approved steps
    ↓
11. Workflow completes when all steps succeeded/skipped
```

## 🗂 File Structure

```
apps/api/
├── services/
│   ├── orchestrator.py       ← Plan generation
│   ├── scheduler.py           ← DAG scheduling
│   ├── executor.py            ← Step execution
│   ├── approval.py            ← Approval workflow
│   └── tools.py               ← Mock tool connectors
├── models/
│   ├── workflows.py           ← WorkflowRun, WorkflowStep, RunState, StepState
│   ├── approvals.py           ← Approval, ApprovalStatus
│   ├── tool_calls.py          ← ToolCall, ToolCallStatus
│   ├── timeline_event.py      ← TimelineEvent, EventType
│   └── ...
├── app/routers/
│   ├── orchestration.py       ← /api/workflows/submit
│   ├── streams.py             ← /api/workflows/{id}/stream
│   ├── approvals.py           ← /api/approvals/{id}/decision
│   └── ...
├── alembic/
│   └── versions/
│       └── 001_initial_schema.py
├── main.py
├── WORKFLOW_ENGINE.md         ← Full documentation
├── QUICK_START.md             ← This file
└── demo.py                    ← Interactive demo
```

## 🚀 Next Steps

### Advanced Features

1. **Redis Queue Integration**
   - Replace sync execution with async RQ workers
   - Scale to thousands of parallel steps

2. **LLM-Based Intent Parsing**
   - Replace mock orchestrator with GPT-4 planner
   - Natural language → structured execution plan

3. **Webhook Notifications**
   - Notify external systems on approval gates
   - Send alerts on workflow failures

4. **Dead-Letter Queue**
   - Failed steps → DLQ after max retries
   - Manual intervention workflow

5. **Analytics & Monitoring**
   - Track workflow success rates
   - Monitor step execution times
   - Alert on failures

## 🐛 Troubleshooting

### Workflow stuck in PLANNING?

- Check approvals: `curl http://localhost:8000/api/approvals/workflow/1`
- Look for steps with `status: required`

### Steps not executing?

- Verify dependencies in DAG: `curl http://localhost:8000/api/workflows/1/timeline`
- Check risk levels: L3 steps require approval

### Timeline events missing?

- Run migrations: `alembic upgrade head`
- Verify TimelineEvent table created

## 📖 Full Documentation

- **WORKFLOW_ENGINE.md** — Complete architecture & API reference
- **SETUP.md** — Database & deployment guide
- **Swagger UI** — http://localhost:8000/docs

## 💡 Example Custom Tool

```python
# Add to services/tools.py

def execute_email_send(step, args: dict) -> dict:
    """Send email tool."""
    recipient = args.get("recipient", "user@example.com")
    subject = args.get("subject", "No subject")

    # Actually send email (or mock)
    return {
        "status": "success",
        "email_sent": True,
        "recipient": recipient,
        "subject": subject,
    }

# Register in services/executor.py
Executor.TOOL_EXECUTORS["email_send"] = execute_email_send

# Use in orchestrator plan
PlanStep(
    name="Send confirmation email",
    tool="email_send",
    risk_level="L1",
    depends_on=[],
)
```

## 🎓 Learn More

- FastAPI: https://fastapi.tiangolo.com
- SQLAlchemy: https://sqlalchemy.org
- Alembic: https://alembic.sqlalchemy.org
- Server-Sent Events: https://html.spec.whatwg.org/multipage/server-sent-events.html
