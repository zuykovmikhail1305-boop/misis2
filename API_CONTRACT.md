# API Contract

Backend URL for local development:

```text
http://127.0.0.1:8000
```

Swagger:

```text
http://127.0.0.1:8000/docs
```

## POST /plans

Создаёт учебный план.

### Request body

```json
{
  "goal": "Изучить Python",
  "level": "beginner",
  "duration_weeks": 4,
  "time_per_week": 5,
  "preferred_format": "practice"
}
```

### Response

```json
{
  "id": "uuid",
  "title": "План обучения: Изучить Python",
  "duration_weeks": 4,
  "weeks": [
    {
      "week": 1,
      "goal": "Разобраться с базовыми понятиями",
      "topics": ["Что такое API", "Что такое backend"],
      "practice": ["Создать первый endpoint"]
    }
  ],
  "created_at": "2026-..."
}
```

## GET /plans

Возвращает список всех планов.

### Response

```json
[
  {
    "id": "uuid",
    "title": "План обучения: Изучить Python",
    "goal": "Изучить Python",
    "level": "beginner",
    "duration_weeks": 4,
    "created_at": "2026-..."
  }
]
```

## GET /plans/{plan_id}

Возвращает один полный план по id.

## DELETE /plans/{plan_id}

Удаляет план по id.

### Response

```json
{
  "ok": true,
  "id": "uuid"
}
```

### Ошибки

- `404` — план не найден