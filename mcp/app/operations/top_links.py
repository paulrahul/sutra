DESCRIPTION = "Returns the most visited URLs"

from collections import Counter
from urllib.parse import urlparse, urlunparse

def normalize_url(url: str) -> str:
    """Normalize URL to prevent duplicates from minor variations."""
    try:
        parsed = urlparse(url)
        # Normalize scheme to lowercase
        scheme = parsed.scheme.lower() if parsed.scheme else ''
        # Normalize netloc to lowercase and remove www. prefix
        netloc = parsed.netloc.lower().replace('www.', '') if parsed.netloc else ''
        # Remove trailing slash from path (except for root path)
        path = parsed.path.rstrip('/') if parsed.path and parsed.path != '/' else parsed.path
        # Remove query string and fragment to group URLs that differ only by these
        # This prevents the same page from appearing multiple times with different query params

        # Reconstruct URL without query and fragment
        normalized = urlunparse((scheme, netloc, path, parsed.params, '', ''))
        return normalized
    except Exception:
        # If parsing fails, return original URL
        return url

def handle(request: dict):
    data = request.get("data", [])
    limit = request.get("limit", 5)

    # Normalize URLs before counting to prevent duplicates
    counter = Counter(normalize_url(v["url"]) for v in data)
    return [
        {"url": url, "visit_count": count}
        for url, count in counter.most_common(limit)
    ]
