from fastapi import APIRouter
from app.registry import OPERATION_HANDLERS

router = APIRouter()

@router.post("/mcp")
def handle_mcp(request: dict):
    op = request.get("operation")

    if op not in OPERATION_HANDLERS:
        return {"error": "Unknown operation"}

    # Pass the entire request dict to the handler so it can extract what it needs
    return OPERATION_HANDLERS[op](request)
