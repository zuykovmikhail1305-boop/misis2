# AI Learning Planner

Full-stack приложение для генерации персональных планов обучения с помощью LLM.

## Стек

- **Frontend** — HTML/CSS/JS (статика через nginx)
- **Backend** — FastAPI
- **Supabase** — PostgreSQL
- **LM Studio** — локальный LLM-сервер (модель qwen3-8b)
- **Docker** — объединённый запуск frontend + backend

## Структура проекта

```
app/              # FastAPI-бэкенд (API)
frontend/         # Веб-интерфейс
nginx/            # Конфиг nginx для Docker
tests/            # Тесты
docker-compose.yml
Dockerfile        # Образ backend
```

## Запуск через Docker (рекомендуется)

### 1. Настроить переменные окружения

```bash
cp .env.example .env
```

Заполните `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` в `.env`.

### 2. Создать таблицу в Supabase

Выполните SQL из `supabase_schema.sql` в SQL-редакторе Supabase.

### 3. Запустить LM Studio

Откройте LM Studio, загрузите модель `qwen/qwen3-8b` и запустите **Local Server на порту 1235** (порт 1234 занят веб-приложением).

### 4. Запустить приложение

```bash
docker compose up --build
```

Откройте в браузере: [http://localhost:1234](http://localhost:1234)

Swagger API: [http://localhost:1234/docs](http://localhost:1234/docs)

Порт задаётся в `.env` как `WEB_PORT` (по умолчанию **1234**). Сервис слушает только **127.0.0.1**.

Остановка:

```bash
docker compose down
```

## Запуск локально (без Docker)

### Backend

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Swagger: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)

### Frontend

Откройте `frontend/index.html` через локальный HTTP-сервер и укажите в `frontend/app.js`:

```js
const API_BASE_URL = 'http://localhost:8000';
```

Или запустите простой сервер:

```bash
cd frontend
python -m http.server 3000
```

## API

### `POST /plans` — создать план

```json
{
  "goal": "Изучить Python",
  "level": "beginner",
  "duration_weeks": 4,
  "time_per_week": 5,
  "preferred_format": "practice"
}
```

### `GET /plans` — список всех планов

### `GET /plans/{plan_id}` — один план по ID

Подробнее: `API_CONTRACT.md`
