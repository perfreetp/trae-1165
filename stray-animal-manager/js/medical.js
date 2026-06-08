const Medical = (() => {
    const typeMap = {
        deworming: '驱虫',
        vaccination: '疫苗',
        surgery: '手术',
        checkup: '体检',
        medication: '用药',
        other: '其他'
    };

    const typeTagClass = {
        deworming: 'tag-deworming',
        vaccination: 'tag-vaccination',
        surgery: 'tag-surgery',
        checkup: 'tag-checkup',
        medication: 'tag-medication',
        other: 'tag-other'
    };

    let state = {
        editId: null,
        filterAnimal: '',
        filterType: ''
    };

    function getMonthStats() {
        const now = new Date();
        const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const all = Store.getAllMedical();
        const monthRecords = all.filter(r => r.date && r.date.startsWith(prefix));
        const reminders = Store.getUpcomingReminders(14);
        const monthCost = monthRecords.reduce((s, r) => s + (r.cost || 0), 0);
        return { monthCount: monthRecords.length, reminderCount: reminders.length, monthCost };
    }

    function typeTag(type) {
        const cls = typeTagClass[type] || 'tag-other';
        const label = typeMap[type] || type;
        return `<span class="tag ${cls}">${label}</span>`;
    }

    function renderFilterBar() {
        const animals = Store.getAllAnimals();
        const animalOptions = animals.map(a =>
            `<option value="${a.id}"${state.filterAnimal === a.id ? ' selected' : ''}>${a.name}</option>`
        ).join('');
        const typeOptions = Object.entries(typeMap).map(([k, v]) =>
            `<option value="${k}"${state.filterType === k ? ' selected' : ''}>${v}</option>`
        ).join('');
        return `<div class="filter-bar">
            <select id="mc-filter-animal">
                <option value="">全部动物</option>
                ${animalOptions}
            </select>
            <select id="mc-filter-type">
                <option value="">全部类型</option>
                ${typeOptions}
            </select>
        </div>`;
    }

    function renderStatsCards() {
        const stats = getMonthStats();
        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon blue">📋</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.monthCount}</div>
                    <div class="stat-label">本月医疗记录</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🔔</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.reminderCount}</div>
                    <div class="stat-label">近期提醒（14天内）</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">💰</div>
                <div class="stat-info">
                    <div class="stat-value">¥${stats.monthCost.toFixed(2)}</div>
                    <div class="stat-label">本月医疗费用</div>
                </div>
            </div>
        </div>`;
    }

    function getFilteredRecords() {
        let records = Store.getAllMedical();
        if (state.filterAnimal) {
            records = records.filter(r => r.animalId === state.filterAnimal);
        }
        if (state.filterType) {
            records = records.filter(r => r.type === state.filterType);
        }
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function renderTable() {
        const records = getFilteredRecords();
        if (!records.length) {
            return `<div class="empty-state"><div class="empty-icon">🏥</div><div class="empty-text">暂无医疗记录</div></div>`;
        }
        const rows = records.map(r => {
            const animal = Store.getAnimal(r.animalId);
            const animalName = animal ? animal.name : '未知';
            const medicineInfo = r.medicine ? `${r.medicine}${r.dosage ? ' ' + r.dosage : ''}` : '-';
            return `<tr>
                <td>${r.date || '-'}</td>
                <td>${animalName}</td>
                <td>${typeTag(r.type)}</td>
                <td>${r.description || '-'}</td>
                <td>${r.vet || '-'}</td>
                <td>${medicineInfo}</td>
                <td>¥${(r.cost || 0).toFixed(2)}</td>
                <td>${r.nextDate || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="edit" data-id="${r.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${r.id}">删除</button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>日期</th><th>动物</th><th>类型</th><th>描述</th><th>兽医</th><th>药品/剂量</th><th>费用</th><th>下次日期</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function renderWeightChart(animalId) {
        const animal = Store.getAnimal(animalId);
        if (!animal) return '';
        const wh = animal.weightHistory || [];
        if (!wh.length) {
            return `<div class="section-divider">体重记录 - ${animal.name}</div>
                <div class="weight-chart-container">
                    <div class="empty-state"><div class="empty-icon">⚖️</div><div class="empty-text">暂无体重记录</div></div>
                </div>
                <button class="btn btn-primary btn-sm" data-action="add-weight" data-animal-id="${animalId}" style="margin-top:8px">记录体重</button>`;
        }
        return `<div class="section-divider">体重记录 - ${animal.name}</div>
            <div class="weight-chart-container">
                <canvas class="weight-chart" id="mc-weight-canvas" data-animal-id="${animalId}"></canvas>
            </div>
            <button class="btn btn-primary btn-sm" data-action="add-weight" data-animal-id="${animalId}" style="margin-top:8px">记录体重</button>`;
    }

    function renderReminders() {
        const reminders = Store.getUpcomingReminders(14);
        if (!reminders.length) {
            return `<div class="section-divider">近期提醒</div>
                <div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-text">暂无近期提醒</div></div>`;
        }
        const items = reminders.map(r => {
            return `<div class="timeline-item">
                <div class="timeline-date">${r.nextDate}</div>
                <div class="timeline-content"><strong>${r.animalName}</strong> - ${r.description || typeMap[r.type] || '医疗提醒'}</div>
            </div>`;
        }).join('');
        return `<div class="section-divider">近期提醒</div>
            <div class="timeline">${items}</div>`;
    }

    function render() {
        const panel = document.getElementById('module-medical');
        if (!panel) return;
        const selectedAnimal = state.filterAnimal;
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">医疗护理</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="mc-add-btn">添加记录</button>
                </div>
            </div>
            ${renderFilterBar()}
            ${renderStatsCards()}
            ${selectedAnimal ? renderWeightChart(selectedAnimal) : ''}
            ${renderTable()}
            ${renderReminders()}`;
        if (selectedAnimal) {
            setTimeout(() => drawWeightChart(selectedAnimal), 0);
        }
    }

    function drawWeightChart(animalId) {
        const canvas = document.getElementById('mc-weight-canvas');
        if (!canvas) return;
        const animal = Store.getAnimal(animalId);
        if (!animal) return;
        const wh = animal.weightHistory || [];
        if (!wh.length) return;

        const ctx = canvas.getContext('2d');
        const container = canvas.parentElement;
        const dpr = window.devicePixelRatio || 1;
        const w = container.clientWidth;
        const h = container.clientHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        ctx.scale(dpr, dpr);

        const padLeft = 50;
        const padRight = 20;
        const padTop = 20;
        const padBottom = 40;
        const chartW = w - padLeft - padRight;
        const chartH = h - padTop - padBottom;

        const weights = wh.map(p => p.weight);
        const minW = Math.floor(Math.min(...weights) - 0.5);
        const maxW = Math.ceil(Math.max(...weights) + 0.5);
        const range = maxW - minW || 1;

        ctx.clearRect(0, 0, w, h);

        ctx.strokeStyle = '#E1E4E8';
        ctx.lineWidth = 1;
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = padTop + (chartH / ySteps) * i;
            ctx.beginPath();
            ctx.moveTo(padLeft, y);
            ctx.lineTo(padLeft + chartW, y);
            ctx.stroke();
            const val = maxW - (range / ySteps) * i;
            ctx.fillStyle = '#7F8C8D';
            ctx.font = '11px sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(1), padLeft - 8, y + 4);
        }

        const xCount = wh.length;
        for (let i = 0; i < xCount; i++) {
            const x = padLeft + (chartW / (xCount - 1 || 1)) * i;
            ctx.beginPath();
            ctx.moveTo(x, padTop);
            ctx.lineTo(x, padTop + chartH);
            ctx.stroke();
            ctx.fillStyle = '#7F8C8D';
            ctx.font = '10px sans-serif';
            ctx.textAlign = 'center';
            const dateLabel = wh[i].date.length > 5 ? wh[i].date.substring(5) : wh[i].date;
            ctx.save();
            ctx.translate(x, padTop + chartH + 12);
            ctx.rotate(-0.4);
            ctx.fillText(dateLabel, 0, 0);
            ctx.restore();
        }

        ctx.strokeStyle = '#4A90D9';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.beginPath();
        wh.forEach((p, i) => {
            const x = padLeft + (chartW / (xCount - 1 || 1)) * i;
            const y = padTop + chartH - ((p.weight - minW) / range) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.fillStyle = '#4A90D9';
        wh.forEach((p, i) => {
            const x = padLeft + (chartW / (xCount - 1 || 1)) * i;
            const y = padTop + chartH - ((p.weight - minW) / range) * chartH;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.fillStyle = '#2C3E50';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        wh.forEach((p, i) => {
            const x = padLeft + (chartW / (xCount - 1 || 1)) * i;
            const y = padTop + chartH - ((p.weight - minW) / range) * chartH;
            ctx.fillText(p.weight.toFixed(1), x, y - 8);
        });
    }

    function showFormModal(id) {
        const record = id ? Store.getAllMedical().find(r => r.id === id) : null;
        const isEdit = !!record;
        state.editId = id || null;
        const animals = Store.getAllAnimals();
        const animalOptions = animals.map(a => {
            const sel = isEdit && record.animalId === a.id ? ' selected' : '';
            return `<option value="${a.id}"${sel}>${a.name}</option>`;
        }).join('');
        const typeOptions = Object.entries(typeMap).map(([k, v]) => {
            const sel = isEdit && record.type === k ? ' selected' : '';
            return `<option value="${k}"${sel}>${v}</option>`;
        }).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container wide';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑医疗记录' : '添加记录'}</h3>
                <button class="modal-close" id="mc-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>动物</label>
                        <select id="mc-f-animal">
                            <option value="">请选择动物</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" id="mc-f-date" value="${isEdit ? record.date : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <select id="mc-f-type">${typeOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>兽医</label>
                        <input type="text" id="mc-f-vet" value="${isEdit ? record.vet : ''}" placeholder="请输入兽医姓名">
                    </div>
                    <div class="form-group full-width">
                        <label>描述</label>
                        <input type="text" id="mc-f-desc" value="${isEdit ? record.description : ''}" placeholder="请输入医疗描述">
                    </div>
                    <div class="form-group">
                        <label>费用 (¥)</label>
                        <input type="number" id="mc-f-cost" step="0.01" min="0" value="${isEdit ? record.cost : ''}" placeholder="请输入费用">
                    </div>
                    <div class="form-group">
                        <label>药品</label>
                        <input type="text" id="mc-f-medicine" value="${isEdit ? record.medicine : ''}" placeholder="请输入药品名称">
                    </div>
                    <div class="form-group">
                        <label>剂量</label>
                        <input type="text" id="mc-f-dosage" value="${isEdit ? record.dosage : ''}" placeholder="请输入剂量">
                    </div>
                    <div class="form-group">
                        <label>下次日期</label>
                        <input type="date" id="mc-f-next" value="${isEdit ? record.nextDate : ''}">
                    </div>
                    <div class="form-group full-width">
                        <label>备注</label>
                        <textarea id="mc-f-notes" placeholder="请输入备注">${isEdit ? record.notes : ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="mc-modal-cancel">取消</button>
                <button class="btn btn-primary" id="mc-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function showWeightModal(animalId) {
        const animal = Store.getAnimal(animalId);
        if (!animal) return;
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">记录体重 - ${animal.name}</h3>
                <button class="modal-close" id="mc-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" id="mc-fw-date" value="${new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>体重 (kg)</label>
                        <input type="number" id="mc-fw-weight" step="0.1" min="0" placeholder="请输入体重">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="mc-modal-cancel">取消</button>
                <button class="btn btn-primary" id="mc-fw-save">保存</button>
            </div>`;
        overlay.classList.add('active');
        overlay._weightAnimalId = animalId;
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        delete overlay._weightAnimalId;
        state.editId = null;
    }

    function saveRecord() {
        const animalId = document.getElementById('mc-f-animal').value;
        if (!animalId) return;
        const data = {
            animalId,
            date: document.getElementById('mc-f-date').value,
            type: document.getElementById('mc-f-type').value,
            description: document.getElementById('mc-f-desc').value.trim(),
            vet: document.getElementById('mc-f-vet').value.trim(),
            cost: parseFloat(document.getElementById('mc-f-cost').value) || 0,
            medicine: document.getElementById('mc-f-medicine').value.trim(),
            dosage: document.getElementById('mc-f-dosage').value.trim(),
            nextDate: document.getElementById('mc-f-next').value,
            notes: document.getElementById('mc-f-notes').value.trim()
        };
        if (state.editId) {
            Store.updateMedical(state.editId, data);
        } else {
            Store.createMedical(data);
        }
        closeModal();
        render();
    }

    function saveWeight() {
        const overlay = document.getElementById('modalOverlay');
        const animalId = overlay._weightAnimalId;
        const date = document.getElementById('mc-fw-date').value;
        const weight = parseFloat(document.getElementById('mc-fw-weight').value);
        if (!animalId || !date || isNaN(weight) || weight <= 0) return;
        Store.updateWeight(animalId, weight, date);
        closeModal();
        render();
    }

    function deleteRecord(id) {
        if (!confirm('确定删除此医疗记录？')) return;
        Store.deleteMedical(id);
        render();
    }

    function init() {
        const panel = document.getElementById('module-medical');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            if (e.target.id === 'mc-add-btn') {
                showFormModal(null);
                return;
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'edit') showFormModal(id);
                if (action === 'delete') deleteRecord(id);
                if (action === 'add-weight') showWeightModal(actionBtn.dataset.animalId);
                return;
            }
        });

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'mc-filter-animal') {
                state.filterAnimal = e.target.value;
                render();
                return;
            }
            if (e.target.id === 'mc-filter-type') {
                state.filterType = e.target.value;
                render();
                return;
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'mc-modal-close' || e.target.id === 'mc-modal-cancel') {
                closeModal();
                return;
            }
            if (e.target.id === 'mc-modal-save') {
                saveRecord();
                return;
            }
            if (e.target.id === 'mc-fw-save') {
                saveWeight();
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    return { init, render };
})();
