from pydantic import BaseModel

class TopLink(BaseModel):
    url: str
    visit_count: int
