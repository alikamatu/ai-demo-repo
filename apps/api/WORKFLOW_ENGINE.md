# Life OS Workflow Execution Engine

Production-grade parallel workflow orchestration with risk-based approval, DAG scheduling, and real-time streaming.

## 🎯 Overview

The Life OS workflow engine enables sophisticated multi-step task execution with:

- **Directed Acyclic Graph (DAG) scheduling** — dependency resolution and parallel execution
- **Risk-based approval gates** — L0-L3 risk levels with mandatory approval for high-risk operations
- **Real-time streaming** — Server-Sent Events for live workflow timeline monitoring
- **Idempotent execution** — safe retries with atomic tool calls
- **Flexible tool connectors** — easily add new tool integrations

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ User Submits Natural Language Intent                        │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   Orchestrator       │
        │  (Intent → Plan)     │
        └──────────┬───────────┘
                   │
         ┌─────────▼──────────┐
         │ Create Workflow    │
         │ & Steps (DB)       │
         └─────────┬──────────┘
                   │
         ┌─────────▼──────────────────┐
         │  Scheduler Loop (async)    │
         │  1. Find ready steps       │
         │  2. Check risk levels      │
         │  3. Create approvals       │
         │  4. Dispatch execution     │
         │  5. Stream events          │
         └─────────┬──────────────────┘
                   │
      ┌────────────┼────────────┐
      ▼            ▼            ▼
  ┌────────┐  ┌────────┐  ┌────────┐
  │ Executor│ │ Approval│ │ Streams│
  │ (Tools) │ │ (Gates) │ │ (SSE)  │
  └────────┘  └────────┘  └────────┘
```

## 📊 Workflow State Machine

```
QUEUED → PLANNING → EXECUTING ⟷ WAITING_APPROVAL → COMPLETED
                        ↓
                      FAILED
```

## 🔄 DAG Execution Model

Steps transition through states based on dependencies:

```
PENDING (no deps satisfied)
   ↓
READY (all dependencies succeeded)
   ↓
RUNNING (executing)
   ├─→ SUCCEEDED (completed successfully)
   ├─→ FAILED (execution failed, max retries exceeded)
   └─→ BLOCKED (waiting for approval)
       ↓
       ⟷ READY (after approval)
       ↓
       SKIPPED (rejected)
```

## 🚀 Key Services

### Orchestrator (`services/orchestrator.py`)

Parses user intent and generates execution plan:

```python
from services.orchestrator import Orchestrator

orchestrator = Orchestrator(db)
# Parse intent and create workflow with steps
run = orchestrator.create_workflow(user_id=1, intent="Apply to 2 backend jobs, schedule gym 3x this week, plan groceries")
```

**Steps Generated:**

1. Search for backend jobs (L0 - auto-execute)
2. Tailor CV (L1 - auto-execute, notify)
3. Submit job application (L3 - BLOCK for approval)
4. Create gym events (L0 - auto-execute)
5. Plan groceries (L0 - auto-execute)

### Scheduler (`services/scheduler.py`)

Implements DAG scheduling with dependency resolution:

```python
from services.scheduler import Scheduler

scheduler = Scheduler(db)
# Get all steps ready to execute
ready = scheduler.get_ready_steps(run_id=1)
# Process one scheduling round
result = scheduler.schedule_round(run_id=1)
# result['ready_steps'] - steps queued for execution
# result['blocked_steps'] - steps waiting for approval
```

### Executor (`services/executor.py`)

Executes steps and invokes tools:

```python
from services.executor import Executor

executor = Executor(db)
# Execute a single step
result = executor.execute_step(step_id=5)
# Returns: { success: bool, result: Any, error: str }
```

### Approval Service (`services/approval.py`)

Manages approval workflow:

```python
from services.approval import ApprovalService

