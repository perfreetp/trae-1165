const Followup = (() => {
    const typeMap = {
        post_adopt: '领养回访',
        post_foster: '寄养回访',
        lost: '走失',
        found: '找回',
        other: '其他'
    };

    const statusMap = {
        normal: '正常',
        concern: '关注',
        urgent: '紧急'
    };

    const statusTagClass = {
        normal: 'tag-normal',
        concern: 'tag-concern',
        urgent: 'tag-urgent'
    };

    const typeTagClass = {
        post_adopt: 'tag-adopted',
        post_foster: 'tag-fostered',
        lost: 'tag-lost',
        found: 'tag-found',
        other: 'tag-other'
    };

    let state = {
        editId: null,
        filterAnimal: '',
        filterType: ''
    };

    function typeTag(type) {
        const cls = typeTagClass[type] || 'tag-other';
        const label = typeMap[type] || type;
        return `<span class="tag ${cls}">${label}</span>`;
    }

    function statusTag(status) {
        const cls = statusTagClass[status] || 'tag-normal';
        const label = statusMap[status] || status;
        return `<span class="tag ${cls}">${label}</span>`;
    }

    function getStats() {
        const all = Store.getAllFollowups();
        const now = new Date();
        const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthCount = all.filter(r => r.date && r.date.startsWith(prefix)).length;
        const lostCount = Store.getAllAnimals().filter(a => a.status === 'lost').length;
        const concernUrgent = all.filter(r => r.status === 'concern' || r.status === 'urgent').length;
        return { total: all.length, monthCount, lostCount, concernUrgent };
    }

    function renderStatsCards() {
        const stats = getStats();
        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon blue">📋</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">回访总数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">📅</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.monthCount}</div>
                    <div class="stat-label">本月回访</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🐾</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.lostCount}</div>
                    <div class="stat-label">走失动物</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">⚠️</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.concernUrgent}</div>
                    <div class="stat-label">关注/紧急</div>
                </div>
            </div>
        </div>`;
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
            <select id="fu-filter-animal">
                <option value="">全部动物</option>
                ${animalOptions}
            </select>
            <select id="fu-filter-type">
                <option value="">全部类型</option>
                ${typeOptions}
            </select>
        </div>`;
    }

    function getFilteredRecords() {
        let records = Store.getAllFollowups();
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
            return `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无回访记录</div></div>`;
        }
        const rows = records.map(r => {
            const animal = Store.getAnimal(r.animalId);
            const family = r.familyId ? Store.getFamily(r.familyId) : null;
            const animalName = animal ? animal.name : '未知';
            const familyName = family ? family.name : '-';
            return `<tr>
                <td>${r.date || '-'}</td>
                <td>${animalName}</td>
                <td>${familyName}</td>
                <td>${typeTag(r.type)}</td>
                <td>${statusTag(r.status)}</td>
                <td>${r.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="edit" data-id="${r.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${r.id}">删除</button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>日期</th><th>动物名称</th><th>家庭名称</th><th>类型</th><th>状态</th><th>回访内容</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function renderTimeline() {
        if (!state.filterAnimal) return '';
        const animal = Store.getAnimal(state.filterAnimal);
        if (!animal) return '';
        const records = Store.getFollowupsByAnimal(state.filterAnimal);
        if (!records.length) {
            return `<div class="section-divider">回访时间线 - ${animal.name}</div>
                <div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无回访记录</div></div>`;
        }
        const sorted = records.sort((a, b) => new Date(b.date) - new Date(a.date));
        const items = sorted.map(r => {
            return `<div class="timeline-item">
                <div class="timeline-date">${r.date || '-'}</div>
                <div class="timeline-content">
                    <strong>${typeMap[r.type] || r.type}</strong>
                    ${statusTag(r.status)}
                    <div>${r.notes || ''}</div>
                </div>
            </div>`;
        }).join('');
        return `<div class="section-divider">回访时间线 - ${animal.name}</div>
            <div class="timeline">${items}</div>`;
    }

    function renderQuickActions() {
        return `<div class="quick-action-row">
            <button class="btn btn-warning" id="fu-mark-lost">标记走失</button>
            <button class="btn btn-primary" id="fu-mark-found">标记找回</button>
        </div>`;
    }

    function render() {
        const panel = document.getElementById('module-followup');
        if (!panel) return;
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">回访记录</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="fu-add-btn">新增回访</button>
                </div>
            </div>
            ${renderQuickActions()}
            ${renderFilterBar()}
            ${renderStatsCards()}
            ${renderTimeline()}
            ${renderTable()}`;
    }

    function showFormModal(id) {
        const record = id ? Store.getAllFollowups().find(r => r.id === id) : null;
        const isEdit = !!record;
        state.editId = id || null;

        const animals = Store.getAllAnimals();
        const families = Store.getAllFamilies();

        const animalOptions = animals.map(a => {
            const sel = isEdit && record.animalId === a.id ? ' selected' : '';
            return `<option value="${a.id}"${sel}>${a.name}</option>`;
        }).join('');

        const familyOptions = families.map(f => {
            const sel = isEdit && record.familyId === f.id ? ' selected' : '';
            return `<option value="${f.id}"${sel}>${f.name}</option>`;
        }).join('');

        const typeOptions = Object.entries(typeMap).map(([k, v]) => {
            const sel = isEdit && record.type === k ? ' selected' : '';
            return `<option value="${k}"${sel}>${v}</option>`;
        }).join('');

        const statusOptions = Object.entries(statusMap).map(([k, v]) => {
            const sel = isEdit && record.status === k ? ' selected' : '';
            return `<option value="${k}"${sel}>${v}</option>`;
        }).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑回访' : '新增回访'}</h3>
                <button class="modal-close" id="fu-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>动物</label>
                        <select id="fu-f-animal">
                            <option value="">请选择动物</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>家庭（可选）</label>
                        <select id="fu-f-family">
                            <option value="">请选择家庭</option>
                            ${familyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" id="fu-f-date" value="${isEdit ? record.date : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <select id="fu-f-type">${typeOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>状态</label>
                        <select id="fu-f-status">${statusOptions}</select>
                    </div>
                    <div class="form-group full-width">
                        <label>回访内容</label>
                        <textarea id="fu-f-notes" placeholder="请输入回访内容">${isEdit ? (record.notes || '') : ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fu-modal-cancel">取消</button>
                <button class="btn btn-primary" id="fu-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function saveRecord() {
        const animalId = document.getElementById('fu-f-animal').value;
        if (!animalId) return;
        const type = document.getElementById('fu-f-type').value;
        const data = {
            animalId,
            familyId: document.getElementById('fu-f-family').value || null,
            date: document.getElementById('fu-f-date').value,
            type,
            status: document.getElementById('fu-f-status').value,
            notes: document.getElementById('fu-f-notes').value.trim()
        };

        if (state.editId) {
            Store.updateFollowup(state.editId, data);
        } else {
            Store.createFollowup(data);
        }

        if (type === 'lost') {
            Store.updateAnimal(animalId, { status: 'lost' });
        } else if (type === 'found') {
            Store.updateAnimal(animalId, { status: 'available' });
        }

        closeModal();
        render();
    }

    function deleteRecord(id) {
        if (!confirm('确定删除此回访记录？')) return;
        Store.deleteFollowup(id);
        render();
    }

    function showMarkLostModal() {
        const animals = Store.getAllAnimals().filter(a => a.status !== 'lost');
        const animalOptions = animals.map(a =>
            `<option value="${a.id}">${a.name}</option>`
        ).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">标记走失</h3>
                <button class="modal-close" id="fu-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>选择动物</label>
                        <select id="fu-quick-animal">
                            <option value="">请选择动物</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>备注</label>
                        <textarea id="fu-quick-notes" placeholder="请输入走失相关备注"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fu-modal-cancel">取消</button>
                <button class="btn btn-warning" id="fu-quick-save-lost">确认走失</button>
            </div>`;
        overlay.classList.add('active');
    }

    function showMarkFoundModal() {
        const animals = Store.getAllAnimals().filter(a => a.status === 'lost');
        const animalOptions = animals.map(a =>
            `<option value="${a.id}">${a.name}</option>`
        ).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">标记找回</h3>
                <button class="modal-close" id="fu-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>选择动物（仅走失动物）</label>
                        <select id="fu-quick-animal">
                            <option value="">请选择动物</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group full-width">
                        <label>备注</label>
                        <textarea id="fu-quick-notes" placeholder="请输入找回相关备注"></textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fu-modal-cancel">取消</button>
                <button class="btn btn-primary" id="fu-quick-save-found">确认找回</button>
            </div>`;
        overlay.classList.add('active');
    }

    function saveQuickLost() {
        const animalId = document.getElementById('fu-quick-animal').value;
        if (!animalId) return;
        const notes = document.getElementById('fu-quick-notes').value.trim();
        Store.createFollowup({
            animalId,
            familyId: null,
            date: new Date().toISOString().split('T')[0],
            type: 'lost',
            status: 'urgent',
            notes
        });
        Store.updateAnimal(animalId, { status: 'lost' });
        closeModal();
        render();
    }

    function saveQuickFound() {
        const animalId = document.getElementById('fu-quick-animal').value;
        if (!animalId) return;
        const notes = document.getElementById('fu-quick-notes').value.trim();
        Store.createFollowup({
            animalId,
            familyId: null,
            date: new Date().toISOString().split('T')[0],
            type: 'found',
            status: 'normal',
            notes
        });
        Store.updateAnimal(animalId, { status: 'available' });
        closeModal();
        render();
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        state.editId = null;
    }

    function init() {
        const panel = document.getElementById('module-followup');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            if (e.target.id === 'fu-add-btn') {
                showFormModal(null);
                return;
            }
            if (e.target.id === 'fu-mark-lost') {
                showMarkLostModal();
                return;
            }
            if (e.target.id === 'fu-mark-found') {
                showMarkFoundModal();
                return;
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'edit') showFormModal(id);
                if (action === 'delete') deleteRecord(id);
                return;
            }
        });

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'fu-filter-animal') {
                state.filterAnimal = e.target.value;
                render();
                return;
            }
            if (e.target.id === 'fu-filter-type') {
                state.filterType = e.target.value;
                render();
                return;
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'fu-modal-close' || e.target.id === 'fu-modal-cancel') {
                closeModal();
                return;
            }
            if (e.target.id === 'fu-modal-save') {
                saveRecord();
                return;
            }
            if (e.target.id === 'fu-quick-save-lost') {
                saveQuickLost();
                return;
            }
            if (e.target.id === 'fu-quick-save-found') {
                saveQuickFound();
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    return { init, render };
})();
