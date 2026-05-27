# TODO:
# сейчас это фейковая генерация плана
# ллм должен заменить эту функцию на реальный вызов OpenRouter.
# !!!!!!!функция должна возвращать такой же JSON-формат:
# {
#   "title": "...",
#   "duration_weeks": 4,
#   "weeks": [
#       {
#           "week": 1,
#           "goal": "...",
#           "topics": [...],
#           "practice": [...]
#       }
#   ]
# }
def generate_fake_learning_plan(user_input):
    return {
        "title": f"План обучения: {user_input.goal}",
        "duration_weeks": user_input.duration_weeks,
        "weeks": [
            {
                "week": 1,
                "goal": "Разобраться с базовыми понятиями",
                "topics": [
                    "Что такое API",
                    "Что такое backend",
                    "Что такое FastAPI"
                ],
                "practice": [
                    "Установить FastAPI",
                    "Создать первый endpoint",
                    "Запустить сервер локально"
                ]
            },
            {
                "week": 2,
                "goal": "Научиться принимать данные от пользователя",
                "topics": [
                    "POST-запросы",
                    "JSON",
                    "Pydantic-схемы"
                ],
                "practice": [
                    "Отправить запрос через Swagger",
                    "Получить тестовый учебный план"
                ]
            }
        ]
    }