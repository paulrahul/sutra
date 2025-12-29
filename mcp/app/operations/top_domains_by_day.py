DESCRIPTION = "Returns most visited domains for a given day"

from urllib.parse import urlparse
from datetime import datetime

def handle(request: dict):
    data = request.get("data", [])
    date = request.get("date")

    if not date:
        return {"error": "date field is required"}

    counts = {}
    for v in data:
        ts = datetime.fromisoformat(v["visited_at"])
        if ts.date().isoformat() != date:
            continue
        domain = urlparse(v["url"]).netloc
        counts[domain] = counts.get(domain, 0) + 1

    return sorted(
        [{"domain": k, "visit_count": v} for k, v in counts.items()],
        key=lambda x: x["visit_count"],
        reverse=True
    )
