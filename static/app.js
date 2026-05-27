// AI Learning Planner - Frontend JavaScript

const API_BASE_URL = '';

let currentUserId = 'demo-user';
let currentPlanId = null;

// Show alert message
function showAlert(message, type = 'success') {
    const container = document.getElementById('alert-container');
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    container.appendChild(alertDiv);
    
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Show/hide sections
function showSection(sectionName) {
    document.getElementById('create-plan-section').classList.add('hidden');
    document.getElementById('my-plans-section').classList.add('hidden');
    document.getElementById('plan-detail-section').classList.add('hidden');
    
    if (sectionName === 'create-plan') {
        document.getElementById('create-plan-section').classList.remove('hidden');
    } else if (sectionName === 'my-plans') {
        document.getElementById('my-plans-section').classList.remove('hidden');
        loadPlans();
    } else if (sectionName === 'plan-detail') {
        document.getElementById('plan-detail-section').classList.remove('hidden');
    }
}

// Load all plans
async function loadPlans() {
    const plansList = document.getElementById('plans-list');
    plansList.innerHTML = '<div class="loading">Загрузка планов...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/plans?user_id=${currentUserId}`);
        const plans = await response.json();
        
        if (plans.length === 0) {
            plansList.innerHTML = '<p>У вас пока нет учебных планов. Создайте первый!</p>';
            return;
        }
        
        plansList.innerHTML = '';
        plans.forEach(plan => {
            const card = document.createElement('div');
            card.className = 'card';
            card.innerHTML = `
                <h3>${escapeHtml(plan.title)}</h3>
                <p><strong>Цель:</strong> ${escapeHtml(plan.goal)}</p>
                <p><strong>Уровень:</strong> ${getLevelName(plan.level)}</p>
                <p><strong>Длительность:</strong> ${plan.duration_weeks} недель</p>
                <p><strong>Создан:</strong> ${new Date(plan.created_at).toLocaleDateString('ru-RU')}</p>
                <div class="card-actions">
                    <button onclick="viewPlan('${plan.id}')" class="btn btn-primary btn-small">Просмотр</button>
                    <button onclick="deletePlan('${plan.id}')" class="btn btn-danger btn-small">Удалить</button>
                </div>
            `;
            plansList.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading plans:', error);
        plansList.innerHTML = '<p class="alert alert-error">Ошибка загрузки планов</p>';
    }
}

// View plan details
async function viewPlan(planId) {
    currentPlanId = planId;
    showSection('plan-detail');
    
    const content = document.getElementById('plan-detail-content');
    content.innerHTML = '<div class="loading">Загрузка плана...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/plans/${planId}?user_id=${currentUserId}`);
        const plan = await response.json();
        
        let progress = [];
        try {
            const progressResponse = await fetch(`${API_BASE_URL}/plans/${planId}/progress`);
            progress = await progressResponse.json();
        } catch (e) {
            console.log('No progress data available');
        }
        
        const completedTasks = new Set(
            progress.filter(p => p.is_completed).map(p => `${p.week_number}-${p.task_index}`)
        );
        
        let weeksHtml = '';
        plan.plan_json.weeks.forEach((week, weekIndex) => {
            const weekNumber = weekIndex + 1;
            let tasksHtml = '';
            
            if (week.practice && week.practice.length > 0) {
                week.practice.forEach((task, taskIndex) => {
                    const taskId = `${weekNumber}-${taskIndex}`;
                    const isCompleted = completedTasks.has(taskId);
                    tasksHtml += `
                        <div class="task-item ${isCompleted ? 'completed' : ''}">
                            <input type="checkbox" 
                                   onchange="toggleTaskProgress(${weekNumber}, ${taskIndex}, this.checked)" 
                                   ${isCompleted ? 'checked' : ''}>
                            <span>${escapeHtml(task)}</span>
                        </div>
                    `;
                });
            }
            
            let topicsHtml = '';
            if (week.topics && week.topics.length > 0) {
                topicsHtml = '<ul>' + week.topics.map(t => `<li>${escapeHtml(t)}</li>`).join('') + '</ul>';
            }
            
            weeksHtml += `
                <div class="week-section">
                    <h3>Неделя ${weekNumber}: ${escapeHtml(week.goal)}</h3>
                    ${topicsHtml ? '<p><strong>Темы:</strong></p>' + topicsHtml : ''}
                    ${tasksHtml ? '<p><strong>Практика:</strong></p>' + tasksHtml : ''}
                </div>
            `;
        });
        
        // Calculate progress
        const totalTasks = plan.plan_json.weeks.reduce((sum, w) => sum + (w.practice ? w.practice.length : 0), 0);
        const completedCount = completedTasks.size;
        const progressPercent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
        
        content.innerHTML = `
            <h2>${escapeHtml(plan.title)}</h2>
            <p><strong>Цель:</strong> ${escapeHtml(plan.goal)}</p>
            <p><strong>Уровень:</strong> ${getLevelName(plan.level)}</p>
            <p><strong>Длительность:</strong> ${plan.duration_weeks} недель</p>
            <p><strong>Часов в неделю:</strong> ${plan.time_per_week}</p>
            <p><strong>Формат:</strong> ${getFormatName(plan.preferred_format)}</p>
            
            <div style="margin: 20px 0;">
                <h3>Прогресс выполнения</h3>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${progressPercent}%"></div>
                </div>
                <p>${completedCount} из ${totalTasks} заданий выполнено (${progressPercent}%)</p>
            </div>
            
            <h3>Учебный план</h3>
            ${weeksHtml}
        `;
    } catch (error) {
        console.error('Error loading plan:', error);
        content.innerHTML = '<p class="alert alert-error">Ошибка загрузки плана</p>';
    }
}

// Toggle task progress
async function toggleTaskProgress(weekNumber, taskIndex, isCompleted) {
    try {
        await fetch(`${API_BASE_URL}/task-progress`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                plan_id: currentPlanId,
                week_number: weekNumber,
                task_index: taskIndex,
                is_completed: isCompleted
            })
        });
        
        // Reload the plan to show updated progress
        viewPlan(currentPlanId);
    } catch (error) {
        console.error('Error saving progress:', error);
        showAlert('Ошибка сохранения прогресса', 'error');
    }
}

