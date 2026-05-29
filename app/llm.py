import os
import json
import httpx
from pydantic import ValidationError
from app.schemas import CreatePlanRequest, LearningPlanResponse

LM_STUDIO_URL = os.getenv("LM_STUDIO_URL", "http://localhost:1234")
LM_API_TOKEN = os.getenv("LM_API_TOKEN", "lm-studio")
LM_MODEL = os.getenv("LM_MODEL", "qwen/qwen3-8b")
LM_STUDIO_TIMEOUT = float(os.getenv("LM_STUDIO_TIMEOUT", "300"))

SYSTEM_PROMPT = """Ты генератор учебных планов. Твоя задача — создать структурированный план обучения и вернуть ТОЛЬКО валидный JSON без пояснений и markdown-обёрток.

Формат ответа:
{
  "title": "название плана",
  "duration_weeks": 4,
  "weeks": [
    {
      "week": 1,
      "goal": "цель недели",
      "topics": ["тема 1", "тема 2"],
      "practice": ["задание 1", "задание 2"]
    }
  ]
}

Верни ТОЛЬКО JSON, никакого другого текста."""


def generate_learning_plan(request: CreatePlanRequest) -> dict:
    user_prompt = (
        f"Создай план обучения:\n"
        f"- Цель: {request.goal}\n"
        f"- Уровень: {request.level}\n"
        f"- Длительность: {request.duration_weeks} недель\n"
        f"- Времени в неделю: {request.time_per_week} часов\n"
        f"- Формат: {request.preferred_format}\n\n"
        f"Верни ровно {request.duration_weeks} недель в массиве weeks."
    )

    headers = {
        "Authorization": f"Bearer {LM_API_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": LM_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 4096,
    }

    with httpx.Client(timeout=LM_STUDIO_TIMEOUT) as client:
        response = client.post(
            f"{LM_STUDIO_URL}/v1/chat/completions",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()

    content = response.json()["choices"][0]["message"]["content"].strip()

    # Strip markdown code blocks if model wrapped the JSON
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    data = json.loads(content)
    try:
        plan = LearningPlanResponse.model_validate(data)
    except ValidationError as e:
        raise ValueError(f"Модель вернула неверную структуру: {e}") from e

    if len(plan.weeks) != request.duration_weeks:
        raise ValueError(
            f"Ожидали {request.duration_weeks} недель, модель вернула {len(plan.weeks)}"
        )

    return data