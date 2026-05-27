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

Создаёт учебный план и сохраняет его в Supabase.

### Request body

```json
{
  "goal": "Изучить Python",
  "level": "beginner",
  "duration_weeks": 4,
  "time_per_week": 5,
  "preferred_format": "practice",
  "user_id": "user-1"
}
```

`user_id` можно не передавать. Тогда будет использоваться `"demo-user"`.

### Response

```json
{
  "id": "uuid",
  "user_id": "user-1",
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

Возвращает список планов.

Можно получить все планы:

```text
GET /plans
```

Можно получить планы конкретного пользователя:

```text
GET /plans?user_id=user-1
```

### Response

```json
[
  {
    "id": "uuid",
    "user_id": "user-1",
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

Можно передать `user_id`:

```text
GET /plans/{plan_id}?user_id=user-1
```

## PATCH /plans/{plan_id}

Редактирует существующий план.

Можно передать `user_id`:

```text
PATCH /plans/{plan_id}?user_id=user-1
```

### Request body

Можно отправлять только те поля, которые нужно изменить:

```json
{
  "goal": "Изучить Python и FastAPI",
  "level": "intermediate"
}
```

### Response

```json
{
  "message": "Plan updated successfully",
  "plan": {
    "id": "uuid",
    "goal": "Изучить Python и FastAPI",
    "level": "intermediate"
  }
}
```

## DELETE /plans/{plan_id}

Удаляет план по id.

Можно передать `user_id`:

```text
DELETE /plans/{plan_id}?user_id=user-1
```

### Response

```json
{
  "message": "Plan deleted successfully"
}
```

## POST /task-progress

Сохраняет прогресс по конкретному заданию.

### Request body

```json
{
  "plan_id": "uuid",
  "week_number": 1,
  "task_index": 0,
  "is_completed": true
}
```

`week_number` — номер недели.  
`task_index` — индекс задания внутри массива `practice`, начиная с 0.

### Response

```json
{
  "message": "Task progress saved successfully",
  "progress": {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 1,
    "task_index": 0,
    "is_completed": true
  }
}
```

## GET /plans/{plan_id}/progress

Возвращает весь прогресс по конкретному плану.

### Response

```json
[
  {
    "id": "uuid",
    "plan_id": "uuid",
    "week_number": 1,
    "task_index": 0,
    "is_completed": true,
    "created_at": "2026-...",
    "updated_at": "2026-..."
  }
]
```