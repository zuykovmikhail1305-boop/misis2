// API Base URL — пустая строка: запросы идут через nginx на тот же origin
const API_BASE_URL = '';

const planForm = document.getElementById('planForm');
const plansList = document.getElementById('plansList');
const submitBtn = document.getElementById('submitBtn');
const formStatus = document.getElementById('formStatus');

document.addEventListener('DOMContentLoaded', () => {
    if (plansList) {
        loadPlans();
    }
    if (planForm) {
        planForm.addEventListener('submit', onCreatePlan);
        const editId = new URLSearchParams(window.location.search).get('edit');
        if (editId) {
            loadPlanForEdit(editId);
        }
    }
});

async function loadPlanForEdit(planId) {
    const formSection = planForm?.closest('.form-section');
    const formTitle = formSection?.querySelector('h2');
    if (formTitle) formTitle.textContent = 'Редактировать план';
    if (submitBtn) submitBtn.textContent = 'Пересоздать план';
    setFormStatus('Загрузка параметров плана…', 'loading');

    try {
        const response = await fetch(`${API_BASE_URL}/plans/${planId}`);
        if (!response.ok) {
            throw new Error('Не удалось загрузить план для редактирования');
        }
        const plan = await response.json();
        document.getElementById('goal').value = plan.goal || '';
        document.getElementById('level').value = plan.level || '';
        document.getElementById('duration_weeks').value = plan.duration_weeks ?? 4;
        document.getElementById('time_per_week').value = plan.time_per_week ?? 5;
        document.getElementById('preferred_format').value = plan.preferred_format || '';
        setFormStatus('Измените параметры и нажмите «Пересоздать план» — будет создан новый план.', '');
        formSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (error) {
        console.error(error);
        setFormStatus(error.message || 'Не удалось загрузить план.', 'error');
    }
}

function setFormStatus(message, type = '') {
    if (!formStatus) return;
    formStatus.textContent = message;
    formStatus.className = `form-status${type ? ` form-status--${type}` : ''}`;
}

function setFormLoading(loading) {
    if (submitBtn) {
        submitBtn.disabled = loading;
        submitBtn.textContent = loading ? 'Создаём план…' : 'Создать план';
    }
    if (planForm) {
        planForm.querySelectorAll('input, select, button').forEach((el) => {
            if (el !== submitBtn) el.disabled = loading;
        });
    }
}

async function onCreatePlan(e) {
    e.preventDefault();

    const formData = {
        goal: document.getElementById('goal').value.trim(),
        level: document.getElementById('level').value,
        duration_weeks: parseInt(document.getElementById('duration_weeks').value, 10),
        time_per_week: parseInt(document.getElementById('time_per_week').value, 10),
        preferred_format: document.getElementById('preferred_format').value,
    };

    if (!formData.goal || !formData.level || !formData.preferred_format) {
        setFormStatus('Заполните все поля формы.', 'error');
        return;
    }

    setFormLoading(true);
    setFormStatus('Генерируем план с помощью AI. Это может занять 1–2 минуты, не закрывайте страницу…', 'loading');

    try {
        const response = await fetch(`${API_BASE_URL}/plans`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            let detail = `Ошибка сервера (${response.status})`;
            const raw = await response.text();
            try {
                const err = JSON.parse(raw);
                if (err.detail) {
                    detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                }
            } catch (_) {
                if (raw) detail = raw;
            }
            throw new Error(detail);
        }

        const data = await response.json();
        if (!data.id) {
            throw new Error('Сервер не вернул id плана. Проверьте настройки Supabase в .env');
        }

        setFormStatus('План создан! Переходим…', 'success');
        window.location.href = `plan.html?id=${encodeURIComponent(data.id)}`;
    } catch (error) {
        console.error('Error:', error);
        let msg = error.message || 'Не удалось создать план.';
        if (msg.includes('504') || msg.includes('не ответил вовремя')) {
            msg += ' Генерация может занять до 5 минут — попробуйте снова или уменьшите число недель.';
        }
        if (msg.includes('LM Studio') || msg.includes('503')) {
            msg += ' Запустите LM Studio на порту 1235 (см. .env → LM_STUDIO_PORT).';
        }
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
            msg = 'Нет связи с сервером. Убедитесь, что Docker запущен: docker compose up';
        }
        setFormStatus(msg, 'error');
    } finally {
        setFormLoading(false);
    }
}

async function loadPlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/plans`);

        if (!response.ok) {
            let detail = 'Ошибка при загрузке планов';
            try {
                const err = await response.json();
                if (err.detail) {
                    detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                }
            } catch (_) {}
            throw new Error(detail);
        }

        const plans = await response.json();
        renderPlans(plans);
    } catch (error) {
        console.error('Error:', error);
        const hint =
            error.message && error.message.includes('Name or service not known')
                ? ' Проверьте SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в файле .env'
                : '';
        plansList.innerHTML = `<p class="empty">${escapeHtml(error.message || 'Не удалось загрузить планы.')}${escapeHtml(hint)}</p>`;
    }
}

function renderPlans(plans) {
    if (plans.length === 0) {
        plansList.innerHTML = '<p class="empty">У вас пока нет планов обучения. Создайте первый план!</p>';
        return;
    }

    plansList.innerHTML = plans
        .map(
            (plan) => `
        <div class="plan-card">
            <h3>${escapeHtml(plan.title)}</h3>
            <p><strong>Цель:</strong> ${escapeHtml(plan.goal)}</p>
            <p><strong>Уровень:</strong> ${translateLevel(plan.level)}</p>
            <div class="meta">
                <span>📅 ${plan.duration_weeks} нед.</span>
            </div>
            <a href="plan.html?id=${encodeURIComponent(plan.id)}" class="btn-open-plan">Открыть план</a>
        </div>
    `
        )
        .join('');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function translateLevel(level) {
    const levels = {
        beginner: 'Новичок',
        intermediate: 'Средний',
        advanced: 'Продвинутый',
    };
    return levels[level] || level;
}

function translateFormat(format) {
    const formats = {
        video: 'Видеоуроки',
        text: 'Текстовые материалы',
        interactive: 'Интерактивные упражнения',
        mixed: 'Смешанный формат',
    };
    return formats[format] || format;
}