approval_svc = ApprovalService(db)
# Approve a blocked step
approval_svc.approve_step(approval_id=1, decided_by=10)
# Reject a blocked step
approval_svc.reject_step(approval_id=1, decided_by=10, reason="Too risky")
```

## 🛠 Tool Connectors

Mock implementations in `services/tools.py`:

| Tool              | Function              | Risk |
| ----------------- | --------------------- | ---- |
| `job_search`      | Search backend jobs   | L0   |
| `cv_tailor`       | Tailor CV to job      | L1   |
| `job_submit`      | Submit application    | L3   |
| `calendar_create` | Create gym events     | L0   |
| `grocery_plan`    | Generate grocery list | L0   |

Add custom tools:

```python
def execute_custom_tool(step, args: dict) -> dict:
    """Custom tool execution."""
    return {"status": "success", "result": {...}}

# Register in executor
Executor.TOOL_EXECUTORS["custom_tool"] = execute_custom_tool
```

## 📡 API Endpoints

### 1. Submit Workflow

```bash
POST /api/workflows/submit?user_id=1&intent=Apply%20to%202%20backend%20jobs...
```

**Response:**

```json
{
  "workflow_id": 1,
  "status": "submitted",
  "intent": "Apply to 2 backend jobs..."
}
```

### 2. Stream Timeline (Server-Sent Events)

```bash
curl -N http://localhost:8000/api/workflows/1/stream
```

**Events Streamed:**

```json
{
  "event": "step_ready",
  "message": "Step ready: Search for backend jobs",
  "timestamp": "2026-02-14T10:30:00Z",
  "metadata": {}
}
```

### 3. Get Timeline (Non-Streaming)

```bash
GET /api/workflows/1/timeline
```

**Response:**

```json
{
  "workflow_id": 1,
  "status": "waiting_approval",
  "events": [
    {
      "id": 1,
      "event": "workflow_started",
      "message": "Workflow started: Apply to 2 backend jobs...",
      "timestamp": "2026-02-14T10:30:00Z"
    },
    {
      "id": 2,
      "event": "step_ready",
      "message": "Step ready: Search for backend jobs",
      "timestamp": "2026-02-14T10:30:01Z"
    },
    ...
  ]
}
```

### 4. Get Approvals

```bash
GET /api/approvals/workflow/1
```

**Response:**

```json
{
  "workflow_id": 1,
  "approvals": [
    {
      "id": 1,
      "step_id": 3,
      "status": "required",
      "reason": "High-risk operation: Submit job application (risk level: L3)",
      "decided_by": null,
      "decided_at": null,
      "created_at": "2026-02-14T10:30:02Z"
    }
  ]
}
```

### 5. Make Approval Decision

```bash
POST /api/approvals/1/decision
Content-Type: application/json

{
  "decision": "approve",
  "decided_by": 10,
  "reason": null
}
```

Or reject:

```json
{
  "decision": "reject",
  "decided_by": 10,
  "reason": "Too risky for now"
}
```

## 🧪 Demo Flow

### 1. Start Server

```bash
cd apps/api
export DATABASE_URL="sqlite:///./lifeos.db"
alembic upgrade head
pip install -e ".[dev]"
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Submit Workflow

```bash
curl -X POST "http://localhost:8000/api/workflows/submit?user_id=1&intent=Apply%20to%202%20backend%20jobs,%20schedule%20gym%203x%20this%20week,%20and%20plan%20groceries"
```

### 3. Watch Stream (in another terminal)

```bash
curl -N http://localhost:8000/api/workflows/1/stream
```

**You should see:**

```
data: {"event": "workflow_started", ...}
data: {"event": "step_ready", "message": "Step ready: Search for backend jobs"}
data: {"event": "step_running", "message": "Step running: Search for backend jobs"}
data: {"event": "step_succeeded", "message": "Step succeeded: Search for backend jobs"}
data: {"event": "step_ready", "message": "Step ready: Tailor CV to job description"}
... (more steps execute in parallel)
...
data: {"event": "step_blocked", "message": "Step blocked pending approval: Submit job application"}
data: {"event": "approval_required", "message": "Approval required: Submit job application"}
```

