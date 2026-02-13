"""Tests for workflow steps CRUD."""


def test_create_and_list_steps(client):
    """Create a run, add steps, and list them."""
    # Create a run first
    run_resp = client.post("/api/runs/", json={"user_id": 1, "intent": "Multi-step"})
    run_id = run_resp.json()["id"]

    # Create steps
    client.post(f"/api/runs/{run_id}/steps/", json={"name": "Step A", "tool": "git"})
    client.post(
        f"/api/runs/{run_id}/steps/",
        json={"name": "Step B", "depends_on": ["Step A"]},
    )

    # List steps
    response = client.get(f"/api/runs/{run_id}/steps/")
    assert response.status_code == 200
    steps = response.json()
    assert len(steps) == 2
    assert steps[0]["name"] == "Step A"
    assert steps[1]["depends_on"] == ["Step A"]


def test_update_step_state(client):
    """PATCH step to change state."""
    run_resp = client.post("/api/runs/", json={"user_id": 1, "intent": "Test"})
    run_id = run_resp.json()["id"]

    step_resp = client.post(f"/api/runs/{run_id}/steps/", json={"name": "Build"})
    step_id = step_resp.json()["id"]

    response = client.patch(
        f"/api/runs/{run_id}/steps/{step_id}",
        json={"state": "running"},
    )
    assert response.status_code == 200
    assert response.json()["state"] == "running"


def test_steps_on_missing_run(client):
    """GET steps for non-existent run returns 404."""
    response = client.get("/api/runs/999/steps/")
    assert response.status_code == 404
