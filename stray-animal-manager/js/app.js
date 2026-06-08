const App = (() => {
    const modules = {
        'animal-list': AnimalList,
        'intake': Intake,
        'medical': Medical,
        'foster': Foster,
        'expense': Expense,
        'followup': Followup,
        'report': Report
    };
    let currentModule = 'animal-list';

    function init() {
        Store.initDemoData();
        initNavigation();
        initGlobalSearch();
        initReminderBell();
        updateCurrentDate();
        setInterval(updateCurrentDate, 60000);
        updateCapacity();
        Object.values(modules).forEach(m => m.init());
        switchModule('animal-list');
    }

    function initNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const mod = item.dataset.module;
                if (mod) switchModule(mod);
            });
        });
    }

    function switchModule(name) {
        currentModule = name;
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.module === name);
        });
        document.querySelectorAll('.module-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `module-${name}`);
        });
        if (modules[name] && modules[name].render) {
            modules[name].render();
        }
    }

    function initGlobalSearch() {
        const input = document.getElementById('globalSearch');
        let timer = null;
        input.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                if (currentModule === 'animal-list') {
                    AnimalList.render();
                } else {
                    switchModule('animal-list');
                }
            }, 300);
        });
    }

    function initReminderBell() {
        const bell = document.getElementById('reminderBell');
        let popup = null;
        bell.addEventListener('click', (e) => {
            e.stopPropagation();
            if (!popup) {
                popup = document.createElement('div');
                popup.className = 'reminder-popup show';
                bell.style.position = 'relative';
                bell.appendChild(popup);
                renderReminders(popup);
            } else {
                popup.remove();
                popup = null;
            }
        });
        document.addEventListener('click', () => {
            if (popup) {
                popup.remove();
                popup = null;
            }
        });
        updateReminderBadge();
        setInterval(updateReminderBadge, 300000);
    }

    function renderReminders(container) {
        const reminders = Store.getUpcomingReminders(14);
        const typeMap = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };
        let html = '<div class="reminder-header">用药/复诊提醒（14天内）</div><div class="reminder-list">';
        if (reminders.length === 0) {
            html += '<div class="reminder-item" style="color:#999;">暂无提醒</div>';
        } else {
            reminders.forEach(r => {
                html += `<div class="reminder-item">
                    <div class="ri-animal">${r.animalName} - ${typeMap[r.type] || r.type}</div>
                    <div>${r.description || ''}</div>
                    <div class="ri-date">下次日期：${r.nextDate}</div>
                </div>`;
            });
        }
        html += '</div>';
        container.innerHTML = html;
    }

    function updateReminderBadge() {
        const reminders = Store.getUpcomingReminders(7);
        const badge = document.getElementById('reminderBadge');
        if (reminders.length > 0) {
            badge.style.display = 'flex';
            badge.textContent = reminders.length;
        } else {
            badge.style.display = 'none';
        }
    }

    function updateCurrentDate() {
        const now = new Date();
        const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
        document.getElementById('currentDate').textContent = now.toLocaleDateString('zh-CN', options);
    }

    function updateCapacity() {
        const stats = Store.getStats();
        const config = Store.loadConfig();
        const capacity = config.stationCapacity || 50;
        const current = stats.inStation;
        const pct = Math.min(100, Math.round((current / capacity) * 100));
        const fill = document.getElementById('capacityFill');
        const text = document.getElementById('capacityText');
        fill.style.width = pct + '%';
        fill.className = 'capacity-fill' + (pct >= 90 ? ' danger' : pct >= 70 ? ' warning' : '');
        text.textContent = `${current} / ${capacity}`;
    }

    function showToast(message, type) {
        type = type || 'success';
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(40px)';
            toast.style.transition = 'all 0.3s';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    function openModal(title, bodyHtml, footerHtml, wide) {
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container' + (wide ? ' wide' : '');
        container.innerHTML = `
            <div class="modal-header">
                <div class="modal-title">${title}</div>
                <button class="modal-close" id="modalCloseBtn">&times;</button>
            </div>
            <div class="modal-body">${bodyHtml}</div>
            ${footerHtml ? `<div class="modal-footer">${footerHtml}</div>` : ''}
        `;
        overlay.classList.add('active');
        container.querySelector('#modalCloseBtn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        document.getElementById('modalContainer').innerHTML = '';
    }

    function refresh() {
        updateCapacity();
        updateReminderBadge();
        if (modules[currentModule] && modules[currentModule].render) {
            modules[currentModule].render();
        }
    }

    return { init, showToast, openModal, closeModal, refresh, updateCapacity };
})();

document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
