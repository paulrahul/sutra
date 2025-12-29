from app.operations import top_links, top_domains_by_day, neighbor_visits, list_operations

OPERATION_HANDLERS = {
    "top_links": top_links.handle,
    "top_domains_by_day": top_domains_by_day.handle,
    "neighbor_visits": neighbor_visits.handle,
    "list_operations": list_operations.handle
}

OPERATION_METADATA = {
    "top_links": top_links.DESCRIPTION,
    "top_domains_by_day": top_domains_by_day.DESCRIPTION,
    "neighbor_visits": neighbor_visits.DESCRIPTION,
    "list_operations": "Lists all available MCP operations"
}