// Create new plan
document.getElementById('create-plan-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        goal: document.getElementById('goal').value,
        level: document.getElementById('level').value,
        duration_weeks: parseInt(document.getElementById('duration_weeks').value),
        time_per_week: parseInt(document.getElementById('time_per_week').value),
        preferred_format: document.getElementById('preferred_format').value,
        user_id: currentUserId
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/plans`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showAlert('Учебный план успешно создан!');
            document.getElementById('create-plan-form').reset();
            showSection('my-plans');
        } else {
            const error = await response.json();
            showAlert('Ошибка создания плана: ' + JSON.stringify(error), 'error');
        }
    } catch (error) {
        console.error('Error creating plan:', error);
        showAlert('Ошибка создания плана', 'error');
    }
});

// Delete plan
async function deletePlan(planId) {
    if (!confirm('Вы уверены, что хотите удалить этот план?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/plans/${planId}?user_id=${currentUserId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showAlert('План успешно удален');
            loadPlans();
        } else {
            showAlert('Ошибка удаления плана', 'error');
        }
    } catch (error) {
        console.error('Error deleting plan:', error);
        showAlert('Ошибка удаления плана', 'error');
    }
}

// Helper functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getLevelName(level) {
    const levels = {
        'beginner': 'Начинающий',
        'intermediate': 'Средний',
        'advanced': 'Продвинутый'
    };
    return levels[level] || level;
}

function getFormatName(format) {
    const formats = {
        'practice': 'Практика',
        'theory': 'Теория',
        'mixed': 'Смешанный'
    };
    return formats[format] || format;
}

// Initialize - show create plan section by default
showSection('create-plan');
