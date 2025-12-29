from pydantic import BaseModel
from typing import List
from .history import HistoryVisit

class TopLinksRequest(BaseModel):
    data: List[HistoryVisit]
    limit: int = 5
