"""Tests for workflow runs CRUD."""


def test_list_runs_empty(client):
    """GET /api/runs returns empty list initially."""
    response = client.get("/api/runs/")
    assert response.status_code == 200
    assert response.json() == []


def test_create_run(client):
    """POST /api/runs creates a new workflow run."""
    payload = {"user_id": 1, "intent": "Deploy staging"}
    response = client.post("/api/runs/", json=payload)
    assert response.status_code == 201

    data = response.json()
    assert data["intent"] == "Deploy staging"
    assert data["user_id"] == 1
    assert data["state"] == "queued"
    assert "id" in data


def test_get_run(client):
    """GET /api/runs/{id} returns the run."""
    create_resp = client.post("/api/runs/", json={"user_id": 1, "intent": "Test"})
    run_id = create_resp.json()["id"]

    response = client.get(f"/api/runs/{run_id}")
    assert response.status_code == 200
    assert response.json()["id"] == run_id


def test_get_run_not_found(client):
    """GET /api/runs/999 returns 404."""
    response = client.get("/api/runs/999")
    assert response.status_code == 404


def test_update_run(client):
    """PATCH /api/runs/{id} updates the run state."""
    create_resp = client.post("/api/runs/", json={"user_id": 1, "intent": "Test"})
    run_id = create_resp.json()["id"]

    response = client.patch(f"/api/runs/{run_id}", json={"state": "executing"})
    assert response.status_code == 200
    assert response.json()["state"] == "executing"


def test_delete_run(client):
    """DELETE /api/runs/{id} removes the run."""
    create_resp = client.post("/api/runs/", json={"user_id": 1, "intent": "Test"})
    run_id = create_resp.json()["id"]

    response = client.delete(f"/api/runs/{run_id}")
    assert response.status_code == 204

    # Verify it's gone
    response = client.get(f"/api/runs/{run_id}")
    assert response.status_code == 404
