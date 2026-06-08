const Foster = (() => {
    let state = {
        activeTab: 'placements',
        editPlacementId: null,
        editFamilyId: null
    };

    const speciesMap = { cat: '猫', dog: '狗' };

    function typeTag(type) {
        if (type === 'foster') return '<span class="tag tag-fostered">寄养</span>';
        return '<span class="tag tag-adopted">领养</span>';
    }

    function getFamilyStats() {
        const families = Store.getAllFamilies();
        return {
            total: families.length,
            foster: families.filter(f => f.type === 'foster').length,
            adopt: families.filter(f => f.type === 'adopt').length
        };
    }

    function computeMatchScore(family, animal) {
        let score = 50;
        const prefs = (family.preferences || '').toLowerCase();
        if (prefs.includes(animal.species === 'cat' ? '猫' : '狗')) score += 20;
        if (animal.breed && prefs.includes(animal.breed.toLowerCase())) score += 15;
        if (animal.gender !== 'unknown' && prefs.includes(animal.gender === 'male' ? '公' : '母')) score += 10;
        if (family.experience && family.experience.length > 10) score += 10;
        if (family.conditions && family.conditions.length > 10) score += 5;
        return Math.min(99, score);
    }

    function matchScoreClass(score) {
        if (score >= 80) return 'match-high';
        if (score >= 60) return 'match-medium';
        return 'match-low';
    }

    function renderTabs() {
        const tabs = [
            { key: 'placements', label: '寄养领养记录' },
            { key: 'families', label: '家庭管理' }
        ];
        return `<div class="tabs">${tabs.map(t =>
            `<div class="tab-item${state.activeTab === t.key ? ' active' : ''}" data-tab="${t.key}">${t.label}</div>`
        ).join('')}</div>`;
    }

    function renderPlacementHeader() {
        return `<div class="panel-header">
            <h2 class="panel-title">寄养领养记录</h2>
            <div class="panel-actions">
                <button class="btn btn-primary" id="fs-add-placement-btn">新增寄养/领养</button>
            </div>
        </div>`;
    }

    function renderPlacementTable() {
        const placements = Store.getAllPlacements();
        if (!placements.length) {
            return `<div class="empty-state"><div class="empty-icon">🏠</div><div class="empty-text">暂无寄养领养记录</div></div>`;
        }
        const rows = placements.map(p => {
            const animal = Store.getAnimal(p.animalId);
            const family = Store.getFamily(p.familyId);
            const animalName = animal ? animal.name : '未知';
            const familyName = family ? family.name : '未知';
            const checkIcon = p.agreementPrinted ? '✅' : '❌';
            return `<tr>
                <td>${animalName}</td>
                <td>${familyName}</td>
                <td>${typeTag(p.type)}</td>
                <td>${p.startDate || '-'}</td>
                <td>${p.endDate || '-'}</td>
                <td>${checkIcon}</td>
                <td>${p.notes || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="edit-placement" data-id="${p.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-placement" data-id="${p.id}">删除</button>
                    <button class="btn btn-sm btn-outline" data-action="print-agreement" data-id="${p.id}">打印协议</button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>动物名称</th><th>家庭名称</th><th>类型</th><th>开始日期</th><th>结束日期</th><th>协议已打印</th><th>备注</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function renderFamilyHeader() {
        return `<div class="panel-header">
            <h2 class="panel-title">家庭管理</h2>
            <div class="panel-actions">
                <button class="btn btn-primary" id="fs-add-family-btn">添加家庭</button>
            </div>
        </div>`;
    }

    function renderFamilyStats() {
        const stats = getFamilyStats();
        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon blue">👨‍👩‍👧‍👦</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.total}</div>
                    <div class="stat-label">家庭总数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🏠</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.foster}</div>
                    <div class="stat-label">寄养家庭</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">❤️</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.adopt}</div>
                    <div class="stat-label">领养家庭</div>
                </div>
            </div>
        </div>`;
    }

    function renderFamilyTable() {
        const families = Store.getAllFamilies();
        if (!families.length) {
            return `<div class="empty-state"><div class="empty-icon">👨‍👩‍👧‍👦</div><div class="empty-text">暂无家庭记录</div></div>`;
        }
        const rows = families.map(f => {
            return `<tr>
                <td>${f.name}</td>
                <td>${f.contact || '-'}</td>
                <td>${f.phone || '-'}</td>
                <td>${f.address || '-'}</td>
                <td>${typeTag(f.type)}</td>
                <td>${f.preferences || '-'}</td>
                <td>${f.experience || '-'}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="edit-family" data-id="${f.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-family" data-id="${f.id}">删除</button>
                    <button class="btn btn-sm btn-secondary" data-action="match-family" data-id="${f.id}">匹配</button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>名称</th><th>联系人</th><th>电话</th><th>地址</th><th>类型</th><th>偏好</th><th>经验</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function render() {
        const panel = document.getElementById('module-foster');
        if (!panel) return;
        let content = renderTabs();
        if (state.activeTab === 'placements') {
            content += renderPlacementHeader() + renderPlacementTable();
        } else {
            content += renderFamilyHeader() + renderFamilyStats() + renderFamilyTable();
        }
        panel.innerHTML = content;
    }

    function showPlacementModal(id) {
        const placement = id ? Store.getAllPlacements().find(p => p.id === id) : null;
        const isEdit = !!placement;
        state.editPlacementId = id || null;

        const animals = Store.getAllAnimals().filter(a => a.status === 'isolated' || a.status === 'available');
        const families = Store.getAllFamilies();

        const animalOptions = animals.map(a => {
            const sel = isEdit && placement.animalId === a.id ? ' selected' : '';
            return `<option value="${a.id}"${sel}>${a.name}（${speciesMap[a.species] || a.species}）</option>`;
        }).join('');

        const familyOptions = families.map(f => {
            const sel = isEdit && placement.familyId === f.id ? ' selected' : '';
            const typeLabel = f.type === 'foster' ? '寄养' : '领养';
            return `<option value="${f.id}"${sel}>${f.name}（${typeLabel}）</option>`;
        }).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑寄养/领养' : '新增寄养/领养'}</h3>
                <button class="modal-close" id="fs-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>动物</label>
                        <select id="fs-f-animal">
                            <option value="">请选择动物</option>
                            ${animalOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>家庭</label>
                        <select id="fs-f-family">
                            <option value="">请选择家庭</option>
                            ${familyOptions}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <div class="radio-group">
                            <label><input type="radio" name="fs-f-type" value="foster"${!isEdit || placement.type === 'foster' ? ' checked' : ''}>寄养</label>
                            <label><input type="radio" name="fs-f-type" value="adopt"${isEdit && placement.type === 'adopt' ? ' checked' : ''}>领养</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>开始日期</label>
                        <input type="date" id="fs-f-start" value="${isEdit ? placement.startDate : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>结束日期</label>
                        <input type="date" id="fs-f-end" value="${isEdit ? (placement.endDate || '') : ''}">
                    </div>
                    <div class="form-group">
                        <label><input type="checkbox" id="fs-f-agreement"${isEdit && placement.agreementPrinted ? ' checked' : ''}> 协议已打印</label>
                    </div>
                    <div class="form-group full-width">
                        <label>备注</label>
                        <textarea id="fs-f-notes" placeholder="请输入备注">${isEdit ? (placement.notes || '') : ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fs-modal-cancel">取消</button>
                <button class="btn btn-primary" id="fs-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function savePlacement() {
        const animalId = document.getElementById('fs-f-animal').value;
        const familyId = document.getElementById('fs-f-family').value;
        if (!animalId || !familyId) return;

        const typeEl = document.querySelector('input[name="fs-f-type"]:checked');
        const data = {
            animalId,
            familyId,
            type: typeEl ? typeEl.value : 'foster',
            startDate: document.getElementById('fs-f-start').value,
            endDate: document.getElementById('fs-f-end').value,
            agreementPrinted: document.getElementById('fs-f-agreement').checked,
            notes: document.getElementById('fs-f-notes').value.trim()
        };

        if (state.editPlacementId) {
            Store.deletePlacement(state.editPlacementId);
        }
        Store.createPlacement(data);
        closeModal();
        render();
    }

    function deletePlacement(id) {
        if (!confirm('确定删除此寄养/领养记录？')) return;
        Store.deletePlacement(id);
        render();
    }

    function showFamilyModal(id) {
        const family = id ? Store.getFamily(id) : null;
        const isEdit = !!family;
        state.editFamilyId = id || null;

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑家庭' : '添加家庭'}</h3>
                <button class="modal-close" id="fs-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>家庭名称/联系人</label>
                        <input type="text" id="fs-f-name" value="${isEdit ? family.name : ''}" placeholder="请输入名称">
                    </div>
                    <div class="form-group">
                        <label>联系人</label>
                        <input type="text" id="fs-f-contact" value="${isEdit ? (family.contact || '') : ''}" placeholder="请输入联系人">
                    </div>
                    <div class="form-group">
                        <label>电话</label>
                        <input type="text" id="fs-f-phone" value="${isEdit ? (family.phone || '') : ''}" placeholder="请输入电话">
                    </div>
                    <div class="form-group">
                        <label>地址</label>
                        <input type="text" id="fs-f-address" value="${isEdit ? (family.address || '') : ''}" placeholder="请输入地址">
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <div class="radio-group">
                            <label><input type="radio" name="fs-f-ftype" value="foster"${!isEdit || family.type === 'foster' ? ' checked' : ''}>寄养</label>
                            <label><input type="radio" name="fs-f-ftype" value="adopt"${isEdit && family.type === 'adopt' ? ' checked' : ''}>领养</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>居住条件</label>
                        <input type="text" id="fs-f-conditions" value="${isEdit ? (family.conditions || '') : ''}" placeholder="请输入居住条件">
                    </div>
                    <div class="form-group full-width">
                        <label>偏好要求</label>
                        <textarea id="fs-f-preferences" placeholder="请输入偏好要求">${isEdit ? (family.preferences || '') : ''}</textarea>
                    </div>
                    <div class="form-group full-width">
                        <label>养宠经验</label>
                        <textarea id="fs-f-experience" placeholder="请输入养宠经验">${isEdit ? (family.experience || '') : ''}</textarea>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fs-modal-cancel">取消</button>
                <button class="btn btn-primary" id="fs-modal-save-family">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function saveFamily() {
        const name = document.getElementById('fs-f-name').value.trim();
        if (!name) return;

        const typeEl = document.querySelector('input[name="fs-f-ftype"]:checked');
        const data = {
            name,
            contact: document.getElementById('fs-f-contact').value.trim(),
            phone: document.getElementById('fs-f-phone').value.trim(),
            address: document.getElementById('fs-f-address').value.trim(),
            type: typeEl ? typeEl.value : 'adopt',
            conditions: document.getElementById('fs-f-conditions').value.trim(),
            preferences: document.getElementById('fs-f-preferences').value.trim(),
            experience: document.getElementById('fs-f-experience').value.trim()
        };

        if (state.editFamilyId) {
            Store.updateFamily(state.editFamilyId, data);
        } else {
            Store.createFamily(data);
        }
        closeModal();
        render();
    }

    function deleteFamily(id) {
        if (!confirm('确定删除此家庭？')) return;
        Store.deleteFamily(id);
        render();
    }

    function showMatchModal(familyId) {
        const family = Store.getFamily(familyId);
        if (!family) return;

        const animals = Store.getAllAnimals().filter(a => a.status === 'available' || a.status === 'fostered');
        if (!animals.length) {
            const overlay = document.getElementById('modalOverlay');
            const container = document.getElementById('modalContainer');
            container.className = 'modal-container';
            container.innerHTML = `
                <div class="modal-header">
                    <h3 class="modal-title">匹配动物 - ${family.name}</h3>
                    <button class="modal-close" id="fs-modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-text">暂无可匹配的动物</div></div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-outline" id="fs-modal-cancel">关闭</button>
                </div>`;
            overlay.classList.add('active');
            return;
        }

        const animalCards = animals.map(a => {
            const score = computeMatchScore(family, a);
            const cls = matchScoreClass(score);
            return `<div class="card">
                <div class="card-header">
                    <strong>${a.name}</strong>
                    <span class="tag tag-${a.species}">${speciesMap[a.species] || a.species}</span>
                </div>
                <div class="card-body">
                    <div>品种：${a.breed || '-'}</div>
                    <div>毛色：${a.color || '-'}</div>
                    <div>状态：${a.status === 'available' ? '可领养' : '寄养中'}</div>
                    <div class="adopter-match-score ${cls}">匹配度：${score}%</div>
                </div>
            </div>`;
        }).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">匹配动物 - ${family.name}</h3>
                <button class="modal-close" id="fs-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;">
                    ${animalCards}
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="fs-modal-cancel">关闭</button>
            </div>`;
        overlay.classList.add('active');
    }

    function printAgreement(id) {
        const placement = Store.getAllPlacements().find(p => p.id === id);
        if (!placement) return;

        const animal = Store.getAnimal(placement.animalId);
        const family = Store.getFamily(placement.familyId);
        if (!animal || !family) return;

        const config = Store.loadConfig();
        const stationName = config.stationName || '流浪动物救助站';
        const typeLabel = placement.type === 'foster' ? '寄养' : '领养';
        const today = new Date().toISOString().split('T')[0];

        const existingPrint = document.querySelector('.print-area');
        if (existingPrint) existingPrint.remove();

        const printDiv = document.createElement('div');
        printDiv.className = 'print-area';
        printDiv.innerHTML = `
            <h2 style="text-align:center;margin-bottom:4px;">${stationName}</h2>
            <h3 style="text-align:center;margin-bottom:20px;">${typeLabel}协议书</h3>
            <p style="margin-bottom:12px;">协议编号：${placement.id}</p>
            <p style="margin-bottom:12px;">签订日期：${today}</p>
            <div style="margin-bottom:16px;">
                <h4>动物信息</h4>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;width:30%;">名称</td><td style="padding:4px 8px;border:1px solid #ccc;">${animal.name}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">种类</td><td style="padding:4px 8px;border:1px solid #ccc;">${speciesMap[animal.species] || animal.species}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">品种</td><td style="padding:4px 8px;border:1px solid #ccc;">${animal.breed || '-'}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">芯片号</td><td style="padding:4px 8px;border:1px solid #ccc;">${animal.chipNumber || '-'}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">毛色</td><td style="padding:4px 8px;border:1px solid #ccc;">${animal.color || '-'}</td></tr>
                </table>
            </div>
            <div style="margin-bottom:16px;">
                <h4>${typeLabel}方信息</h4>
                <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;width:30%;">名称</td><td style="padding:4px 8px;border:1px solid #ccc;">${family.name}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">电话</td><td style="padding:4px 8px;border:1px solid #ccc;">${family.phone || '-'}</td></tr>
                    <tr><td style="padding:4px 8px;border:1px solid #ccc;">地址</td><td style="padding:4px 8px;border:1px solid #ccc;">${family.address || '-'}</td></tr>
                </table>
            </div>
            <div style="margin-bottom:16px;">
                <h4>协议条款</h4>
                <ol>
                    <li>${typeLabel}方承诺为上述动物提供适当的食物、饮水、住所和医疗照顾。</li>
                    <li>${typeLabel}方不得将上述动物转交他人或遗弃。</li>
                    <li>${placement.type === 'foster' ? '寄养期间，救助站保留动物所有权，寄养方须配合救助站的回访工作。' : '领养后，领养方成为动物的合法监护人，须对动物终身负责。'}</li>
                    <li>${typeLabel}方须定期带动物进行健康检查及疫苗接种。</li>
                    <li>如${typeLabel}方无法继续照顾动物，须及时通知救助站并归还动物。</li>
                    <li>本协议一式两份，救助站与${typeLabel}方各执一份，具有同等效力。</li>
                </ol>
            </div>
            <div style="margin-top:40px;display:flex;justify-content:space-between;">
                <div style="width:40%;">
                    <p>救助站代表签字：</p>
                    <div style="border-bottom:1px solid #000;height:40px;margin-top:20px;"></div>
                    <p>日期：____________</p>
                </div>
                <div style="width:40%;">
                    <p>${typeLabel}方签字：</p>
                    <div style="border-bottom:1px solid #000;height:40px;margin-top:20px;"></div>
                    <p>日期：____________</p>
                </div>
            </div>`;
        document.body.appendChild(printDiv);
        window.print();
        setTimeout(() => {
            const el = document.querySelector('.print-area');
            if (el) el.remove();
        }, 1000);
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        state.editPlacementId = null;
        state.editFamilyId = null;
    }

    function init() {
        const panel = document.getElementById('module-foster');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            const tab = e.target.closest('[data-tab]');
            if (tab) {
                state.activeTab = tab.dataset.tab;
                render();
                return;
            }

            if (e.target.id === 'fs-add-placement-btn') {
                showPlacementModal(null);
                return;
            }
            if (e.target.id === 'fs-add-family-btn') {
                showFamilyModal(null);
                return;
            }

            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'edit-placement') showPlacementModal(id);
                if (action === 'delete-placement') deletePlacement(id);
                if (action === 'print-agreement') printAgreement(id);
                if (action === 'edit-family') showFamilyModal(id);
                if (action === 'delete-family') deleteFamily(id);
                if (action === 'match-family') showMatchModal(id);
                return;
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'fs-modal-close' || e.target.id === 'fs-modal-cancel') {
                closeModal();
                return;
            }
            if (e.target.id === 'fs-modal-save') {
                savePlacement();
                return;
            }
            if (e.target.id === 'fs-modal-save-family') {
                saveFamily();
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    return { init, render };
})();
