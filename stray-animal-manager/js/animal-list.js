const AnimalList = (() => {
    const statusMap = { isolated: '隔离中', available: '可领养', fostered: '寄养中', adopted: '已领养', lost: '走失', deceased: '死亡' };
    const genderMap = { male: '公', female: '母', unknown: '未知' };
    const speciesMap = { cat: '猫', dog: '狗' };
    const sourceMap = { stray: '流浪救助', surrender: '弃养', rescue: '救援', other: '其他' };

    let state = {
        species: '',
        status: '',
        viewMode: 'table',
        selectedIds: new Set(),
        currentPage: 1,
        pageSize: 10,
        searchQuery: '',
        editId: null,
        timelineFilter: 'all'
    };

    function getFilteredAnimals() {
        const filters = {};
        if (state.species) filters.species = state.species;
        if (state.status) filters.status = state.status;
        return Store.searchAnimals(state.searchQuery, filters);
    }

    function renderStats() {
        const stats = Store.getStats();
        return `<div class="stat-cards">
            <div class="stat-card"><div class="stat-icon blue">🐾</div><div class="stat-info"><div class="stat-value">${stats.total}</div><div class="stat-label">动物总数</div></div></div>
            <div class="stat-card"><div class="stat-icon green">🏠</div><div class="stat-info"><div class="stat-value">${stats.inStation}</div><div class="stat-label">在站数量</div></div></div>
            <div class="stat-card"><div class="stat-icon orange">🐱</div><div class="stat-info"><div class="stat-value">${stats.cats}</div><div class="stat-label">猫咪数量</div></div></div>
            <div class="stat-card"><div class="stat-icon purple">🐶</div><div class="stat-info"><div class="stat-value">${stats.dogs}</div><div class="stat-label">狗狗数量</div></div></div>
            <div class="stat-card"><div class="stat-icon red">❤️</div><div class="stat-info"><div class="stat-value">${stats.adopted}</div><div class="stat-label">已领养</div></div></div>
        </div>`;
    }

    function renderFilterBar() {
        return `<div class="filter-bar">
            <select id="al-species-filter">
                <option value="">全部物种</option>
                <option value="cat"${state.species === 'cat' ? ' selected' : ''}>猫</option>
                <option value="dog"${state.species === 'dog' ? ' selected' : ''}>狗</option>
            </select>
            <select id="al-status-filter">
                <option value="">全部状态</option>
                <option value="isolated"${state.status === 'isolated' ? ' selected' : ''}>隔离中</option>
                <option value="available"${state.status === 'available' ? ' selected' : ''}>可领养</option>
                <option value="fostered"${state.status === 'fostered' ? ' selected' : ''}>寄养中</option>
                <option value="adopted"${state.status === 'adopted' ? ' selected' : ''}>已领养</option>
                <option value="lost"${state.status === 'lost' ? ' selected' : ''}>走失</option>
                <option value="deceased"${state.status === 'deceased' ? ' selected' : ''}>死亡</option>
            </select>
            <div style="flex:1"></div>
            <button class="btn btn-sm btn-outline" id="al-export-list-btn">📤 导出列表</button>
            <button class="btn btn-sm${state.viewMode === 'table' ? ' btn-primary' : ' btn-outline'}" data-view="table">📋 表格</button>
            <button class="btn btn-sm${state.viewMode === 'card' ? ' btn-primary' : ' btn-outline'}" data-view="card">🗂️ 卡片</button>
        </div>`;
    }

    function photoThumb(animal) {
        if (animal.photo) return `<div class="photo-thumb"><img src="${animal.photo}" alt="${animal.name}"></div>`;
        return `<div class="photo-thumb">${animal.species === 'cat' ? '🐱' : '🐶'}</div>`;
    }

    function statusTag(s) {
        return `<span class="tag tag-${s}">${statusMap[s] || s}</span>`;
    }

    function speciesTag(s) {
        return `<span class="tag tag-${s}">${speciesMap[s] || s}</span>`;
    }

    function renderTableView(animals) {
        if (!animals.length) return `<div class="empty-state"><div class="empty-icon">🐾</div><div class="empty-text">暂无动物数据</div></div>`;
        const rows = animals.map(a => `<tr data-id="${a.id}" class="${state.selectedIds.has(a.id) ? 'selected' : ''}">
                <td><label class="checkbox-wrap"><input type="checkbox" data-check="${a.id}"${state.selectedIds.has(a.id) ? ' checked' : ''}></label></td>
                <td>${photoThumb(a)}</td>
                <td><strong>${a.name}</strong></td>
                <td>${speciesTag(a.species)}</td>
                <td>${a.breed || '-'}</td>
                <td>${genderMap[a.gender] || '未知'}</td>
                <td>${a.age || '-'}</td>
                <td>${a.chipNumber || '-'}</td>
                <td>${statusTag(a.status)}</td>
                <td>${a.intakeDate || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="view" data-id="${a.id}">查看</button>
                    <button class="btn btn-sm btn-outline" data-action="edit" data-id="${a.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete" data-id="${a.id}">删除</button>
                </td>
            </tr>`).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th><label class="checkbox-wrap"><input type="checkbox" id="al-select-all"></label></th>
                <th>照片</th><th>名称</th><th>物种</th><th>品种</th><th>性别</th><th>年龄</th><th>芯片号</th><th>状态</th><th>入站日期</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function renderCardView(animals) {
        if (!animals.length) return `<div class="empty-state"><div class="empty-icon">🐾</div><div class="empty-text">暂无动物数据</div></div>`;
        const cards = animals.map(a => `<div class="animal-card" data-id="${a.id}">
                <div class="ac-photo">${a.photo ? `<img src="${a.photo}" alt="${a.name}">` : (a.species === 'cat' ? '🐱' : '🐶')}</div>
                <div class="ac-name">${a.name}</div>
                <div class="ac-info"><span>${speciesMap[a.species] || ''}</span><span>${a.breed || ''}</span><span>${genderMap[a.gender] || ''}</span><span>${a.age || ''}</span></div>
                <div class="ac-tags">${speciesTag(a.species)} ${statusTag(a.status)}</div>
            </div>`).join('');
        return `<div class="animal-card-grid">${cards}</div>`;
    }

    function renderBatchBar() {
        if (!state.selectedIds.size) return '';
        const opts = Object.entries(statusMap).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
        return `<div id="al-batch-bar" style="display:flex;align-items:center;gap:10px;padding:10px 16px;background:var(--primary);color:#fff;border-radius:var(--radius-sm);margin-bottom:12px;">
            <span>已选择 <strong>${state.selectedIds.size}</strong> 项</span>
            <select id="al-batch-status" style="padding:4px 8px;border-radius:4px;border:none;font-size:13px;">${opts}</select>
            <button class="btn btn-sm" style="background:#fff;color:var(--primary);" id="al-batch-btn">批量更新状态</button>
            <button class="btn btn-sm" style="background:#fff;color:var(--primary);" id="al-batch-export-csv">📦 导出CSV</button>
            <button class="btn btn-sm" style="background:#fff;color:var(--primary);" id="al-batch-export-json">📄 导出JSON</button>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:#fff;" id="al-batch-cancel">取消选择</button>
        </div>`;
    }

    function renderPager(total) {
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const start = (state.currentPage - 1) * state.pageSize + 1;
        const end = Math.min(state.currentPage * state.pageSize, total);
        let btns = '';
        for (let i = 1; i <= totalPages; i++) {
            btns += `<button class="${i === state.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
        }
        return `<div class="pager"><span>共 ${total} 条，显示 ${total > 0 ? start : 0}-${end} 条</span><div class="pager-buttons">${btns}</div></div>`;
    }

    function render() {
        const panel = document.getElementById('module-animal-list');
        if (!panel) return;
        const animals = getFilteredAnimals();
        const total = animals.length;
        const totalPages = Math.max(1, Math.ceil(total / state.pageSize));
        if (state.currentPage > totalPages) state.currentPage = totalPages;
        const startIdx = (state.currentPage - 1) * state.pageSize;
        const pageAnimals = animals.slice(startIdx, startIdx + state.pageSize);
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">动物列表</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="al-add-btn">新增动物</button>
                </div>
            </div>
            ${renderStats()}
            ${renderFilterBar()}
            ${renderBatchBar()}
            ${state.viewMode === 'table' ? renderTableView(pageAnimals) : renderCardView(pageAnimals)}
            ${renderPager(total)}`;
    }

    function renderTimeline(animalId) {
        const events = Store.getAnimalTimeline(animalId);
        const filter = state.timelineFilter;
        const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);
        const typeIcons = { intake: '📝', weight: '⚖️', medical: '🏥', placement: '🏠', followup: '📞' };
        const filterOptions = [
            { value: 'all', label: '全部' },
            { value: 'intake', label: '入站' },
            { value: 'medical', label: '医疗' },
            { value: 'weight', label: '体重' },
            { value: 'placement', label: '领养/寄养' },
            { value: 'followup', label: '回访' }
        ];
        const filterBtns = filterOptions.map(f =>
            `<button class="btn btn-sm ${f.value === filter ? 'btn-primary' : 'btn-outline'}" data-tl-filter="${f.value}">${f.label}</button>`
        ).join('');

        if (!filtered.length) {
            return `<div class="section-divider" style="margin-top:20px">档案时间线</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">${filterBtns}</div>
                <div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无${filter === 'all' ? '' : filterOptions.find(f=>f.value===filter)?.label || ''}记录</div></div>`;
        }
        const items = filtered.map(e => {
            const icon = typeIcons[e.type] || '📋';
            return `<div class="timeline-item">
                <div class="timeline-date">${e.date || '-'}</div>
                <div class="timeline-content">${icon} <strong>${e.title}</strong>${e.detail ? ' — ' + e.detail : ''}</div>
            </div>`;
        }).join('');
        return `<div class="section-divider" style="margin-top:20px">档案时间线</div>
            <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px">${filterBtns}</div>
            <div class="timeline">${items}</div>`;
    }

    function showViewModal(id) {
        const animal = Store.getAnimal(id);
        if (!animal) return;
        state.timelineFilter = 'all';
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container wide';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">动物详情 - ${animal.name}</h3>
                <button class="modal-close" id="al-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">名称</div><div class="detail-value">${animal.name}</div></div>
                    <div class="detail-item"><div class="detail-label">物种</div><div class="detail-value">${speciesMap[animal.species] || animal.species} ${speciesTag(animal.species)}</div></div>
                    <div class="detail-item"><div class="detail-label">品种</div><div class="detail-value">${animal.breed || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">性别</div><div class="detail-value">${genderMap[animal.gender] || '未知'}</div></div>
                    <div class="detail-item"><div class="detail-label">年龄</div><div class="detail-value">${animal.age || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">毛色</div><div class="detail-value">${animal.color || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">芯片号</div><div class="detail-value">${animal.chipNumber || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">来源</div><div class="detail-value">${sourceMap[animal.source] || animal.source}</div></div>
                    <div class="detail-item"><div class="detail-label">来源详情</div><div class="detail-value">${animal.sourceDetail || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">入站日期</div><div class="detail-value">${animal.intakeDate || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">状态</div><div class="detail-value">${statusTag(animal.status)}</div></div>
                    <div class="detail-item"><div class="detail-label">当前体重</div><div class="detail-value">${animal.currentWeight ? animal.currentWeight + ' kg' : '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">隔离状态</div><div class="detail-value">${animal.isolationStatus?.isInIsolation ? '<span class="tag tag-isolated">隔离中</span>' : '<span class="tag tag-available">未隔离</span>'}</div></div>
                    <div class="detail-item"><div class="detail-label">特征</div><div class="detail-value">${animal.characteristics || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">备注</div><div class="detail-value">${animal.notes || '-'}</div></div>
                </div>
                <div id="al-timeline-area" data-animal-id="${id}">${renderTimeline(id)}</div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="al-modal-close-btn">关闭</button>
            </div>`;
        overlay.classList.add('active');
    }

    function showEditModal(id) {
        const animal = id ? Store.getAnimal(id) : null;
        const isEdit = !!animal;
        state.editId = id || null;
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        const statusOpts = Object.entries(statusMap).map(([k, v]) => `<option value="${k}"${isEdit && animal.status === k ? ' selected' : ''}>${v}</option>`).join('');
        const sourceOpts = Object.entries(sourceMap).map(([k, v]) => `<option value="${k}"${isEdit && animal.source === k ? ' selected' : ''}>${v}</option>`).join('');
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑动物 - ' + animal.name : '新增动物'}</h3>
                <button class="modal-close" id="al-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group"><label>名称</label><input type="text" id="al-edit-name" value="${isEdit ? animal.name : ''}"></div>
                    <div class="form-group"><label>物种</label><select id="al-edit-species"><option value="cat"${isEdit && animal.species === 'cat' ? ' selected' : ''}>猫</option><option value="dog"${isEdit && animal.species === 'dog' ? ' selected' : ''}>狗</option></select></div>
                    <div class="form-group"><label>品种</label><input type="text" id="al-edit-breed" value="${isEdit ? animal.breed : ''}"></div>
                    <div class="form-group"><label>性别</label><select id="al-edit-gender"><option value="unknown"${isEdit && animal.gender === 'unknown' ? ' selected' : ''}>未知</option><option value="male"${isEdit && animal.gender === 'male' ? ' selected' : ''}>公</option><option value="female"${isEdit && animal.gender === 'female' ? ' selected' : ''}>母</option></select></div>
                    <div class="form-group"><label>年龄</label><input type="text" id="al-edit-age" value="${isEdit ? animal.age : ''}"></div>
                    <div class="form-group"><label>毛色</label><input type="text" id="al-edit-color" value="${isEdit ? animal.color : ''}"></div>
                    <div class="form-group"><label>芯片号</label><input type="text" id="al-edit-chip" value="${isEdit ? animal.chipNumber : ''}"></div>
                    <div class="form-group"><label>来源</label><select id="al-edit-source">${sourceOpts}</select></div>
                    <div class="form-group"><label>来源详情</label><input type="text" id="al-edit-source-detail" value="${isEdit ? animal.sourceDetail : ''}"></div>
                    <div class="form-group"><label>入站日期</label><input type="date" id="al-edit-intake-date" value="${isEdit ? animal.intakeDate : new Date().toISOString().split('T')[0]}"></div>
                    <div class="form-group"><label>状态</label><select id="al-edit-status">${statusOpts}</select></div>
                    <div class="form-group"><label>体重 (kg)</label><input type="number" step="0.1" id="al-edit-weight" value="${isEdit && animal.currentWeight ? animal.currentWeight : ''}"></div>
                    <div class="form-group full-width"><label>特征</label><textarea id="al-edit-characteristics">${isEdit ? animal.characteristics : ''}</textarea></div>
                    <div class="form-group full-width"><label>备注</label><textarea id="al-edit-notes">${isEdit ? animal.notes : ''}</textarea></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="al-modal-close-btn">取消</button>
                <button class="btn btn-primary" id="al-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        state.editId = null;
    }

    function saveAnimal() {
        const id = state.editId;
        const data = {
            name: document.getElementById('al-edit-name').value.trim(),
            species: document.getElementById('al-edit-species').value,
            breed: document.getElementById('al-edit-breed').value.trim(),
            gender: document.getElementById('al-edit-gender').value,
            age: document.getElementById('al-edit-age').value.trim(),
            color: document.getElementById('al-edit-color').value.trim(),
            chipNumber: document.getElementById('al-edit-chip').value.trim(),
            source: document.getElementById('al-edit-source').value,
            sourceDetail: document.getElementById('al-edit-source-detail').value.trim(),
            intakeDate: document.getElementById('al-edit-intake-date').value,
            status: document.getElementById('al-edit-status').value,
            characteristics: document.getElementById('al-edit-characteristics').value.trim(),
            notes: document.getElementById('al-edit-notes').value.trim()
        };
        const weight = parseFloat(document.getElementById('al-edit-weight').value);
        if (!isNaN(weight) && weight > 0) data.weight = weight;
        if (!data.name) return;
        if (id) {
            Store.updateAnimal(id, data);
        } else {
            Store.createAnimal(data);
        }
        closeModal();
        render();
    }

    function confirmDelete(id) {
        const animal = Store.getAnimal(id);
        if (!animal) return;
        if (confirm(`确定要删除 "${animal.name}" 吗？此操作不可恢复。`)) {
            Store.deleteAnimal(id);
            state.selectedIds.delete(id);
            render();
        }
    }

    function buildAnimalArchive(animalId) {
        const animal = Store.getAnimal(animalId);
        if (!animal) return null;
        const medicals = Store.getMedicalByAnimal(animalId);
        const latestMedical = medicals.length ? medicals[0] : null;
        const placements = Store.getPlacementsByAnimal(animalId);
        const latestPlacement = placements.length ? placements[placements.length - 1] : null;
        const followups = Store.getFollowupsByAnimal(animalId);
        const latestFollowup = followups.length ? followups[0] : null;
        const groups = Store.getGroupedReminders();
        const allReminders = [...groups.today, ...groups.tomorrow, ...groups.week, ...groups.fortnight];
        const hasReminder = allReminders.some(r => r.animalId === animalId);
        return {
            name: animal.name,
            species: speciesMap[animal.species] || animal.species,
            breed: animal.breed || '',
            gender: genderMap[animal.gender] || '',
            age: animal.age || '',
            color: animal.color || '',
            chipNumber: animal.chipNumber || '',
            source: sourceMap[animal.source] || animal.source,
            intakeDate: animal.intakeDate || '',
            status: statusMap[animal.status] || animal.status,
            currentWeight: animal.currentWeight || '',
            latestMedical: latestMedical ? `${latestMedical.date} ${(typeMapBrief[latestMedical.type] || latestMedical.type)} ${latestMedical.description || ''}` : '',
            latestMedicalDate: latestMedical ? latestMedical.date : '',
            placementStatus: latestPlacement ? (latestPlacement.type === 'adopt' ? '已领养' : '寄养中') : '在站',
            placementDate: latestPlacement ? latestPlacement.startDate : '',
            latestFollowup: latestFollowup ? `${latestFollowup.date} ${latestFollowup.notes || ''}` : '',
            latestFollowupDate: latestFollowup ? latestFollowup.date : '',
            has14DayReminder: hasReminder ? '是' : '否'
        };
    }

    const typeMapBrief = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };

    function exportAnimalsCSV(animalIds) {
        const archives = animalIds.map(id => buildAnimalArchive(id)).filter(Boolean);
        let csv = '\uFEFF';
        csv += '动物档案导出\n\n';
        csv += '名称,物种,品种,性别,年龄,毛色,芯片号,来源,入站日期,状态,当前体重,最近医疗,医疗日期,寄养领养状态,领养日期,最近回访,回访日期,14天内提醒\n';
        archives.forEach(a => {
            const vals = [a.name, a.species, a.breed, a.gender, a.age, a.color, a.chipNumber, a.source, a.intakeDate, a.status, a.currentWeight, a.latestMedical, a.latestMedicalDate, a.placementStatus, a.placementDate, a.latestFollowup, a.latestFollowupDate, a.has14DayReminder];
            csv += vals.map(v => {
                const s = String(v == null ? '' : v);
                if (s.includes(',') || s.includes('"') || s.includes('\n')) return '"' + s.replace(/"/g, '""') + '"';
                return s;
            }).join(',') + '\n';
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `动物档案_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportAnimalsJSON(animalIds) {
        const archives = animalIds.map(id => buildAnimalArchive(id)).filter(Boolean);
        const blob = new Blob([JSON.stringify(archives, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `动物档案_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function init() {
        const panel = document.getElementById('module-animal-list');
        if (!panel) return;

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'al-species-filter') {
                state.species = e.target.value;
                state.currentPage = 1;
                render();
            }
            if (e.target.id === 'al-status-filter') {
                state.status = e.target.value;
                state.currentPage = 1;
                render();
            }
            if (e.target.dataset.check) {
                const id = e.target.dataset.check;
                if (e.target.checked) {
                    state.selectedIds.add(id);
                } else {
                    state.selectedIds.delete(id);
                }
                render();
            }
            if (e.target.id === 'al-select-all') {
                const animals = getFilteredAnimals();
                const startIdx = (state.currentPage - 1) * state.pageSize;
                const pageAnimals = animals.slice(startIdx, startIdx + state.pageSize);
                if (e.target.checked) {
                    pageAnimals.forEach(a => state.selectedIds.add(a.id));
                } else {
                    pageAnimals.forEach(a => state.selectedIds.delete(a.id));
                }
                render();
            }
        });

        panel.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('[data-view]');
            if (viewBtn) {
                state.viewMode = viewBtn.dataset.view;
                render();
                return;
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'view') showViewModal(id);
                if (action === 'edit') showEditModal(id);
                if (action === 'delete') confirmDelete(id);
                return;
            }
            if (e.target.id === 'al-add-btn') {
                showEditModal(null);
                return;
            }
            if (e.target.id === 'al-batch-btn') {
                const sel = document.getElementById('al-batch-status');
                if (sel && state.selectedIds.size > 0) {
                    Store.batchUpdateStatus(Array.from(state.selectedIds), sel.value);
                    state.selectedIds.clear();
                    render();
                }
                return;
            }
            if (e.target.id === 'al-batch-export-csv') {
                if (state.selectedIds.size > 0) {
                    exportAnimalsCSV(Array.from(state.selectedIds));
                }
                return;
            }
            if (e.target.id === 'al-batch-export-json') {
                if (state.selectedIds.size > 0) {
                    exportAnimalsJSON(Array.from(state.selectedIds));
                }
                return;
            }
            if (e.target.id === 'al-batch-cancel') {
                state.selectedIds.clear();
                render();
                return;
            }
            if (e.target.id === 'al-export-list-btn') {
                const animals = getFilteredAnimals();
                exportAnimalsCSV(animals.map(a => a.id));
                return;
            }
            const pageBtn = e.target.closest('[data-page]');
            if (pageBtn) {
                state.currentPage = parseInt(pageBtn.dataset.page);
                render();
                return;
            }
            const card = e.target.closest('.animal-card');
            if (card && state.viewMode === 'card') {
                showViewModal(card.dataset.id);
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'al-modal-close' || e.target.id === 'al-modal-close-btn') {
                closeModal();
                return;
            }
            if (e.target.id === 'al-modal-save') {
                saveAnimal();
                return;
            }
            const tlFilterBtn = e.target.closest('[data-tl-filter]');
            if (tlFilterBtn) {
                state.timelineFilter = tlFilterBtn.dataset.tlFilter;
                const tlArea = document.getElementById('al-timeline-area');
                if (tlArea) {
                    const animalId = tlArea.dataset.animalId;
                    if (animalId) tlArea.innerHTML = renderTimeline(animalId);
                }
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });

        const searchInput = document.getElementById('globalSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                state.searchQuery = e.target.value.trim();
                state.currentPage = 1;
                if (document.getElementById('module-animal-list').classList.contains('active')) {
                    render();
                }
            });
        }
    }

    return { init, render };
})();
