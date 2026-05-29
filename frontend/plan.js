const API_BASE_URL = '';
const PROGRESS_STORAGE_KEY = 'learning-plan-progress';

const planMain = document.getElementById('planMain');
const planTitleEl = document.getElementById('planTitle');
const planSubtitleEl = document.getElementById('planSubtitle');
const editPlanBtn = document.getElementById('editPlanBtn');
const deletePlanBtn = document.getElementById('deletePlanBtn');

let currentPlan = null;

document.addEventListener('DOMContentLoaded', () => {
    const planId = new URLSearchParams(window.location.search).get('id');
    if (!planId) {
        showError('Не указан id плана. Вернитесь на главную и выберите план.');
        return;
    }
    if (editPlanBtn) {
        editPlanBtn.href = `index.html?edit=${encodeURIComponent(planId)}`;
        editPlanBtn.hidden = false;
    }
    if (deletePlanBtn) {
        deletePlanBtn.hidden = false;
        deletePlanBtn.addEventListener('click', () => deletePlan(planId));
    }
    loadPlan(planId);
});

async function loadPlan(planId) {
    try {
        const response = await fetch(`${API_BASE_URL}/plans/${planId}`);
        if (!response.ok) {
            let detail = 'План не найден';
            try {
                const err = await response.json();
                if (err.detail) {
                    detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                }
            } catch (_) {}
            throw new Error(detail);
        }
        currentPlan = await response.json();
        document.title = `${currentPlan.plan_json?.title || currentPlan.title} — AI Learning Planner`;
        planTitleEl.textContent = currentPlan.plan_json?.title || currentPlan.title;
        planSubtitleEl.textContent = currentPlan.goal;
        renderFullPlan(currentPlan);
    } catch (error) {
        console.error(error);
        showError(error.message || 'Не удалось загрузить план.');
    }
}

function showError(message) {
    planMain.innerHTML = `<section class="card"><p class="empty">${escapeHtml(message)}</p><a href="index.html" class="btn-secondary">На главную</a></section>`;
}

