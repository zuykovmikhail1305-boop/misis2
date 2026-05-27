from typing import Optional

from pydantic import BaseModel


class CreatePlanRequest(BaseModel):
    goal: str
    level: str
    duration_weeks: int
    time_per_week: int
    preferred_format: str
    user_id: Optional[str] = "demo-user"


class UpdatePlanRequest(BaseModel):
    goal: Optional[str] = None
    level: Optional[str] = None
    duration_weeks: Optional[int] = None
    time_per_week: Optional[int] = None
    preferred_format: Optional[str] = None
    plan_json: Optional[dict] = None


class TaskProgressRequest(BaseModel):
    plan_id: str
    week_number: int
    task_index: int
    is_completed: bool