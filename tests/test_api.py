"""
Тесты API — проверка обработки ошибок.
Запуск: pytest tests/test_api.py -v
"""
import json
import pytest
import httpx
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_get_plan_not_found():
    """GET /plans/{id} с несуществующим id возвращает 404."""
    with patch("app.main.get_learning_plan_by_id", return_value=None):
        response = client.get("/plans/nonexistent-id")

    assert response.status_code == 404
    assert "не найден" in response.json()["detail"]


def test_create_plan_lm_studio_unavailable():
    """POST /plans когда LM Studio недоступен возвращает 503."""
    with patch("app.main.generate_learning_plan", side_effect=httpx.ConnectError("refused")):
        response = client.post("/plans", json={
            "goal": "Выучить Python",
            "level": "beginner",
            "duration_weeks": 2,
            "time_per_week": 4,
            "preferred_format": "видео",
        })

    assert response.status_code == 503
    assert "LM Studio" in response.json()["detail"]


def test_create_plan_lm_studio_timeout():
    """POST /plans при таймауте LM Studio возвращает 504."""
    with patch("app.main.generate_learning_plan", side_effect=httpx.TimeoutException("timeout")):
        response = client.post("/plans", json={
            "goal": "Выучить Python",
            "level": "beginner",
            "duration_weeks": 2,
            "time_per_week": 4,
            "preferred_format": "видео",
        })

    assert response.status_code == 504


def test_create_plan_bad_json_from_model():
    """POST /plans когда модель вернула не JSON возвращает 502."""
    with patch("app.main.generate_learning_plan", side_effect=json.JSONDecodeError("err", "", 0)):
        response = client.post("/plans", json={
            "goal": "Выучить Python",
            "level": "beginner",
            "duration_weeks": 2,
            "time_per_week": 4,
            "preferred_format": "видео",
        })

    assert response.status_code == 502


def test_create_plan_missing_fields():
    """POST /plans без обязательных полей возвращает 422."""
    response = client.post("/plans", json={"goal": "Выучить Python"})

    assert response.status_code == 422


def test_create_plan_invalid_llm_structure():
    """POST /plans когда модель вернула JSON без нужных полей возвращает 502."""
    with patch("app.main.generate_learning_plan", side_effect=ValueError("Модель вернула неверную структуру")):
        response = client.post("/plans", json={
            "goal": "Выучить Python",
            "level": "beginner",
            "duration_weeks": 2,
            "time_per_week": 4,
            "preferred_format": "видео",
        })

    assert response.status_code == 502
    assert "структуру" in response.json()["detail"]


def test_create_plan_wrong_week_count():
    """POST /plans когда модель вернула неверное число недель возвращает 502."""
    with patch("app.main.generate_learning_plan", side_effect=ValueError("Ожидали 4 недель, модель вернула 2")):
        response = client.post("/plans", json={
            "goal": "Выучить Python",
            "level": "beginner",
            "duration_weeks": 4,
            "time_per_week": 4,
            "preferred_format": "видео",
        })

    assert response.status_code == 502
    assert "недель" in response.json()["detail"]
