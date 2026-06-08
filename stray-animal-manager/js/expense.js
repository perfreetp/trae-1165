const Expense = (() => {
    const categoryMap = {
        donation: '捐赠',
        medical: '医疗',
        food: '粮食',
        supply: '物资',
        utility: '水电',
        other: '其他'
    };

    const invCategoryMap = {
        food: '粮食',
        medicine: '药品',
        supply: '用品',
        other: '其他'
    };

    const typeMap = {
        income: '收入',
        expense: '支出'
    };

    let state = {
        activeTab: 'records',
        editExpenseId: null,
        editInventoryId: null,
        filterStartMonth: '',
        filterEndMonth: '',
        filterCategory: ''
    };

    function getExpenseStats() {
        const all = Store.getAllExpenses();
        const totalIncome = all.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
        const totalExpense = all.filter(e => e.type === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
        const balance = totalIncome - totalExpense;
        const now = new Date();
        const prefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        const monthExpense = all.filter(e => e.type === 'expense' && e.date && e.date.startsWith(prefix)).reduce((s, e) => s + (e.amount || 0), 0);
        return { totalIncome, totalExpense, balance, monthExpense };
    }

    function getInventoryStats() {
        const all = Store.getAllInventory();
        const totalItems = all.length;
        const lowStock = all.filter(i => i.quantity <= i.minQuantity).length;
        const foodItems = all.filter(i => i.category === 'food').length;
        return { totalItems, lowStock, foodItems };
    }

    function getFilteredExpenses() {
        let records = Store.getAllExpenses();
        if (state.filterStartMonth) {
            const start = state.filterStartMonth + '-01';
            records = records.filter(r => r.date >= start);
        }
        if (state.filterEndMonth) {
            const end = state.filterEndMonth + '-31';
            records = records.filter(r => r.date <= end);
        }
        if (state.filterCategory) {
            records = records.filter(r => r.category === state.filterCategory);
        }
        return records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function renderTabs() {
        const tabs = [
            { key: 'records', label: '收支记录' },
            { key: 'inventory', label: '物资库存' }
        ];
        const items = tabs.map(t =>
            `<div class="tab-item${state.activeTab === t.key ? ' active' : ''}" data-tab="${t.key}">${t.label}</div>`
        ).join('');
        return `<div class="tabs">${items}</div>`;
    }

    function renderExpenseStatsCards() {
        const stats = getExpenseStats();
        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon green">📈</div>
                <div class="stat-info">
                    <div class="stat-value">¥${stats.totalIncome.toFixed(2)}</div>
                    <div class="stat-label">总收入</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">📉</div>
                <div class="stat-info">
                    <div class="stat-value">¥${stats.totalExpense.toFixed(2)}</div>
                    <div class="stat-label">总支出</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">💵</div>
                <div class="stat-info">
                    <div class="stat-value">¥${stats.balance.toFixed(2)}</div>
                    <div class="stat-label">余额</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">📅</div>
                <div class="stat-info">
                    <div class="stat-value">¥${stats.monthExpense.toFixed(2)}</div>
                    <div class="stat-label">本月支出</div>
                </div>
            </div>
        </div>`;
    }

    function renderFilterBar() {
        const catOptions = Object.entries(categoryMap).map(([k, v]) =>
            `<option value="${k}"${state.filterCategory === k ? ' selected' : ''}>${v}</option>`
        ).join('');
        return `<div class="filter-bar">
            <input type="month" id="ex-filter-start" value="${state.filterStartMonth}" placeholder="起始月份">
            <input type="month" id="ex-filter-end" value="${state.filterEndMonth}" placeholder="结束月份">
            <select id="ex-filter-category">
                <option value="">全部</option>
                ${catOptions}
            </select>
        </div>`;
    }

    function renderExpenseTable() {
        const records = getFilteredExpenses();
        if (!records.length) {
            return `<div class="empty-state"><div class="empty-icon">💰</div><div class="empty-text">暂无收支记录</div></div>`;
        }
        const rows = records.map(r => {
            const typeTag = r.type === 'income'
                ? '<span class="tag tag-income">收入</span>'
                : '<span class="tag tag-expense">支出</span>';
            const catLabel = categoryMap[r.category] || r.category;
            const donorCell = r.category === 'donation' ? (r.donor || '-') : '-';
            return `<tr>
                <td>${r.date || '-'}</td>
                <td><span class="tag">${catLabel}</span></td>
                <td>${typeTag}</td>
                <td>¥${(r.amount || 0).toFixed(2)}</td>
                <td>${r.description || '-'}</td>
                <td>${donorCell}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="edit-expense" data-id="${r.id}">编辑</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-expense" data-id="${r.id}">删除</button>
                </td>
            </tr>`;
        }).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>日期</th><th>分类</th><th>类型</th><th>金额</th><th>描述</th><th>捐赠人</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function renderRecordsTab() {
        return `${renderExpenseStatsCards()}
            ${renderFilterBar()}
            <div class="panel-header">
                <h2 class="panel-title">收支记录</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="ex-add-expense-btn">新增记录</button>
                </div>
            </div>
            ${renderExpenseTable()}`;
    }

    function renderInventoryStatsCards() {
        const stats = getInventoryStats();
        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon blue">📦</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.totalItems}</div>
                    <div class="stat-label">物资总数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">⚠️</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.lowStock}</div>
                    <div class="stat-label">库存预警</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🍖</div>
                <div class="stat-info">
                    <div class="stat-value">${stats.foodItems}</div>
                    <div class="stat-label">粮食类</div>
                </div>
            </div>
        </div>`;
    }

    function renderInventoryList() {
        const items = Store.getAllInventory();
        if (!items.length) {
            return `<div class="empty-state"><div class="empty-icon">📦</div><div class="empty-text">暂无物资记录</div></div>`;
        }
        const rows = items.map(i => {
            const catLabel = invCategoryMap[i.category] || i.category;
            const isLow = i.quantity <= i.minQuantity;
            const statusTag = isLow
                ? '<span class="tag tag-expense">库存不足</span>'
                : '<span class="tag tag-income">正常</span>';
            const nameClass = isLow ? 'inv-name inv-low' : 'inv-name';
            return `<div class="inventory-item card">
                <div class="card-header">
                    <span class="${nameClass}">${i.name}</span>
                    ${statusTag}
                </div>
                <div class="card-body">
                    <div class="inv-qty">分类：${catLabel}</div>
                    <div class="inv-qty">库存：${i.quantity} ${i.unit || '个'}</div>
                    <div class="inv-qty">最低库存：${i.minQuantity} ${i.unit || '个'}</div>
                </div>
                <div style="margin-top:8px">
                    <button class="btn btn-sm btn-outline" data-action="edit-inventory" data-id="${i.id}">编辑</button>
                    <button class="btn btn-sm btn-warning" data-action="adjust-stock" data-id="${i.id}">调整库存</button>
                    <button class="btn btn-sm btn-danger" data-action="delete-inventory" data-id="${i.id}">删除</button>
                </div>
            </div>`;
        }).join('');
        return `<div>${rows}</div>`;
    }

    function renderInventoryTab() {
        return `${renderInventoryStatsCards()}
            <div class="panel-header">
                <h2 class="panel-title">物资库存</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="ex-add-inventory-btn">新增物资</button>
                </div>
            </div>
            ${renderInventoryList()}`;
    }

    function renderCapacitySection() {
        const config = Store.loadConfig();
        const stats = Store.getStats();
        const capacity = config.stationCapacity || 50;
        const inStation = stats.inStation || 0;
        const percent = capacity > 0 ? Math.min((inStation / capacity) * 100, 100) : 0;
        const fillColor = percent > 90 ? '#e74c3c' : percent > 70 ? '#f39c12' : '#27ae60';
        return `<div class="section-divider">站内容量</div>
            <div class="card">
                <div class="card-body">
                    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
                        <span>当前在站：<strong>${inStation}</strong> / <strong>${capacity}</strong></span>
                        <button class="btn btn-sm btn-outline" id="ex-edit-capacity-btn">编辑容量</button>
                    </div>
                    <div class="capacity-bar">
                        <div class="capacity-fill" style="width:${percent}%;background:${fillColor}"></div>
                    </div>
                    <div class="capacity-text">${inStation} / ${capacity}（${percent.toFixed(1)}%）</div>
                </div>
            </div>`;
    }

    function render() {
        const panel = document.getElementById('module-expense');
        if (!panel) return;
        const tabContent = state.activeTab === 'records' ? renderRecordsTab() : renderInventoryTab();
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">费用物资</h2>
                <div class="panel-actions"></div>
            </div>
            ${renderTabs()}
            ${tabContent}
            ${renderCapacitySection()}`;
    }

    function showExpenseModal(id) {
        const record = id ? Store.getAllExpenses().find(r => r.id === id) : null;
        const isEdit = !!record;
        state.editExpenseId = id || null;
        const catOptions = Object.entries(categoryMap).map(([k, v]) => {
            const sel = isEdit && record.category === k ? ' selected' : '';
            return `<option value="${k}"${sel}>${v}</option>`;
        }).join('');
        const donorDisplay = isEdit && record.category === 'donation' ? '' : 'style="display:none"';

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑收支记录' : '新增记录'}</h3>
                <button class="modal-close" id="ex-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>日期</label>
                        <input type="date" id="ex-f-date" value="${isEdit ? record.date : new Date().toISOString().split('T')[0]}">
                    </div>
                    <div class="form-group">
                        <label>类型</label>
                        <div class="radio-group">
                            <label><input type="radio" name="ex-f-type" value="income"${isEdit && record.type === 'income' ? ' checked' : (!isEdit ? '' : '')}${!isEdit && !record ? '' : ''}>收入</label>
                            <label><input type="radio" name="ex-f-type" value="expense"${isEdit && record.type === 'expense' ? ' checked' : (!isEdit ? ' checked' : '')}>支出</label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select id="ex-f-category">${catOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>金额</label>
                        <input type="number" id="ex-f-amount" step="0.01" min="0" value="${isEdit ? record.amount : ''}" placeholder="请输入金额">
                    </div>
                    <div class="form-group full-width">
                        <label>描述</label>
                        <textarea id="ex-f-desc" placeholder="请输入描述">${isEdit ? record.description : ''}</textarea>
                    </div>
                    <div class="form-group" id="ex-f-donor-group" ${donorDisplay}>
                        <label>捐赠人</label>
                        <input type="text" id="ex-f-donor" value="${isEdit ? record.donor : ''}" placeholder="请输入捐赠人">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ex-modal-cancel">取消</button>
                <button class="btn btn-primary" id="ex-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');

        setTimeout(() => {
            const catSelect = document.getElementById('ex-f-category');
            if (catSelect) {
                catSelect.addEventListener('change', toggleDonorField);
            }
        }, 0);
    }

    function toggleDonorField() {
        const catSelect = document.getElementById('ex-f-category');
        const donorGroup = document.getElementById('ex-f-donor-group');
        if (!catSelect || !donorGroup) return;
        donorGroup.style.display = catSelect.value === 'donation' ? '' : 'none';
    }

    function saveExpense() {
        const typeRadio = document.querySelector('input[name="ex-f-type"]:checked');
        const data = {
            date: document.getElementById('ex-f-date').value,
            type: typeRadio ? typeRadio.value : 'expense',
            category: document.getElementById('ex-f-category').value,
            amount: parseFloat(document.getElementById('ex-f-amount').value) || 0,
            description: document.getElementById('ex-f-desc').value.trim(),
            donor: document.getElementById('ex-f-donor') ? document.getElementById('ex-f-donor').value.trim() : ''
        };
        if (state.editExpenseId) {
            Store.updateExpense(state.editExpenseId, data);
        } else {
            Store.createExpense(data);
        }
        closeModal();
        render();
    }

    function deleteExpense(id) {
        if (!confirm('确定删除此收支记录？')) return;
        Store.deleteExpense(id);
        render();
    }

    function showInventoryModal(id) {
        const item = id ? Store.getAllInventory().find(i => i.id === id) : null;
        const isEdit = !!item;
        state.editInventoryId = id || null;
        const catOptions = Object.entries(invCategoryMap).map(([k, v]) => {
            const sel = isEdit && item.category === k ? ' selected' : '';
            return `<option value="${k}"${sel}>${v}</option>`;
        }).join('');

        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑物资' : '新增物资'}</h3>
                <button class="modal-close" id="ex-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>名称</label>
                        <input type="text" id="ex-inv-name" value="${isEdit ? item.name : ''}" placeholder="请输入物资名称">
                    </div>
                    <div class="form-group">
                        <label>分类</label>
                        <select id="ex-inv-category">${catOptions}</select>
                    </div>
                    <div class="form-group">
                        <label>数量</label>
                        <input type="number" id="ex-inv-qty" min="0" value="${isEdit ? item.quantity : ''}" placeholder="请输入数量">
                    </div>
                    <div class="form-group">
                        <label>单位</label>
                        <input type="text" id="ex-inv-unit" value="${isEdit ? item.unit : '个'}" placeholder="请输入单位">
                    </div>
                    <div class="form-group">
                        <label>最低库存</label>
                        <input type="number" id="ex-inv-min" min="0" value="${isEdit ? item.minQuantity : ''}" placeholder="请输入最低库存">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ex-modal-cancel">取消</button>
                <button class="btn btn-primary" id="ex-inv-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function saveInventory() {
        const data = {
            name: document.getElementById('ex-inv-name').value.trim(),
            category: document.getElementById('ex-inv-category').value,
            quantity: parseFloat(document.getElementById('ex-inv-qty').value) || 0,
            unit: document.getElementById('ex-inv-unit').value.trim() || '个',
            minQuantity: parseFloat(document.getElementById('ex-inv-min').value) || 0
        };
        if (state.editInventoryId) {
            Store.updateInventory(state.editInventoryId, data);
        } else {
            Store.createInventory(data);
        }
        closeModal();
        render();
    }

    function deleteInventory(id) {
        if (!confirm('确定删除此物资？')) return;
        Store.deleteInventory(id);
        render();
    }

    function showStockAdjustModal(id) {
        const item = Store.getAllInventory().find(i => i.id === id);
        if (!item) return;
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">调整库存 - ${item.name}</h3>
                <button class="modal-close" id="ex-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>当前库存</label>
                        <input type="text" value="${item.quantity} ${item.unit || '个'}" disabled>
                    </div>
                    <div class="form-group">
                        <label>增减数量</label>
                        <input type="number" id="ex-stock-adjust" placeholder="正数增加，负数减少">
                    </div>
                    <div class="form-group full-width">
                        <label>原因</label>
                        <input type="text" id="ex-stock-reason" placeholder="请输入调整原因">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ex-modal-cancel">取消</button>
                <button class="btn btn-primary" id="ex-stock-save">确认调整</button>
            </div>`;
        overlay.classList.add('active');
        overlay._stockItemId = id;
    }

    function saveStockAdjust() {
        const overlay = document.getElementById('modalOverlay');
        const itemId = overlay._stockItemId;
        const item = Store.getAllInventory().find(i => i.id === itemId);
        if (!item) return;
        const adjust = parseFloat(document.getElementById('ex-stock-adjust').value) || 0;
        const newQty = Math.max(0, item.quantity + adjust);
        Store.updateInventory(itemId, { quantity: newQty });
        closeModal();
        render();
    }

    function showCapacityModal() {
        const config = Store.loadConfig();
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">编辑站内容量</h3>
                <button class="modal-close" id="ex-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group">
                        <label>最大容量</label>
                        <input type="number" id="ex-capacity-value" min="1" value="${config.stationCapacity || 50}" placeholder="请输入最大容量">
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ex-modal-cancel">取消</button>
                <button class="btn btn-primary" id="ex-capacity-save">保存</button>
            </div>`;
        overlay.classList.add('active');
    }

    function saveCapacity() {
        const val = parseInt(document.getElementById('ex-capacity-value').value) || 50;
        const config = Store.loadConfig();
        config.stationCapacity = val;
        Store.saveConfig(config);
        closeModal();
        render();
        if (typeof App !== 'undefined') App.updateCapacity();
    }

    function closeModal() {
        const overlay = document.getElementById('modalOverlay');
        overlay.classList.remove('active');
        const container = document.getElementById('modalContainer');
        container.className = 'modal-container';
        delete overlay._stockItemId;
        state.editExpenseId = null;
        state.editInventoryId = null;
    }

    function init() {
        const panel = document.getElementById('module-expense');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            const tabItem = e.target.closest('.tab-item');
            if (tabItem) {
                state.activeTab = tabItem.dataset.tab;
                render();
                return;
            }
            if (e.target.id === 'ex-add-expense-btn') {
                showExpenseModal(null);
                return;
            }
            if (e.target.id === 'ex-add-inventory-btn') {
                showInventoryModal(null);
                return;
            }
            if (e.target.id === 'ex-edit-capacity-btn') {
                showCapacityModal();
                return;
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'edit-expense') showExpenseModal(id);
                if (action === 'delete-expense') deleteExpense(id);
                if (action === 'edit-inventory') showInventoryModal(id);
                if (action === 'delete-inventory') deleteInventory(id);
                if (action === 'adjust-stock') showStockAdjustModal(id);
                return;
            }
        });

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'ex-filter-start') {
                state.filterStartMonth = e.target.value;
                render();
                return;
            }
            if (e.target.id === 'ex-filter-end') {
                state.filterEndMonth = e.target.value;
                render();
                return;
            }
            if (e.target.id === 'ex-filter-category') {
                state.filterCategory = e.target.value;
                render();
                return;
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'ex-modal-close' || e.target.id === 'ex-modal-cancel') {
                closeModal();
                return;
            }
            if (e.target.id === 'ex-modal-save') {
                saveExpense();
                return;
            }
            if (e.target.id === 'ex-inv-modal-save') {
                saveInventory();
                return;
            }
            if (e.target.id === 'ex-stock-save') {
                saveStockAdjust();
                return;
            }
            if (e.target.id === 'ex-capacity-save') {
                saveCapacity();
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    return { init, render };
})();
