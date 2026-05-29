import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
LOCAL_DB_PATH = Path(os.getenv("LOCAL_DB_PATH", "data/plans.json"))


def _use_local_db() -> bool:
    if os.getenv("USE_LOCAL_DB", "").lower() in ("1", "true", "yes"):
        return True
    url = SUPABASE_URL or ""
    return "your-project" in url


USE_LOCAL_DB = _use_local_db()

if USE_LOCAL_DB:
    supabase = None
    LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
elif not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env")
else:
    from supabase import create_client

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


def _local_load() -> list[dict]:
    if not LOCAL_DB_PATH.exists():
        return []
    with LOCAL_DB_PATH.open(encoding="utf-8") as f:
        return json.load(f)


def _local_save_all(plans: list[dict]) -> None:
    LOCAL_DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOCAL_DB_PATH.open("w", encoding="utf-8") as f:
        json.dump(plans, f, ensure_ascii=False, indent=2)


def save_learning_plan(request, plan_json):
    data = {
        "title": plan_json["title"],
        "goal": request.goal,
        "level": request.level,
        "duration_weeks": request.duration_weeks,
        "time_per_week": request.time_per_week,
        "preferred_format": request.preferred_format,
        "plan_json": plan_json,
    }

    if USE_LOCAL_DB:
        plans = _local_load()
        row = {
            "id": str(uuid.uuid4()),
            "user_id": "demo-user",
            "created_at": datetime.now(timezone.utc).isoformat(),
            **data,
        }
        plans.insert(0, row)
        _local_save_all(plans)
        return row

    result = supabase.table("learning_plans").insert(data).execute()
    return result.data[0]


def get_learning_plans():
    if USE_LOCAL_DB:
        return _local_load()

    result = (
        supabase.table("learning_plans")
        .select("*")
        .order("created_at", desc=True)
        .execute()
    )
    return result.data


def get_learning_plan_by_id(plan_id: str):
    if USE_LOCAL_DB:
        for plan in _local_load():
            if plan["id"] == plan_id:
                return plan
        return None

    try:
        result = (
            supabase.table("learning_plans")
            .select("*")
            .eq("id", plan_id)
            .single()
            .execute()
        )
        return result.data
    except Exception:
        return None


def delete_learning_plan(plan_id: str) -> bool:
    if USE_LOCAL_DB:
        plans = _local_load()
        filtered = [p for p in plans if p["id"] != plan_id]
        if len(filtered) == len(plans):
            return False
        _local_save_all(filtered)
        return True

    result = (
        supabase.table("learning_plans")
        .delete()
        .eq("id", plan_id)
        .execute()
    )
    return bool(result.data)
