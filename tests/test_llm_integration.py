"""
Интеграционный тест — реальный вызов LM Studio.
Требует: запущенный LM Studio с загруженной моделью qwen/qwen3-8b.
Запуск: pytest tests/test_llm_integration.py -v -s
"""
import pytest
from app.schemas import CreatePlanRequest
from app.llm import generate_learning_plan, LM_STUDIO_URL
import httpx


def lm_studio_available() -> bool:
    try:
        r = httpx.get(f"{LM_STUDIO_URL}/v1/models", timeout=3)
        return r.status_code == 200
    except Exception:
        return False


skip_if_no_lm = pytest.mark.skipif(
    not lm_studio_available(),
    reason="LM Studio не запущен на localhost:1234",
)


@skip_if_no_lm
def test_real_model_returns_valid_json():
    """Модель возвращает парсируемый JSON с нужными полями."""
    request = CreatePlanRequest(
        goal="Выучить основы Python",
        level="beginner",
        duration_weeks=2,
        time_per_week=4,
        preferred_format="видео",
    )

    result = generate_learning_plan(request)

    assert isinstance(result, dict), "Ответ должен быть словарём"
    assert "title" in result, "Нет поля title"
    assert "duration_weeks" in result, "Нет поля duration_weeks"
    assert "weeks" in result, "Нет поля weeks"
    assert isinstance(result["weeks"], list), "weeks должен быть списком"
    assert len(result["weeks"]) > 0, "weeks не должен быть пустым"


@skip_if_no_lm
def test_real_model_week_structure():
    """Каждая неделя содержит обязательные поля нужных типов."""
    request = CreatePlanRequest(
        goal="Изучить SQL",
        level="beginner",
        duration_weeks=2,
        time_per_week=3,
        preferred_format="текст",
    )

    result = generate_learning_plan(request)

    for week in result["weeks"]:
        assert "week" in week, f"Нет поля week: {week}"
        assert "goal" in week, f"Нет поля goal: {week}"
        assert "topics" in week, f"Нет поля topics: {week}"
        assert "practice" in week, f"Нет поля practice: {week}"
        assert isinstance(week["topics"], list), "topics должен быть списком"
        assert isinstance(week["practice"], list), "practice должен быть списком"
        assert len(week["topics"]) > 0, "topics не должен быть пустым"
        assert len(week["practice"]) > 0, "practice не должен быть пустым"


@skip_if_no_lm
def test_real_model_respects_week_count():
    """Модель генерирует ровно столько недель, сколько запрошено."""
    request = CreatePlanRequest(
        goal="Основы машинного обучения",
        level="intermediate",
        duration_weeks=3,
        time_per_week=6,
        preferred_format="практика",
    )

    result = generate_learning_plan(request)

    assert len(result["weeks"]) == 3, (
        f"Ожидали 3 недели, получили {len(result['weeks'])}"
    )