### 4. Check Approvals

```bash
curl http://localhost:8000/api/approvals/workflow/1
```

### 5. Approve Job Submission

```bash
curl -X POST http://localhost:8000/api/approvals/1/decision \
  -H "Content-Type: application/json" \
  -d '{"decision": "approve", "decided_by": 10}'
```

**Watch stream again** — you should see:

```
data: {"event": "approval_approved", "message": "Approval granted: ..."}
data: {"event": "step_ready", "message": "Step ready: Submit job application"}
data: {"event": "step_running", "message": "Step running: Submit job application"}
data: {"event": "step_succeeded", "message": "Step succeeded: Submit job application"}
```

Then all steps complete and workflow transitions to COMPLETED.

## ⚙️ Risk Levels Explained

| Level  | Auto-Execute | Requires Approval  | Use Case                                        |
| ------ | ------------ | ------------------ | ----------------------------------------------- |
| **L0** | ✅ Yes       | ❌ No              | Read-only, safe operations (search, plan)       |
| **L1** | ✅ Yes       | ❌ No              | Low-risk write (calendar events, notifications) |
| **L2** | ✅ Yes       | ✅ Yes\*           | Medium-risk write (\* if config set)            |
| **L3** | ❌ No        | ✅ Yes (mandatory) | High-risk operations (submit, transfer, delete) |

## 🔐 Safety Features

1. **Idempotent Execution** — each tool call recorded with execution key
2. **Retry Logic** — max 3 per-step attempts before dead-letter
3. **Atomic Transactions** — all-or-nothing updates
4. **Approval Gates** — mandatory for L3, optional for L2
5. **Step Dependencies** — DAG prevents out-of-order execution
6. **State Tracking** — complete timeline for audit

## 🚀 Production Enhancements

### 1. Redis Queue Integration

```python
from rq import Queue
from redis import Redis

redis_conn = Redis()
q = Queue(connection=redis_conn)

# Enqueue step execution
job = q.enqueue(execute_step_worker, step_id=5)
```

### 2. Async Execution

```python
from services.executor import Executor
import asyncio

executor = Executor(db)
# Run steps in parallel
tasks = [
    asyncio.create_task(executor.execute_step(step.id))
    for step in ready_steps
]
await asyncio.gather(*tasks)
```

### 3. Dead-Letter Queue

Failed steps after max retries go to:

```python
db.query(ToolCall).filter(
    ToolCall.status == ToolCallStatus.FAILED,
    ToolCall.retries >= 3,
).all()
```

### 4. Webhook Notifications

```python
# Notify external systems on approval required
POST /webhook/approval_required
{
  "workflow_id": 1,
  "step_id": 3,
  "approval_id": 1,
  "reason": "High-risk operation..."
}
```

### 5. LLM-Based Intent Parsing

Replace mock parser with real LLM:

```python
from openai import OpenAI

client = OpenAI(api_key=settings.OPENAI_API_KEY)

def parse_intent_with_llm(intent: str) -> ExecutionPlan:
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "system",
            "content": "You are a task planner. Break down user intents into structured steps.",
            "role": "user",
            "content": intent,
        }],
        functions=[{
            "name": "create_plan",
            "parameters": {...},
        }],
    )
    # Parse response into ExecutionPlan
```

## 📚 API Reference

See [SETUP.md](./SETUP.md) for database schema and complete endpoint reference.

## 🐛 Troubleshooting

### Workflow Stuck in PLANNING

Check approval status: `GET /api/approvals/workflow/{id}`

### Steps Not Executing

Verify dependencies: check `depends_on` field in steps

Check risk levels: L3 steps require approval

### Timeline Events Missing

Verify TimelineEvent table exists: `alembic upgrade head`

Check event_type enum created

### Approval Not Updating

Ensure `decided_by` is valid user ID

Check approval status is `required`

## 📖 Full API Documentation

Interactive Swagger docs at: http://localhost:8000/docs

ReDoc docs at: http://localhost:8000/redoc
