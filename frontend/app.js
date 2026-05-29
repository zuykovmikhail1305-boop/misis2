// API Base URL
const API_BASE_URL = 'http://localhost:8000';

// DOM Elements
const planForm = document.getElementById('planForm');
const plansList = document.getElementById('plansList');
const planModal = document.getElementById('planModal');
const planDetails = document.getElementById('planDetails');
const closeBtn = document.querySelector('.close-btn');

// Load plans on page load
document.addEventListener('DOMContentLoaded', loadPlans);

// Form submission
planForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        goal: document.getElementById('goal').value,
        level: document.getElementById('level').value,
        duration_weeks: parseInt(document.getElementById('duration_weeks').value),
        time_per_week: parseInt(document.getElementById('time_per_week').value),
        preferred_format: document.getElementById('preferred_format').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            throw new Error('Ошибка при создании плана');
        }
        
        const data = await response.json();
        alert('План успешно создан!');
        planForm.reset();
        loadPlans();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при создании плана. Убедитесь, что сервер запущен.');
    }
});

// Load all plans
async function loadPlans() {
    try {
        const response = await fetch(`${API_BASE_URL}/plans`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке планов');
        }
        
        const plans = await response.json();
        renderPlans(plans);
        
    } catch (error) {
        console.error('Error:', error);
        plansList.innerHTML = '<p class="empty">Не удалось загрузить планы. Убедитесь, что сервер запущен.</p>';
    }
}

// Render plans list
function renderPlans(plans) {
    if (plans.length === 0) {
        plansList.innerHTML = '<p class="empty">У вас пока нет планов обучения. Создайте первый план!</p>';
        return;
    }
    
    plansList.innerHTML = plans.map(plan => `
        <div class="plan-card" onclick="loadPlanDetails('${plan.id}')">
            <h3>${escapeHtml(plan.title)}</h3>
            <p><strong>Цель:</strong> ${escapeHtml(plan.goal)}</p>
            <p><strong>Уровень:</strong> ${translateLevel(plan.level)}</p>
            <div class="meta">
                <span>📅 ${plan.duration_weeks} нед.</span>
                <span>⏱️ ${plan.time_per_week} ч/нед</span>
            </div>
        </div>
    `).join('');
}

// Load plan details
async function loadPlanDetails(planId) {
    try {
        const response = await fetch(`${API_BASE_URL}/plans/${planId}`);
        
        if (!response.ok) {
            throw new Error('Ошибка при загрузке деталей плана');
        }
        
        const plan = await response.json();
        renderPlanDetails(plan);
        openModal();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при загрузке деталей плана.');
    }
}

// Render plan details
function renderPlanDetails(plan) {
    const planJson = plan.plan_json;
    
    let weeksHtml = '';
    if (planJson.weeks && Array.isArray(planJson.weeks)) {
        weeksHtml = planJson.weeks.map((week, index) => `
            <div class="week-section">
                <h3>Неделя ${index + 1}</h3>
                <ul>
                    ${week.tasks ? week.tasks.map(task => `<li>${escapeHtml(task)}</li>`).join('') : ''}
                </ul>
            </div>
        `).join('');
    }
    
    planDetails.innerHTML = `
        <div class="plan-details">
            <h2>${escapeHtml(planJson.title || plan.title)}</h2>
            
            <div class="plan-info">
                <p><strong>🎯 Цель:</strong> ${escapeHtml(plan.goal)}</p>
                <p><strong>📊 Уровень:</strong> ${translateLevel(plan.level)}</p>
                <p><strong>📅 Длительность:</strong> ${plan.duration_weeks} недель</p>
                <p><strong>⏱️ Время в неделю:</strong> ${plan.time_per_week} часов</p>
                <p><strong>📚 Формат:</strong> ${translateFormat(plan.preferred_format)}</p>
                <p><strong>📆 Создан:</strong> ${new Date(plan.created_at).toLocaleDateString('ru-RU')}</p>
            </div>
            
            <h3 style="color: var(--primary-accent); margin-bottom: 15px;">План по неделям</h3>
            ${weeksHtml}
        </div>
    `;
}

// Modal functions
function openModal() {
    planModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    planModal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking on X
closeBtn.addEventListener('click', closeModal);

// Close modal when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === planModal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && planModal.style.display === 'block') {
        closeModal();
    }
});

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function translateLevel(level) {
    const levels = {
        'beginner': 'Новичок',
        'intermediate': 'Средний',
        'advanced': 'Продвинутый'
    };
    return levels[level] || level;
}

function translateFormat(format) {
    const formats = {
        'video': 'Видеоуроки',
        'text': 'Текстовые материалы',
        'interactive': 'Интерактивные упражнения',
        'mixed': 'Смешанный формат'
    };
    return formats[format] || format;
}
