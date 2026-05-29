from pydantic import BaseModel, field_validator


class CreatePlanRequest(BaseModel):
    goal: str
    level: str
    duration_weeks: int
    time_per_week: int
    preferred_format: str


class WeekPlan(BaseModel):
    week: int
    goal: str
    topics: list[str]
    practice: list[str]

    @field_validator("topics", "practice")
    @classmethod
    def must_not_be_empty(cls, v: list[str]) -> list[str]:
        if not v:
            raise ValueError("список не может быть пустым")
        return v


class LearningPlanResponse(BaseModel):
    title: str
    duration_weeks: int
    weeks: list[WeekPlan]