async function deletePlan(planId) {
    if (!confirm('Удалить этот план? Действие нельзя отменить.')) {
        return;
    }

    if (deletePlanBtn) {
        deletePlanBtn.disabled = true;
        deletePlanBtn.textContent = 'Удаление…';
    }
    if (editPlanBtn) {
        editPlanBtn.setAttribute('aria-disabled', 'true');
        editPlanBtn.style.pointerEvents = 'none';
        editPlanBtn.style.opacity = '0.6';
    }

    try {
        const response = await fetch(`${API_BASE_URL}/plans/${encodeURIComponent(planId)}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            let detail = 'Не удалось удалить план';
            try {
                const err = await response.json();
                if (err.detail) {
                    detail = typeof err.detail === 'string' ? err.detail : JSON.stringify(err.detail);
                }
            } catch (_) {}
            throw new Error(detail);
        }

        const store = getProgressStore();
        delete store[planId];
        saveProgressStore(store);

        window.location.href = 'index.html';
    } catch (error) {
        console.error(error);
        alert(error.message || 'Не удалось удалить план.');
        if (deletePlanBtn) {
            deletePlanBtn.disabled = false;
            deletePlanBtn.textContent = 'Удалить план';
        }
        if (editPlanBtn) {
            editPlanBtn.removeAttribute('aria-disabled');
            editPlanBtn.style.pointerEvents = '';
            editPlanBtn.style.opacity = '';
        }
    }
}

function getProgressStore() {
    try {
        return JSON.parse(localStorage.getItem(PROGRESS_STORAGE_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveProgressStore(store) {
    localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(store));
}

function getPlanProgress(planId) {
    const store = getProgressStore();
    return store[planId] || {};
}

function setTaskDone(planId, taskId, done) {
    const store = getProgressStore();
    if (!store[planId]) store[planId] = {};
    if (done) {
        store[planId][taskId] = true;
    } else {
        delete store[planId][taskId];
    }
    saveProgressStore(store);
}

function collectTasks(plan) {
    const planId = plan.id;
    const weeks = plan.plan_json?.weeks || [];
    const tasks = [];

    weeks.forEach((week, weekIndex) => {
        const weekNum = week.week ?? weekIndex + 1;

        if (week.goal) {
            tasks.push({
                id: `${planId}:w${weekIndex}:goal`,
                weekNum,
                section: 'goal',
                sectionLabel: 'Цель недели',
                text: week.goal,
            });
        }

        (week.topics || []).forEach((topic, i) => {
            tasks.push({
                id: `${planId}:w${weekIndex}:topic:${i}`,
                weekNum,
                section: 'topics',
                sectionLabel: 'Темы',
                text: topic,
            });
        });

        (week.practice || []).forEach((item, i) => {
            tasks.push({
                id: `${planId}:w${weekIndex}:practice:${i}`,
                weekNum,
                section: 'practice',
                sectionLabel: 'Практика',
                text: item,
            });
        });
    });

    return tasks;
}

function calcProgress(tasks, progress) {
    if (tasks.length === 0) {
        return { percent: 0, done: 0, total: 0 };
    }
    const done = tasks.filter((t) => progress[t.id]).length;
    const total = tasks.length;
    const percent = Math.round((done / total) * 100);
    return { percent, done, total };
}

function renderFullPlan(plan) {
    const tasks = collectTasks(plan);
    const progress = getPlanProgress(plan.id);
    const { percent, done, total } = calcProgress(tasks, progress);

    const weeks = plan.plan_json?.weeks || [];
    const weeksByIndex = new Map();
    tasks.forEach((task) => {
        const key = task.weekNum;
        if (!weeksByIndex.has(key)) {
            weeksByIndex.set(key, { weekNum: key, sections: new Map() });
        }
        const weekBlock = weeksByIndex.get(key);
        if (!weekBlock.sections.has(task.section)) {
            weekBlock.sections.set(task.section, { label: task.sectionLabel, items: [] });
        }
        weekBlock.sections.get(task.section).items.push(task);
    });

    let weeksHtml = '';
    weeksByIndex.forEach((weekBlock) => {
        let sectionsHtml = '';
        weekBlock.sections.forEach((section) => {
            const itemsHtml = section.items
                .map((task) => renderTaskCheckbox(task, progress[task.id]))
                .join('');
            sectionsHtml += `
                <div class="plan-section">
                    <h4>${escapeHtml(section.label)}</h4>
                    <ul class="task-list">${itemsHtml}</ul>
                </div>
            `;
        });

        weeksHtml += `
            <section class="week-block card-inner">
                <h3 class="week-title">Неделя ${weekBlock.weekNum}</h3>
                ${sectionsHtml}
            </section>
        `;
    });

    if (!weeksHtml && weeks.length === 0) {
        weeksHtml = '<p class="empty">В плане нет пунктов для отметки.</p>';
    }

    planMain.innerHTML = `
        <section class="card plan-page-card">
            <div class="plan-meta">
                <p><strong>Уровень:</strong> ${escapeHtml(translateLevel(plan.level))}</p>
                <p><strong>Длительность:</strong> ${plan.duration_weeks} нед.</p>
                <p><strong>Часов в неделю:</strong> ${plan.time_per_week}</p>
                <p><strong>Формат:</strong> ${escapeHtml(translateFormat(plan.preferred_format))}</p>
                <p><strong>Создан:</strong> ${new Date(plan.created_at).toLocaleDateString('ru-RU')}</p>
            </div>

            <div class="progress-block" id="progressBlock">
                <div class="progress-header">
                    <span class="progress-label">Прогресс выполнения</span>
                    <span class="progress-percent" id="progressPercent">${percent}%</span>
                </div>
                <div class="progress-track" role="progressbar" aria-valuenow="${percent}" aria-valuemin="0" aria-valuemax="100">
                    <div class="progress-fill" id="progressFill" style="width: ${percent}%"></div>
                </div>
                <p class="progress-stats" id="progressStats">${done} из ${total} пунктов выполнено</p>
            </div>

            <h2 class="plan-sections-title">План по неделям</h2>
            <div class="weeks-container">${weeksHtml}</div>

            <button type="button" class="btn-secondary btn-reset-progress" id="resetProgressBtn">
                Сбросить прогресс
            </button>
        </section>
    `;

    planMain.querySelectorAll('.task-checkbox').forEach((input) => {
        input.addEventListener('change', onTaskToggle);
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
        if (!confirm('Сбросить все отметки по этому плану?')) return;
        const store = getProgressStore();
        delete store[plan.id];
        saveProgressStore(store);
        renderFullPlan(plan);
    });
}

function renderTaskCheckbox(task, checked) {
    const doneClass = checked ? ' task-item--done' : '';
    return `
        <li>
            <label class="task-item${doneClass}">
                <input
                    type="checkbox"
                    class="task-checkbox"
                    data-task-id="${escapeHtml(task.id)}"
                    ${checked ? 'checked' : ''}
                >
                <span class="task-text">${escapeHtml(task.text)}</span>
            </label>
        </li>
    `;
}

function onTaskToggle(event) {
    const input = event.target;
    const taskId = input.dataset.taskId;
    const done = input.checked;

    setTaskDone(currentPlan.id, taskId, done);

    const label = input.closest('.task-item');
    label.classList.toggle('task-item--done', done);

    const tasks = collectTasks(currentPlan);
    const progress = getPlanProgress(currentPlan.id);
    const { percent, done: doneCount, total } = calcProgress(tasks, progress);

    document.getElementById('progressPercent').textContent = `${percent}%`;
    document.getElementById('progressFill').style.width = `${percent}%`;
    document.getElementById('progressStats').textContent = `${doneCount} из ${total} пунктов выполнено`;

    const track = document.querySelector('.progress-track');
    track.setAttribute('aria-valuenow', String(percent));
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
        practice: 'Практика',
    };
    return formats[format] || format;
}
