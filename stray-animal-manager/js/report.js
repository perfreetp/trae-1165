const Report = (() => {
    const speciesMap = { cat: '猫', dog: '狗', other: '其他' };
    const sourceMap = { stray: '流浪救助', surrender: '弃养', rescue: '救援', other: '其他' };
    const medicalTypeMap = { checkup: '体检', vaccination: '疫苗', surgery: '手术', deworming: '驱虫', illness: '疾病', other: '其他' };
    const placementTypeMap = { adopt: '领养', foster: '寄养' };
    const followupTypeMap = { post_adopt: '领养回访', post_foster: '寄养回访', lost: '走失', found: '找回', other: '其他' };
    const followupStatusMap = { normal: '正常', concern: '关注', urgent: '紧急' };
    const expenseCategoryMap = { donation: '捐赠', medical: '医疗', food: '粮食', supply: '物资', utility: '水电', other: '其他' };

    let state = {
        reportYear: new Date().getFullYear(),
        reportMonth: new Date().getMonth() + 1,
        reportData: null
    };

    function generateReport() {
        state.reportData = Store.getMonthlyReport(state.reportYear, state.reportMonth);
        render();
    }

    function renderMonthSelector() {
        const currentYear = new Date().getFullYear();
        const yearOptions = [];
        for (let y = currentYear - 5; y <= currentYear + 1; y++) {
            yearOptions.push(`<option value="${y}"${state.reportYear === y ? ' selected' : ''}>${y}年</option>`);
        }
        const monthOptions = [];
        for (let m = 1; m <= 12; m++) {
            monthOptions.push(`<option value="${m}"${state.reportMonth === m ? ' selected' : ''}>${m}月</option>`);
        }
        return `<div class="form-grid" style="margin-bottom:16px">
            <div class="form-group">
                <label>年份</label>
                <select id="rp-year">${yearOptions.join('')}</select>
            </div>
            <div class="form-group">
                <label>月份</label>
                <select id="rp-month">${monthOptions.join('')}</select>
            </div>
            <div class="form-group" style="display:flex;align-items:flex-end">
                <button class="btn btn-primary" id="rp-generate-btn">生成报表</button>
            </div>
        </div>`;
    }

    function renderReportHeader() {
        const config = Store.loadConfig();
        const period = `${state.reportYear}年${state.reportMonth}月`;
        const now = new Date();
        const genDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        return `<div class="card" style="margin-bottom:16px">
            <div class="card-body" style="text-align:center">
                <h2 style="margin:0 0 8px 0">${config.stationName || '流浪动物救助站'}</h2>
                <h3 style="margin:0 0 8px 0;color:#666">月度救助报表</h3>
                <div class="detail-grid" style="max-width:400px;margin:0 auto">
                    <div class="detail-item">
                        <span class="detail-label">报表期间</span>
                        <span class="detail-value">${period}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">生成日期</span>
                        <span class="detail-value">${genDate}</span>
                    </div>
                </div>
            </div>
        </div>`;
    }

    function renderSummaryCards() {
        const data = state.reportData;
        const newIntakes = data.animals.length;
        const adoptions = data.placements.filter(p => p.type === 'adopt').length;
        const fosters = data.placements.filter(p => p.type === 'foster').length;
        const medicalCount = data.medicals.length;
        const followupCount = data.followups.length;
        const totalIncome = data.expenses.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
        const totalExpense = data.expenses.filter(e => e.type === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        const tc = Store.getReminderTypeCounts();
        const todayCount = tc.today;
        const totalReminders = tc.total;

        return `<div class="stat-cards">
            <div class="stat-card">
                <div class="stat-icon blue">🐾</div>
                <div class="stat-info">
                    <div class="stat-value">${newIntakes}</div>
                    <div class="stat-label">新入站动物数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">🏠</div>
                <div class="stat-info">
                    <div class="stat-value">${adoptions}</div>
                    <div class="stat-label">领养数量</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🤝</div>
                <div class="stat-info">
                    <div class="stat-value">${fosters}</div>
                    <div class="stat-label">寄养数量</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">🏥</div>
                <div class="stat-info">
                    <div class="stat-value">${medicalCount}</div>
                    <div class="stat-label">医疗记录数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple">📋</div>
                <div class="stat-info">
                    <div class="stat-value">${followupCount}</div>
                    <div class="stat-label">回访记录数</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">🔴</div>
                <div class="stat-info">
                    <div class="stat-value">${todayCount}</div>
                    <div class="stat-label">今天到期提醒</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange">🔔</div>
                <div class="stat-info">
                    <div class="stat-value">${totalReminders}</div>
                    <div class="stat-label">14天内提醒总计</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green">📈</div>
                <div class="stat-info">
                    <div class="stat-value">¥${totalIncome.toFixed(2)}</div>
                    <div class="stat-label">总收入</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon red">📉</div>
                <div class="stat-info">
                    <div class="stat-value">¥${totalExpense.toFixed(2)}</div>
                    <div class="stat-label">总支出</div>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue">💵</div>
                <div class="stat-info">
                    <div class="stat-value">¥${balance.toFixed(2)}</div>
                    <div class="stat-label">余额</div>
                </div>
            </div>
        </div>`;
    }

    function renderIntakesTable() {
        const animals = state.reportData.animals;
        if (!animals.length) return '';
        const rows = animals.map(a => `<tr>
            <td>${a.name || '-'}</td>
            <td>${speciesMap[a.species] || a.species || '-'}</td>
            <td>${a.breed || '-'}</td>
            <td>${sourceMap[a.source] || a.source || '-'}</td>
            <td>${a.intakeDate || '-'}</td>
        </tr>`).join('');
        return `<div class="section-divider">新入站动物</div>
            <div class="table-container"><table>
                <thead><tr><th>名称</th><th>物种</th><th>品种</th><th>来源</th><th>入站日期</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    }

    function renderMedicalTable() {
        const medicals = state.reportData.medicals;
        if (!medicals.length) return '';
        const rows = medicals.map(m => {
            const animal = Store.getAnimal(m.animalId);
            return `<tr>
                <td>${animal ? animal.name : '未知'}</td>
                <td>${medicalTypeMap[m.type] || m.type || '-'}</td>
                <td>${m.description || '-'}</td>
                <td>${m.vet || '-'}</td>
                <td>¥${(m.cost || 0).toFixed(2)}</td>
            </tr>`;
        }).join('');
        return `<div class="section-divider">医疗记录</div>
            <div class="table-container"><table>
                <thead><tr><th>动物名称</th><th>类型</th><th>描述</th><th>兽医</th><th>费用</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    }

    function renderPlacementsTable() {
        const placements = state.reportData.placements;
        if (!placements.length) return '';
        const rows = placements.map(p => {
            const animal = Store.getAnimal(p.animalId);
            const family = Store.getFamily(p.familyId);
            return `<tr>
                <td>${animal ? animal.name : '未知'}</td>
                <td>${family ? family.name : '未知'}</td>
                <td>${placementTypeMap[p.type] || p.type || '-'}</td>
                <td>${p.startDate || '-'}</td>
            </tr>`;
        }).join('');
        return `<div class="section-divider">领养/寄养记录</div>
            <div class="table-container"><table>
                <thead><tr><th>动物名称</th><th>家庭名称</th><th>类型</th><th>开始日期</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    }

    function renderExpenseBreakdown() {
        const expenses = state.reportData.expenses.filter(e => e.type === 'expense');
        if (!expenses.length) return '';
        const categoryTotals = {};
        expenses.forEach(e => {
            const cat = e.category || 'other';
            categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
        });
        const rows = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).map(([cat, total]) => `<tr>
            <td>${expenseCategoryMap[cat] || cat}</td>
            <td>¥${total.toFixed(2)}</td>
        </tr>`).join('');
        return `<div class="section-divider">支出分类明细</div>
            <div class="table-container"><table>
                <thead><tr><th>分类</th><th>金额</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    }

    function renderFollowupsTable() {
        const followups = state.reportData.followups;
        if (!followups.length) return '';
        const rows = followups.map(f => {
            const animal = Store.getAnimal(f.animalId);
            return `<tr>
                <td>${animal ? animal.name : '未知'}</td>
                <td>${followupTypeMap[f.type] || f.type || '-'}</td>
                <td>${followupStatusMap[f.status] || f.status || '-'}</td>
                <td>${f.date || '-'}</td>
                <td>${f.notes || '-'}</td>
            </tr>`;
        }).join('');
        return `<div class="section-divider">回访记录汇总</div>
            <div class="table-container"><table>
                <thead><tr><th>动物名称</th><th>类型</th><th>状态</th><th>日期</th><th>备注</th></tr></thead>
                <tbody>${rows}</tbody>
            </table></div>`;
    }

    function renderRemindersTable() {
        const tc = Store.getReminderTypeCounts();
        const groups = Store.getGroupedReminders();
        const all = [...groups.today, ...groups.tomorrow, ...groups.week, ...groups.fortnight];
        const typeLabels = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };
        const rows = all.map(r => {
            const group = groups.today.includes(r) ? '今天到期' : groups.tomorrow.includes(r) ? '明天到期' : groups.week.includes(r) ? '7天内' : '8~14天';
            return `<tr>
                <td>${r.animalName || '未知'}</td>
                <td>${typeLabels[r.type] || r.type || '-'}</td>
                <td>${r.description || '-'}</td>
                <td>${r.nextDate || '-'}</td>
                <td>${group}</td>
            </tr>`;
        }).join('');
        const emptyRows = !all.length ? '<tr><td colspan="5" style="text-align:center;color:#999">暂无近期提醒</td></tr>' : '';
        return `<div class="section-divider">近期提醒汇总（14天内）</div>
            <div class="stat-cards" style="margin-bottom:12px">
                <div class="stat-card"><div class="stat-icon red">🔴</div><div class="stat-info"><div class="stat-value">${tc.today}</div><div class="stat-label">今天到期</div></div></div>
                <div class="stat-card"><div class="stat-icon orange">🟠</div><div class="stat-info"><div class="stat-value">${tc.tomorrow}</div><div class="stat-label">明天到期</div></div></div>
                <div class="stat-card"><div class="stat-icon blue">🔵</div><div class="stat-info"><div class="stat-value">${tc.week}</div><div class="stat-label">7天内</div></div></div>
                <div class="stat-card"><div class="stat-icon teal">�</div><div class="stat-info"><div class="stat-value">${tc.fortnight}</div><div class="stat-label">8~14天</div></div></div>
                <div class="stat-card"><div class="stat-icon green">🟢</div><div class="stat-info"><div class="stat-value">${tc.total}</div><div class="stat-label">14天内总计</div></div></div>
            </div>
            <div class="stat-cards" style="margin-bottom:12px">
                <div class="stat-card"><div class="stat-icon purple">💊</div><div class="stat-info"><div class="stat-value">${tc.medication}</div><div class="stat-label">用药提醒</div></div></div>
                <div class="stat-card"><div class="stat-icon blue">💉</div><div class="stat-info"><div class="stat-value">${tc.vaccination}</div><div class="stat-label">疫苗提醒</div></div></div>
                <div class="stat-card"><div class="stat-icon green">🐛</div><div class="stat-info"><div class="stat-value">${tc.deworming}</div><div class="stat-label">驱虫提醒</div></div></div>
                <div class="stat-card"><div class="stat-icon orange">🩺</div><div class="stat-info"><div class="stat-value">${tc.checkup}</div><div class="stat-label">复诊提醒</div></div></div>
            </div>
            <div class="table-container"><table>
                <thead><tr><th>动物名称</th><th>类型</th><th>描述</th><th>到期日期</th><th>分组</th></tr></thead>
                <tbody>${rows}${emptyRows}</tbody>
            </table></div>`;
    }

    function renderActionButtons() {
        return `<div style="margin-top:24px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn btn-primary" id="rp-print-btn">🖨️ 打印报表</button>
            <button class="btn btn-secondary" id="rp-export-csv-btn">📊 导出CSV</button>
            <button class="btn btn-outline" id="rp-export-json-btn">📄 导出JSON</button>
        </div>`;
    }

    function renderDataManagement() {
        return `<div class="section-divider">数据管理</div>
            <div class="card">
                <div class="card-body">
                    <div style="display:flex;gap:8px;flex-wrap:wrap">
                        <button class="btn btn-primary" id="rp-export-all-btn">📤 导出全部数据</button>
                        <button class="btn btn-secondary" id="rp-import-btn">📥 导入数据</button>
                        <button class="btn btn-danger" id="rp-demo-btn">🔄 初始化演示数据</button>
                    </div>
                    <input type="file" id="rp-import-file" accept=".json" style="display:none">
                </div>
            </div>`;
    }

    function renderReportContent() {
        if (!state.reportData) return `<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-text">请选择年月并点击"生成报表"</div></div>`;
        return `${renderReportHeader()}
            ${renderSummaryCards()}
            ${renderIntakesTable()}
            ${renderMedicalTable()}
            ${renderPlacementsTable()}
            ${renderExpenseBreakdown()}
            ${renderFollowupsTable()}
            ${renderRemindersTable()}
            ${renderActionButtons()}`;
    }

    function buildPrintContent() {
        const config = Store.loadConfig();
        const data = state.reportData;
        const period = `${state.reportYear}年${state.reportMonth}月`;
        const now = new Date();
        const genDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

        const newIntakes = data.animals.length;
        const adoptions = data.placements.filter(p => p.type === 'adopt').length;
        const fosters = data.placements.filter(p => p.type === 'foster').length;
        const medicalCount = data.medicals.length;
        const followupCount = data.followups.length;
        const totalIncome = data.expenses.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
        const totalExpense = data.expenses.filter(e => e.type === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
        const balance = totalIncome - totalExpense;

        let html = `<div style="font-family:'Microsoft YaHei',sans-serif;max-width:210mm;margin:0 auto;padding:20mm 15mm">`;
        html += `<div style="text-align:center;margin-bottom:24px">
            <h1 style="margin:0 0 4px 0;font-size:22px">${config.stationName || '流浪动物救助站'}</h1>
            <h2 style="margin:0 0 8px 0;font-size:18px;color:#333">月度救助报表</h2>
            <p style="margin:0;color:#666;font-size:13px">报表期间：${period} ｜ 生成日期：${genDate}</p>
        </div>`;

        html += `<table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:13px">
            <tr>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">新入站动物数</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">${newIntakes}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">领养数量</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">${adoptions}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">寄养数量</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">${fosters}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">医疗记录数</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">${medicalCount}</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">回访记录数</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">${followupCount}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">总收入</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold;color:#27ae60">¥${totalIncome.toFixed(2)}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">总支出</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold;color:#e74c3c">¥${totalExpense.toFixed(2)}</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;background:#f5f5f5;font-weight:bold">余额</td>
                <td style="border:1px solid #ccc;padding:8px;text-align:center;font-size:18px;font-weight:bold">¥${balance.toFixed(2)}</td>
            </tr>
        </table>`;

        if (data.animals.length) {
            html += `<h3 style="font-size:15px;margin:16px 0 8px">新入站动物</h3>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
                <thead><tr style="background:#f5f5f5">
                    <th style="border:1px solid #ccc;padding:6px 8px">名称</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">物种</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">品种</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">来源</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">入站日期</th>
                </tr></thead><tbody>`;
            data.animals.forEach(a => {
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${a.name || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${speciesMap[a.species] || a.species || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${a.breed || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${sourceMap[a.source] || a.source || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${a.intakeDate || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        if (data.medicals.length) {
            html += `<h3 style="font-size:15px;margin:16px 0 8px">医疗记录</h3>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
                <thead><tr style="background:#f5f5f5">
                    <th style="border:1px solid #ccc;padding:6px 8px">动物名称</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">类型</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">描述</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">兽医</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">费用</th>
                </tr></thead><tbody>`;
            data.medicals.forEach(m => {
                const animal = Store.getAnimal(m.animalId);
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${animal ? animal.name : '未知'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${medicalTypeMap[m.type] || m.type || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${m.description || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${m.vet || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">¥${(m.cost || 0).toFixed(2)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        if (data.placements.length) {
            html += `<h3 style="font-size:15px;margin:16px 0 8px">领养/寄养记录</h3>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
                <thead><tr style="background:#f5f5f5">
                    <th style="border:1px solid #ccc;padding:6px 8px">动物名称</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">家庭名称</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">类型</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">开始日期</th>
                </tr></thead><tbody>`;
            data.placements.forEach(p => {
                const animal = Store.getAnimal(p.animalId);
                const family = Store.getFamily(p.familyId);
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${animal ? animal.name : '未知'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${family ? family.name : '未知'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${placementTypeMap[p.type] || p.type || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${p.startDate || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        const expenseItems = data.expenses.filter(e => e.type === 'expense');
        if (expenseItems.length) {
            const categoryTotals = {};
            expenseItems.forEach(e => {
                const cat = e.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
            });
            html += `<h3 style="font-size:15px;margin:16px 0 8px">支出分类明细</h3>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
                <thead><tr style="background:#f5f5f5">
                    <th style="border:1px solid #ccc;padding:6px 8px">分类</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">金额</th>
                </tr></thead><tbody>`;
            Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, total]) => {
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${expenseCategoryMap[cat] || cat}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">¥${total.toFixed(2)}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        if (data.followups.length) {
            html += `<h3 style="font-size:15px;margin:16px 0 8px">回访记录汇总</h3>`;
            html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
                <thead><tr style="background:#f5f5f5">
                    <th style="border:1px solid #ccc;padding:6px 8px">动物名称</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">类型</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">状态</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">日期</th>
                    <th style="border:1px solid #ccc;padding:6px 8px">备注</th>
                </tr></thead><tbody>`;
            data.followups.forEach(f => {
                const animal = Store.getAnimal(f.animalId);
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${animal ? animal.name : '未知'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${followupTypeMap[f.type] || f.type || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${followupStatusMap[f.status] || f.status || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${f.date || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${f.notes || '-'}</td>
                </tr>`;
            });
            html += `</tbody></table>`;
        }

        const tc = Store.getReminderTypeCounts();
        const rGroups = Store.getGroupedReminders();
        const allReminders = [...rGroups.today, ...rGroups.tomorrow, ...rGroups.week, ...rGroups.fortnight];
        const typeLabels = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };

        html += `<h3 style="font-size:15px;margin:16px 0 8px">近期提醒汇总（14天内）</h3>`;
        html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px">
            <tr>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">今天到期</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold;color:#D9534F">${tc.today}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">明天到期</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold;color:#F0AD4E">${tc.tomorrow}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">7天内</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold;color:#5BC0DE">${tc.week}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">8~14天</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold;color:#2196F3">${tc.fortnight}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">14天内总计</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold;color:#5CB85C">${tc.total}</td>
            </tr>
            <tr>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">用药提醒</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold">${tc.medication}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">疫苗提醒</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold">${tc.vaccination}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">驱虫提醒</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold">${tc.deworming}</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;background:#f5f5f5;font-weight:bold">复诊提醒</td>
                <td style="border:1px solid #ccc;padding:6px 8px;text-align:center;font-size:16px;font-weight:bold">${tc.checkup}</td>
                <td colspan="2"></td>
            </tr>
        </table>`;

        html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px">
            <thead><tr style="background:#f5f5f5">
                <th style="border:1px solid #ccc;padding:6px 8px">动物名称</th>
                <th style="border:1px solid #ccc;padding:6px 8px">类型</th>
                <th style="border:1px solid #ccc;padding:6px 8px">描述</th>
                <th style="border:1px solid #ccc;padding:6px 8px">到期日期</th>
                <th style="border:1px solid #ccc;padding:6px 8px">分组</th>
            </tr></thead><tbody>`;
        if (allReminders.length) {
            allReminders.forEach(r => {
                const group = rGroups.today.includes(r) ? '今天到期' : rGroups.tomorrow.includes(r) ? '明天到期' : rGroups.week.includes(r) ? '7天内' : '8~14天';
                html += `<tr>
                    <td style="border:1px solid #ccc;padding:6px 8px">${r.animalName || '未知'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${typeLabels[r.type] || r.type || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${r.description || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${r.nextDate || '-'}</td>
                    <td style="border:1px solid #ccc;padding:6px 8px">${group}</td>
                </tr>`;
            });
        } else {
            html += `<tr><td colspan="5" style="border:1px solid #ccc;padding:6px 8px;text-align:center;color:#999">暂无近期提醒</td></tr>`;
        }
        html += `</tbody></table>`;

        html += `</div>`;
        return html;
    }

    function printReport() {
        if (!state.reportData) return;
        const existing = document.getElementById('rp-print-area');
        if (existing) existing.remove();
        const printArea = document.createElement('div');
        printArea.id = 'rp-print-area';
        printArea.className = 'print-area';
        printArea.innerHTML = buildPrintContent();
        document.body.appendChild(printArea);
        window.print();
        setTimeout(() => printArea.remove(), 1000);
    }

    function escapeCSV(val) {
        const str = String(val == null ? '' : val);
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    }

    function exportCSV() {
        if (!state.reportData) return;
        const data = state.reportData;
        const period = `${state.reportYear}-${String(state.reportMonth).padStart(2, '0')}`;
        let csv = '\uFEFF';

        csv += '月度救助报表\n';
        csv += `报表期间,${period}\n\n`;

        csv += '汇总统计\n';
        csv += '项目,数值\n';
        csv += `新入站动物数,${data.animals.length}\n`;
        csv += `领养数量,${data.placements.filter(p => p.type === 'adopt').length}\n`;
        csv += `寄养数量,${data.placements.filter(p => p.type === 'foster').length}\n`;
        csv += `医疗记录数,${data.medicals.length}\n`;
        csv += `回访记录数,${data.followups.length}\n`;
        const totalIncome = data.expenses.filter(e => e.type === 'income').reduce((s, e) => s + (e.amount || 0), 0);
        const totalExpense = data.expenses.filter(e => e.type === 'expense').reduce((s, e) => s + (e.amount || 0), 0);
        csv += `总收入,${totalIncome.toFixed(2)}\n`;
        csv += `总支出,${totalExpense.toFixed(2)}\n`;
        csv += `余额,${(totalIncome - totalExpense).toFixed(2)}\n\n`;

        if (data.animals.length) {
            csv += '新入站动物\n';
            csv += '名称,物种,品种,来源,入站日期\n';
            data.animals.forEach(a => {
                csv += [escapeCSV(a.name), escapeCSV(speciesMap[a.species] || a.species), escapeCSV(a.breed), escapeCSV(sourceMap[a.source] || a.source), escapeCSV(a.intakeDate)].join(',') + '\n';
            });
            csv += '\n';
        }

        if (data.medicals.length) {
            csv += '医疗记录\n';
            csv += '动物名称,类型,描述,兽医,费用\n';
            data.medicals.forEach(m => {
                const animal = Store.getAnimal(m.animalId);
                csv += [escapeCSV(animal ? animal.name : '未知'), escapeCSV(medicalTypeMap[m.type] || m.type), escapeCSV(m.description), escapeCSV(m.vet), (m.cost || 0).toFixed(2)].join(',') + '\n';
            });
            csv += '\n';
        }

        if (data.placements.length) {
            csv += '领养/寄养记录\n';
            csv += '动物名称,家庭名称,类型,开始日期\n';
            data.placements.forEach(p => {
                const animal = Store.getAnimal(p.animalId);
                const family = Store.getFamily(p.familyId);
                csv += [escapeCSV(animal ? animal.name : '未知'), escapeCSV(family ? family.name : '未知'), escapeCSV(placementTypeMap[p.type] || p.type), escapeCSV(p.startDate)].join(',') + '\n';
            });
            csv += '\n';
        }

        const expenseItems = data.expenses.filter(e => e.type === 'expense');
        if (expenseItems.length) {
            csv += '支出分类明细\n';
            csv += '分类,金额\n';
            const categoryTotals = {};
            expenseItems.forEach(e => {
                const cat = e.category || 'other';
                categoryTotals[cat] = (categoryTotals[cat] || 0) + (e.amount || 0);
            });
            Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]).forEach(([cat, total]) => {
                csv += `${escapeCSV(expenseCategoryMap[cat] || cat)},${total.toFixed(2)}\n`;
            });
            csv += '\n';
        }

        if (data.followups.length) {
            csv += '回访记录汇总\n';
            csv += '动物名称,类型,状态,日期,备注\n';
            data.followups.forEach(f => {
                const animal = Store.getAnimal(f.animalId);
                csv += [escapeCSV(animal ? animal.name : '未知'), escapeCSV(followupTypeMap[f.type] || f.type), escapeCSV(followupStatusMap[f.status] || f.status), escapeCSV(f.date), escapeCSV(f.notes)].join(',') + '\n';
            });
        }

        const tc = Store.getReminderTypeCounts();
        const rGroups = Store.getGroupedReminders();
        const allReminders = [...rGroups.today, ...rGroups.tomorrow, ...rGroups.week, ...rGroups.fortnight];
        const typeLabels = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };

        csv += '\n近期提醒汇总（14天内）\n';
        csv += '项目,数量\n';
        csv += `今天到期,${tc.today}\n`;
        csv += `明天到期,${tc.tomorrow}\n`;
        csv += `7天内,${tc.week}\n`;
        csv += `8~14天,${tc.fortnight}\n`;
        csv += `14天内总计,${tc.total}\n`;
        csv += `用药提醒,${tc.medication}\n`;
        csv += `疫苗提醒,${tc.vaccination}\n`;
        csv += `驱虫提醒,${tc.deworming}\n`;
        csv += `复诊提醒,${tc.checkup}\n`;

        csv += '\n近期提醒明细\n';
        csv += '动物名称,类型,描述,到期日期,分组\n';
        if (allReminders.length) {
            allReminders.forEach(r => {
                const group = rGroups.today.includes(r) ? '今天到期' : rGroups.tomorrow.includes(r) ? '明天到期' : rGroups.week.includes(r) ? '7天内' : '8~14天';
                csv += [escapeCSV(r.animalName || '未知'), escapeCSV(typeLabels[r.type] || r.type), escapeCSV(r.description || ''), escapeCSV(r.nextDate), escapeCSV(group)].join(',') + '\n';
            });
        } else {
            csv += '(暂无近期提醒),,,,,\n';
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `救助站报表_${period}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportJSON() {
        if (!state.reportData) return;
        const exportData = Store.exportData();
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `救助站数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportAllData() {
        const data = Store.exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `救助站全部数据_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function importData() {
        const fileInput = document.getElementById('rp-import-file');
        if (fileInput) fileInput.click();
    }

    function handleImportFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (evt) {
            try {
                const data = JSON.parse(evt.target.result);
                Store.importData(data);
                state.reportData = null;
                render();
                alert('数据导入成功！');
            } catch (err) {
                alert('导入失败：文件格式不正确');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    }

    function initDemoData() {
        if (!confirm('确定初始化演示数据？这将添加示例数据到系统中。')) return;
        Store.initDemoData();
        state.reportData = null;
        render();
    }

    function render() {
        const panel = document.getElementById('module-report');
        if (!panel) return;
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">报表打印</h2>
                <div class="panel-actions"></div>
            </div>
            ${renderMonthSelector()}
            ${renderReportContent()}
            ${renderDataManagement()}`;
    }

    function init() {
        const panel = document.getElementById('module-report');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            if (e.target.id === 'rp-generate-btn') {
                generateReport();
                return;
            }
            if (e.target.id === 'rp-print-btn') {
                printReport();
                return;
            }
            if (e.target.id === 'rp-export-csv-btn') {
                exportCSV();
                return;
            }
            if (e.target.id === 'rp-export-json-btn') {
                exportJSON();
                return;
            }
            if (e.target.id === 'rp-export-all-btn') {
                exportAllData();
                return;
            }
            if (e.target.id === 'rp-import-btn') {
                importData();
                return;
            }
            if (e.target.id === 'rp-demo-btn') {
                initDemoData();
                return;
            }
        });

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'rp-year') {
                state.reportYear = parseInt(e.target.value) || new Date().getFullYear();
                return;
            }
            if (e.target.id === 'rp-month') {
                state.reportMonth = parseInt(e.target.value) || new Date().getMonth() + 1;
                return;
            }
        });

        panel.addEventListener('change', (e) => {
            if (e.target.id === 'rp-import-file') {
                handleImportFile(e);
                return;
            }
        });
    }

    return { init, render };
})();
