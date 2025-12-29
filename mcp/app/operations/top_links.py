DESCRIPTION = "Returns the most visited URLs"

from collections import Counter

def handle(request: dict):
    data = request.get("data", [])
    limit = request.get("limit", 5)

    counter = Counter(v["url"] for v in data)
    return [
        {"url": url, "visit_count": count}
        for url, count in counter.most_common(limit)
    ]
