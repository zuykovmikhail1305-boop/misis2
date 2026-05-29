import json
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.schemas import CreatePlanRequest
from app.llm import generate_learning_plan
from app.db import save_learning_plan, get_learning_plans, get_learning_plan_by_id, delete_learning_plan

app = FastAPI(title="AI Learning Planner API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # для MVP можно так
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Backend is running"}


@app.post("/plans")
def create_plan(request: CreatePlanRequest):
    try:
        plan_json = generate_learning_plan(request)
    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail="LM Studio недоступен. Убедитесь что сервер запущен на localhost:1234")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="LM Studio не ответил вовремя. Попробуйте снова")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=502, detail=f"Ошибка от LM Studio: {e.response.status_code}")
    except json.JSONDecodeError:
        raise HTTPException(status_code=502, detail="Модель вернула некорректный ответ. Попробуйте снова")
    except ValueError as e:
        raise HTTPException(status_code=502, detail=str(e))

    try:
        saved_plan = save_learning_plan(request, plan_json)
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Не удалось подключиться к Supabase. Проверьте SUPABASE_URL в .env или включите USE_LOCAL_DB=true",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка сохранения плана: {e}") from e

    return {
        "id": saved_plan["id"],
        "title": plan_json["title"],
        "duration_weeks": plan_json["duration_weeks"],
        "weeks": plan_json["weeks"],
        "created_at": saved_plan["created_at"],
    }


@app.get("/plans")
def list_plans():
    try:
        plans = get_learning_plans()
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Не удалось подключиться к Supabase. Проверьте SUPABASE_URL в .env или включите USE_LOCAL_DB=true",
        )

    return [
        {
            "id": plan["id"],
            "title": plan["title"],
            "goal": plan["goal"],
            "level": plan["level"],
            "duration_weeks": plan["duration_weeks"],
            "created_at": plan["created_at"],
        }
        for plan in plans
    ]
@app.get("/plans/{plan_id}")
def get_plan(plan_id: str):
    plan = get_learning_plan_by_id(plan_id)

    if plan is None:
        raise HTTPException(status_code=404, detail=f"План {plan_id} не найден")

    return {
        "id": plan["id"],
        "title": plan["title"],
        "goal": plan["goal"],
        "level": plan["level"],
        "duration_weeks": plan["duration_weeks"],
        "time_per_week": plan["time_per_week"],
        "preferred_format": plan["preferred_format"],
        "plan_json": plan["plan_json"],
        "created_at": plan["created_at"],
    }


@app.delete("/plans/{plan_id}")
def delete_plan(plan_id: str):
    try:
        deleted = delete_learning_plan(plan_id)
    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Не удалось подключиться к Supabase. Проверьте SUPABASE_URL в .env или включите USE_LOCAL_DB=true",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка удаления плана: {e}") from e

    if not deleted:
        raise HTTPException(status_code=404, detail=f"План {plan_id} не найден")

    return {"ok": True, "id": plan_id}