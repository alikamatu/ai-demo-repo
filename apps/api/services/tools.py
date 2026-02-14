"""Mock tool connectors for workflow execution."""

import json
from datetime import datetime, timedelta


def execute_job_search(step, args: dict) -> dict:
    """Mock job search tool."""
    return {
        "status": "success",
        "jobs_found": 2,
        "jobs": [
            {
                "id": "job_001",
                "title": "Senior Backend Engineer",
                "company": "TechCorp",
                "url": "https://careers.techcorp.com/job/001",
                "description": "Building scalable microservices",
            },
            {
                "id": "job_002",
                "title": "Backend Developer",
                "company": "StartupXYZ",
                "url": "https://careers.startupxyz.com/job/002",
                "description": "Python + FastAPI development",
            },
        ],
    }


def execute_cv_tailor(step, args: dict) -> dict:
    """Mock CV tailoring tool."""
    job_id = args.get("job_id", "job_001")
    return {
        "status": "success",
        "tailored_cv_generated": True,
        "job_id": job_id,
        "highlights": [
            "FastAPI experience",
            "Microservices architecture",
            "Python expertise",
            "AWS deployment",
        ],
        "cover_letter_outline": "Tailored toward scalability focus",
    }


def execute_job_submit(step, args: dict) -> dict:
    """Mock job application submission tool."""
    job_id = args.get("job_id", "job_001")
    return {
        "status": "success",
        "application_submitted": True,
        "job_id": job_id,
        "confirmation_id": f"APP-{job_id}-{datetime.now().timestamp()}",
        "message": f"Application submitted for job {job_id}",
    }


def execute_calendar_create(step, args: dict) -> dict:
    """Mock calendar event creation tool."""
    today = datetime.now().date()
    gym_days = []

    # Create 3 gym sessions this week (Mon, Wed, Fri)
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 0  # If today is Monday, start today

    for offset in [0, 2, 4]:  # Mon, Wed, Fri
        event_date = today + timedelta(days=offset)
        gym_days.append(
            {
                "date": event_date.isoformat(),
                "time": "18:00",
                "duration": "60 minutes",
                "type": "Gym Session",
            }
        )

    return {
        "status": "success",
        "events_created": 3,
        "calendar": "Workouts",
        "events": gym_days,
    }


def execute_grocery_plan(step, args: dict) -> dict:
    """Mock grocery planning tool."""
    return {
        "status": "success",
        "list_generated": True,
        "grocery_list": {
            "proteins": ["chicken breast", "salmon", "eggs"],
            "vegetables": ["broccoli", "spinach", "carrots"],
            "fruits": ["apples", "bananas", "berries"],
            "grains": ["brown rice", "whole wheat bread"],
            "other": ["olive oil", "pasta", "cheese"],
        },
        "estimated_cost": "$75-90",
        "estimated_items": 25,
    }
