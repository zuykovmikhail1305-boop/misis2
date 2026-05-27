import os

from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def save_learning_plan(request, plan_json):
    data = {
        "user_id": request.user_id,
        "title": plan_json["title"],
        "goal": request.goal,
        "level": request.level,
        "duration_weeks": request.duration_weeks,
        "time_per_week": request.time_per_week,
        "preferred_format": request.preferred_format,
        "plan_json": plan_json,
    }

    result = supabase.table("learning_plans").insert(data).execute()
    return result.data[0]


def get_learning_plans(user_id: str | None = None):
    query = (
        supabase
        .table("learning_plans")
        .select("*")
        .order("created_at", desc=True)
    )

    if user_id:
        query = query.eq("user_id", user_id)

    result = query.execute()
    return result.data


def get_learning_plan_by_id(plan_id: str, user_id: str | None = None):
    query = (
        supabase
        .table("learning_plans")
        .select("*")
        .eq("id", plan_id)
    )

    if user_id:
        query = query.eq("user_id", user_id)

    result = query.single().execute()
    return result.data


def delete_learning_plan_by_id(plan_id: str, user_id: str | None = None):
    query = (
        supabase
        .table("learning_plans")
        .delete()
        .eq("id", plan_id)
    )

    if user_id:
        query = query.eq("user_id", user_id)

    result = query.execute()
    return result.data


def update_learning_plan_by_id(
    plan_id: str,
    update_data: dict,
    user_id: str | None = None,
):
    query = (
        supabase
        .table("learning_plans")
        .update(update_data)
        .eq("id", plan_id)
    )

    if user_id:
        query = query.eq("user_id", user_id)

    result = query.execute()
    return result.data


def upsert_task_progress(progress_data: dict):
    result = (
        supabase
        .table("task_progress")
        .upsert(
            progress_data,
            on_conflict="plan_id,week_number,task_index",
        )
        .execute()
    )
    return result.data[0]


def get_task_progress_by_plan_id(plan_id: str):
    result = (
        supabase
        .table("task_progress")
        .select("*")
        .eq("plan_id", plan_id)
        .order("week_number")
        .order("task_index")
        .execute()
    )
    return result.data