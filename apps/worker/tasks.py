"""Background worker — processes workflow steps via Redis Queue.

Usage:
    python -m apps.worker.tasks

Requires REDIS_URL environment variable to be set.
"""

import os
import logging

import redis
from rq import Queue, Worker

logger = logging.getLogger(__name__)

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")


def get_redis_connection():
    """Create a Redis connection from environment config."""
    try:
        conn = redis.Redis.from_url(REDIS_URL)
        conn.ping()
        return conn
    except redis.ConnectionError:
        logger.error("Failed to connect to Redis at %s", REDIS_URL)
        raise


def execute_step(step_id: int) -> dict:
    """Execute a single workflow step.

    Args:
        step_id: The database ID of the step to execute.

    Returns:
        Execution result dictionary.
    """
    logger.info("Executing step %d", step_id)
    # TODO: Import and call actual step execution logic
    # from app.services.workflow_service import WorkflowService
    return {"step_id": step_id, "status": "completed"}


def enqueue_step(step_id: int) -> None:
    """Enqueue a step for background processing."""
    conn = get_redis_connection()
    queue = Queue(connection=conn)
    queue.enqueue(execute_step, step_id)
    logger.info("Enqueued step %d for execution", step_id)


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger.info("Starting worker — listening on %s", REDIS_URL)
    conn = get_redis_connection()
    queue = Queue(connection=conn)
    Worker([queue], connection=conn).work()
