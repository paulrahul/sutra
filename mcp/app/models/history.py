from pydantic import BaseModel
from datetime import datetime

class HistoryVisit(BaseModel):
    url: str
    visited_at: datetime
