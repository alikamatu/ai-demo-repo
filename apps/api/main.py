"""Life OS API — application entrypoint.

Start with:
    uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

from app import create_app

app = create_app()
