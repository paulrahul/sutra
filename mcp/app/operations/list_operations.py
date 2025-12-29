def handle(request: dict = None):
    from app.registry import OPERATION_HANDLERS, OPERATION_METADATA

    return {
        "operations": [
            {
                "name": name,
                "description": OPERATION_METADATA.get(name, "")
            }
            for name in OPERATION_HANDLERS.keys()
        ]
    }
