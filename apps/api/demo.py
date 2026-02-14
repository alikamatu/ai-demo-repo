#!/usr/bin/env python3
"""
Demo script: Life OS Workflow Execution Engine

This script demonstrates:
1. Submitting a multi-step workflow
2. Waiting for approval gates
3. Approving high-risk steps
4. Monitoring execution via streaming

Usage:
    python demo.py

Or with custom intent:
    python demo.py --intent "Apply to 2 backend jobs..."
"""

import argparse
import requests
import json
import time
import sys
from typing import Optional

BASE_URL = "http://localhost:8000"
USER_ID = 1  # Demo user

DEFAULT_INTENT = (
    "Apply to 2 backend jobs, schedule gym 3x this week, and plan groceries"
)


def submit_workflow(intent: str) -> Optional[int]:
    """Submit a new workflow."""
    print(f"\n📝 Submitting workflow: {intent}\n")

    response = requests.post(
        f"{BASE_URL}/api/workflows/submit",
        params={"user_id": USER_ID, "intent": intent},
    )

    if response.status_code != 200:
        print(f"❌ Error: {response.text}")
        return None

    data = response.json()
    workflow_id = data["workflow_id"]
    print(f"✅ Workflow submitted: ID = {workflow_id}")
    return workflow_id


def get_timeline(workflow_id: int) -> dict:
    """Get complete timeline (non-streaming)."""
    response = requests.get(f"{BASE_URL}/api/workflows/{workflow_id}/timeline")

    if response.status_code != 200:
        print(f"❌ Error fetching timeline: {response.text}")
        return {}

    return response.json()


def get_approvals(workflow_id: int) -> dict:
    """Get all pending approvals."""
    response = requests.get(f"{BASE_URL}/api/approvals/workflow/{workflow_id}")

    if response.status_code != 200:
        print(f"❌ Error fetching approvals: {response.text}")
        return {}

    return response.json()


def approve_step(approval_id: int) -> bool:
    """Approve a blocked step."""
    print(f"\n✅ Approving step (approval ID: {approval_id})\n")

    response = requests.post(
        f"{BASE_URL}/api/approvals/{approval_id}/decision",
        json={
            "decision": "approve",
            "decided_by": USER_ID,
        },
    )

    if response.status_code != 200:
        print(f"❌ Error approving: {response.text}")
        return False

    print(f"✅ {response.json()['message']}")
    return True


def stream_timeline(workflow_id: int, max_duration: int = 60):
    """Stream timeline events in real-time."""
    print(f"\n🔴 Streaming workflow {workflow_id}... (Press Ctrl+C to stop)\n")

    try:
        response = requests.get(
            f"{BASE_URL}/api/workflows/{workflow_id}/stream",
            stream=True,
            timeout=None,
        )

        start_time = time.time()

        for line in response.iter_lines():
            if time.time() - start_time > max_duration:
                print("\n⏱️ Timeout reached")
                break

            if line and line.startswith(b"data: "):
                try:
                    event_data = json.loads(line[6:])

                    event = event_data.get("event", "unknown")
                    message = event_data.get("message", "")
                    timestamp = event_data.get("timestamp", "")

                    # Color-code events
                    if event == "step_ready":
                        emoji = "🟦"
                    elif event == "step_running":
                        emoji = "⏳"
                    elif event == "step_succeeded":
                        emoji = "✅"
                    elif event == "step_failed":
                        emoji = "❌"
                    elif event == "step_blocked":
                        emoji = "🛑"
                    elif event == "approval_required":
                        emoji = "⚠️"
                    elif event == "approval_approved":
                        emoji = "👍"
                    elif event == "workflow_complete":
                        emoji = "🏁"
                    else:
                        emoji = "📌"

                    print(f"{emoji} [{timestamp}] {event}: {message}")

                except json.JSONDecodeError:
                    pass

                # Workflow complete - stop streaming
                if event_data.get("event") == "workflow_complete":
                    print("\n✅ Workflow execution complete!")
                    break

    except KeyboardInterrupt:
        print("\n\n⏸️ Streaming stopped by user")
    except Exception as e:
        print(f"\n❌ Streaming error: {e}")


def demo_interactive(intent: str):
    """Run interactive demo with approval flow."""
    # Submit workflow
    workflow_id = submit_workflow(intent)
    if not workflow_id:
        return

    # Give scheduler time to start
    time.sleep(1)

    # Check for approvals
    max_checks = 30
    check_count = 0
    approval_id = None

    print("\n🔍 Checking for approval gates...\n")

    while check_count < max_checks:
        approvals_data = get_approvals(workflow_id)
        approvals = approvals_data.get("approvals", [])

        # Find pending approval
        for approval in approvals:
            if approval["status"] == "required":
                print(
                    f"🛑 Found pending approval:\n"
                    f"   Step ID: {approval['step_id']}\n"
                    f"   Reason: {approval['reason']}\n"
                    f"   Approval ID: {approval['id']}\n"
                )
                approval_id = approval["id"]
                break

        if approval_id:
            break

        check_count += 1
        time.sleep(0.5)

    if not approval_id:
        print("ℹ️ No approval gates found (all steps auto-executable)")

    # Get current timeline
    print("\n📊 Current workflow timeline:")
    timeline = get_timeline(workflow_id)
    events = timeline.get("events", [])

    for event in events[-5:]:  # Show last 5 events
        print(f"  • {event['event']}: {event['message']}")

    # Ask user for approval
    if approval_id:
        print(
            "\n⏸️ Workflow paused at approval gate.\n"
            "   High-risk steps require manual approval.\n"
        )

        response = input("Do you want to approve? (yes/no): ").lower().strip()
        if response in ["yes", "y"]:
            approve_step(approval_id)
            time.sleep(1)
        else:
            print("❌ Approval rejected - workflow will skip this step")

    # Stream timeline
    stream_timeline(workflow_id)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Life OS Workflow Execution Engine Demo"
    )
    parser.add_argument(
        "--intent",
        type=str,
        default=DEFAULT_INTENT,
        help="Workflow intent to execute",
    )
    parser.add_argument(
        "--workflow-id",
        type=int,
        help="Attach to existing workflow (skip submit)",
    )

    args = parser.parse_args()

    print("=" * 70)
    print("🚀 Life OS Workflow Execution Engine Demo")
    print("=" * 70)

    if args.workflow_id:
        # Attach to existing workflow
        print(f"\n📊 Connecting to workflow {args.workflow_id}...\n")
        stream_timeline(args.workflow_id)
    else:
        # Run full demo
        demo_interactive(args.intent)


if __name__ == "__main__":
    main()
