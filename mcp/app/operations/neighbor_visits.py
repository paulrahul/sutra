DESCRIPTION = "Finds visits occurring near another visit"

from datetime import datetime, timedelta

def handle(request: dict):
    data = request.get("data", [])
    anchor = request.get("anchor")
    radius_minutes = request.get("radius_minutes", 30)

    if not anchor:
        return {"error": "anchor field is required"}

    anchor_matches = [
        v for v in data if anchor.get("url_contains", "") in v["url"]
    ]

    if not anchor_matches:
        return {"error": "ANCHOR_NOT_FOUND"}

    anchor_visit = anchor_matches[0]
    t = datetime.fromisoformat(anchor_visit["visited_at"])

    start = t - timedelta(minutes=radius_minutes)
    end = t + timedelta(minutes=radius_minutes)

    neighbors = [
        v for v in data
        if start <= datetime.fromisoformat(v["visited_at"]) <= end
        and v != anchor_visit
    ]

    return {
        "anchor_visit": anchor_visit,
        "neighbors": neighbors
    }
