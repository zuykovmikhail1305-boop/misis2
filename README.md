# AI Learning Planner Backend

Backend для AI-сервиса, который строит индивидуальный учебный план.

## Стек

- Python
- FastAPI
- Supabase
- Uvicorn

## Как запустить проект

### 1. Создать виртуальное окружение

```bash
python -m venv .venv
```

### 2. Активировать окружение

Windows PowerShell:

```bash
.\.venv\Scripts\Activate.ps1
```

Если PowerShell блокирует запуск скриптов:

```bash
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\.venv\Scripts\Activate.ps1
```

### 3. Установить зависимости

```bash
pip install -r requirements.txt
```

### 4. Создать `.env`

Создать файл `.env` по примеру `.env.example`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 5. Запустить backend

```bash
python -m uvicorn app.main:app --reload
```

После запуска Swagger доступен здесь:

```text
http://127.0.0.1:8000/docs
```

## Endpoints

### Plans

- `POST /plans` — создать учебный план
- `GET /plans` — получить список планов
- `GET /plans?user_id=user-1` — получить планы конкретного пользователя
- `GET /plans/{plan_id}` — получить один план по id
- `PATCH /plans/{plan_id}` — редактировать план
- `DELETE /plans/{plan_id}` — удалить план

### Progress

- `POST /task-progress` — сохранить прогресс по заданию
- `GET /plans/{plan_id}/progress` — получить прогресс по плану

## Сейчас реализовано

- FastAPI backend
- подключение к Supabase
- создание учебного плана
- получение списка планов
- получение одного плана по id
- редактирование плана
- удаление плана
- сохранение прогресса по заданиям
- простая привязка планов к `user_id`
- CORS для подключения frontend
- fake LLM генерация в `app/fake_llm.py`

## Пока не реализовано

- настоящая авторизация через логин/пароль
- настоящий вызов OpenRouter вместо fake LLM

## LLM-интеграция

Сейчас генерация плана фейковая и находится в файле:

```text
app/fake_llm.py
```

LLM-разработчик может заменить функцию `generate_fake_learning_plan()` на реальный вызов OpenRouter.

Важно: формат ответа должен остаться таким же, чтобы frontend не пришлось менять.