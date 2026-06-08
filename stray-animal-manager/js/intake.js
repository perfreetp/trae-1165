const Intake = (() => {
    const speciesMap = { cat: '猫', dog: '狗' };
    const genderMap = { male: '公', female: '母', unknown: '未知' };
    const sourceMap = { stray: '流浪救助', surrender: '弃养', rescue: '救援', other: '其他' };

    let state = {
        editId: null,
        formPhoto: ''
    };

    function getRecentAnimals() {
        const all = Store.getAllAnimals();
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
        return all.filter(a => {
            if (!a.intakeDate) return false;
            return new Date(a.intakeDate) >= thirtyDaysAgo;
        }).sort((a, b) => new Date(b.intakeDate) - new Date(a.intakeDate));
    }

    function photoThumb(animal) {
        if (animal.photo) return `<div class="photo-thumb"><img src="${animal.photo}" alt="${animal.name}"></div>`;
        return `<div class="photo-thumb">${animal.species === 'cat' ? '🐱' : '🐶'}</div>`;
    }

    function speciesTag(s) {
        return `<span class="tag tag-${s}">${speciesMap[s] || s}</span>`;
    }

    function isolationTag(animal) {
        if (animal.isolationStatus && animal.isolationStatus.isInIsolation) {
            return `<span class="tag tag-isolated">隔离中</span>`;
        }
        return `<span class="tag tag-available">未隔离</span>`;
    }

    function renderTable(animals) {
        if (!animals.length) {
            return `<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">近30天暂无入站登记记录</div></div>`;
        }
        const rows = animals.map(a => `<tr>
                <td>${photoThumb(a)}</td>
                <td><strong>${a.name}</strong></td>
                <td>${speciesTag(a.species)}</td>
                <td>${a.breed || '-'}</td>
                <td>${a.intakeDate || '-'}</td>
                <td>${sourceMap[a.source] || a.source || '-'}</td>
                <td>${a.chipNumber || '-'}</td>
                <td>${isolationTag(a)}</td>
                <td>
                    <button class="btn btn-sm btn-outline" data-action="view" data-id="${a.id}">查看详情</button>
                    <button class="btn btn-sm btn-outline" data-action="edit" data-id="${a.id}">编辑</button>
                </td>
            </tr>`).join('');
        return `<div class="table-container"><table>
            <thead><tr>
                <th>照片</th><th>名称</th><th>种类</th><th>品种</th><th>入站日期</th><th>来源</th><th>芯片号</th><th>隔离状态</th><th>操作</th>
            </tr></thead>
            <tbody>${rows}</tbody>
        </table></div>`;
    }

    function render() {
        const panel = document.getElementById('module-intake');
        if (!panel) return;
        const animals = getRecentAnimals();
        panel.innerHTML = `
            <div class="panel-header">
                <h2 class="panel-title">入站登记</h2>
                <div class="panel-actions">
                    <button class="btn btn-primary" id="ik-add-btn">新增登记</button>
                </div>
            </div>
            ${renderTable(animals)}`;
    }

    function showViewModal(id) {
        const animal = Store.getAnimal(id);
        if (!animal) return;
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        const iso = animal.isolationStatus || {};
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">动物详情 - ${animal.name}</h3>
                <button class="modal-close" id="ik-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">名称</div><div class="detail-value">${animal.name}</div></div>
                    <div class="detail-item"><div class="detail-label">种类</div><div class="detail-value">${speciesMap[animal.species] || animal.species} ${speciesTag(animal.species)}</div></div>
                    <div class="detail-item"><div class="detail-label">品种</div><div class="detail-value">${animal.breed || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">性别</div><div class="detail-value">${genderMap[animal.gender] || '未知'}</div></div>
                    <div class="detail-item"><div class="detail-label">年龄</div><div class="detail-value">${animal.age || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">毛色</div><div class="detail-value">${animal.color || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">芯片号</div><div class="detail-value">${animal.chipNumber || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">来源</div><div class="detail-value">${sourceMap[animal.source] || animal.source || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">来源详情</div><div class="detail-value">${animal.sourceDetail || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">入站日期</div><div class="detail-value">${animal.intakeDate || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">当前体重</div><div class="detail-value">${animal.currentWeight ? animal.currentWeight + ' kg' : '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">特征描述</div><div class="detail-value">${animal.characteristics || '-'}</div></div>
                </div>
                <div class="section-divider">隔离信息</div>
                <div class="detail-grid">
                    <div class="detail-item"><div class="detail-label">隔离状态</div><div class="detail-value">${iso.isInIsolation ? '<span class="tag tag-isolated">隔离中</span>' : '未隔离'}</div></div>
                    <div class="detail-item"><div class="detail-label">隔离开始日期</div><div class="detail-value">${iso.startDate || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">预计结束日期</div><div class="detail-value">${iso.endDate || '-'}</div></div>
                    <div class="detail-item"><div class="detail-label">隔离原因</div><div class="detail-value">${iso.reason || '-'}</div></div>
                </div>
                ${animal.notes ? `<div class="section-divider">备注</div><div class="detail-grid"><div class="detail-item full-width"><div class="detail-value">${animal.notes}</div></div></div>` : ''}
                ${animal.photo ? `<div class="section-divider">照片</div><div style="text-align:center"><img src="${animal.photo}" style="max-width:300px;max-height:300px;border-radius:var(--radius-md);object-fit:cover;"></div>` : ''}
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ik-modal-close-btn">关闭</button>
            </div>`;
        overlay.classList.add('active');
    }

    function showFormModal(id) {
        const animal = id ? Store.getAnimal(id) : null;
        const isEdit = !!animal;
        state.editId = id || null;
        state.formPhoto = isEdit ? (animal.photo || '') : '';
        const iso = isEdit ? (animal.isolationStatus || {}) : { isInIsolation: true, startDate: new Date().toISOString().split('T')[0], endDate: '', reason: '新入站观察' };
        const overlay = document.getElementById('modalOverlay');
        const container = document.getElementById('modalContainer');
        container.innerHTML = `
            <div class="modal-header">
                <h3 class="modal-title">${isEdit ? '编辑登记 - ' + animal.name : '新增登记'}</h3>
                <button class="modal-close" id="ik-modal-close">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-grid">
                    <div class="form-group"><label>名称</label><input type="text" id="ik-f-name" value="${isEdit ? animal.name : ''}" placeholder="请输入名称"></div>
                    <div class="form-group"><label>种类</label><div class="radio-group">
                        <label><input type="radio" name="ik-f-species" value="cat"${!isEdit || animal.species === 'cat' ? ' checked' : ''}>猫</label>
                        <label><input type="radio" name="ik-f-species" value="dog"${isEdit && animal.species === 'dog' ? ' checked' : ''}>狗</label>
                    </div></div>
                    <div class="form-group"><label>品种</label><input type="text" id="ik-f-breed" value="${isEdit ? animal.breed : ''}" placeholder="请输入品种"></div>
                    <div class="form-group"><label>性别</label><div class="radio-group">
                        <label><input type="radio" name="ik-f-gender" value="male"${isEdit && animal.gender === 'male' ? ' checked' : ''}>公</label>
                        <label><input type="radio" name="ik-f-gender" value="female"${isEdit && animal.gender === 'female' ? ' checked' : ''}>母</label>
                        <label><input type="radio" name="ik-f-gender" value="unknown"${!isEdit || animal.gender === 'unknown' ? ' checked' : ''}>未知</label>
                    </div></div>
                    <div class="form-group"><label>年龄</label><input type="text" id="ik-f-age" value="${isEdit ? animal.age : ''}" placeholder="如：2岁、6月"></div>
                    <div class="form-group"><label>毛色</label><input type="text" id="ik-f-color" value="${isEdit ? animal.color : ''}" placeholder="请输入毛色"></div>
                    <div class="form-group"><label>芯片号</label><input type="text" id="ik-f-chip" value="${isEdit ? animal.chipNumber : ''}" placeholder="请输入芯片号"></div>
                    <div class="form-group"><label>来源</label><select id="ik-f-source">
                        <option value="stray"${isEdit && animal.source === 'stray' ? ' selected' : ''}>流浪救助</option>
                        <option value="surrender"${isEdit && animal.source === 'surrender' ? ' selected' : ''}>弃养</option>
                        <option value="rescue"${isEdit && animal.source === 'rescue' ? ' selected' : ''}>救援</option>
                        <option value="other"${isEdit && animal.source === 'other' ? ' selected' : ''}>其他</option>
                    </select></div>
                    <div class="form-group full-width"><label>来源详情</label><textarea id="ik-f-source-detail" placeholder="请输入来源详情">${isEdit ? animal.sourceDetail : ''}</textarea></div>
                    <div class="form-group"><label>照片</label>
                        <div class="photo-upload" id="ik-photo-upload">
                            ${state.formPhoto ? `<img src="${state.formPhoto}" id="ik-photo-preview">` : `<div class="upload-hint" id="ik-photo-hint"><span>📷</span>点击上传</div>`}
                            <input type="file" id="ik-f-photo" accept="image/*" style="display:none">
                        </div>
                    </div>
                    <div class="form-group full-width"><label>特征描述</label><textarea id="ik-f-characteristics" placeholder="请输入特征描述">${isEdit ? animal.characteristics : ''}</textarea></div>
                    <div class="form-group"><label>体重 (kg)</label><input type="number" id="ik-f-weight" step="0.1" min="0" value="${isEdit && animal.currentWeight ? animal.currentWeight : ''}" placeholder="请输入体重"></div>
                </div>
                <div class="section-divider">隔离信息</div>
                <div class="form-grid">
                    <div class="form-group"><label><input type="checkbox" id="ik-f-isolation"${iso.isInIsolation ? ' checked' : ''}> 需要隔离观察</label></div>
                    <div class="form-group"><label>隔离开始日期</label><input type="date" id="ik-f-iso-start" value="${iso.startDate || ''}"></div>
                    <div class="form-group"><label>预计结束日期</label><input type="date" id="ik-f-iso-end" value="${iso.endDate || ''}"></div>
                    <div class="form-group full-width"><label>隔离原因</label><textarea id="ik-f-iso-reason" placeholder="请输入隔离原因">${iso.reason || ''}</textarea></div>
                </div>
                <div class="section-divider">其他</div>
                <div class="form-grid">
                    <div class="form-group full-width"><label>备注</label><textarea id="ik-f-notes" placeholder="请输入备注">${isEdit ? animal.notes : ''}</textarea></div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" id="ik-modal-cancel">取消</button>
                <button class="btn btn-primary" id="ik-modal-save">保存</button>
            </div>`;
        overlay.classList.add('active');

        document.getElementById('ik-photo-upload').addEventListener('click', () => {
            document.getElementById('ik-f-photo').click();
        });

        document.getElementById('ik-f-photo').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                state.formPhoto = ev.target.result;
                const preview = document.getElementById('ik-photo-preview');
                const hint = document.getElementById('ik-photo-hint');
                if (preview) {
                    preview.src = state.formPhoto;
                } else {
                    if (hint) hint.remove();
                    const img = document.createElement('img');
                    img.id = 'ik-photo-preview';
                    img.src = state.formPhoto;
                    document.getElementById('ik-photo-upload').appendChild(img);
                }
            };
            reader.readAsDataURL(file);
        });
    }

    function closeModal() {
        document.getElementById('modalOverlay').classList.remove('active');
        state.editId = null;
        state.formPhoto = '';
    }

    function saveAnimal() {
        const name = document.getElementById('ik-f-name').value.trim();
        if (!name) return;

        const speciesEl = document.querySelector('input[name="ik-f-species"]:checked');
        const genderEl = document.querySelector('input[name="ik-f-gender"]:checked');
        const isInIsolation = document.getElementById('ik-f-isolation').checked;

        const data = {
            name: name,
            species: speciesEl ? speciesEl.value : 'cat',
            breed: document.getElementById('ik-f-breed').value.trim(),
            gender: genderEl ? genderEl.value : 'unknown',
            age: document.getElementById('ik-f-age').value.trim(),
            color: document.getElementById('ik-f-color').value.trim(),
            chipNumber: document.getElementById('ik-f-chip').value.trim(),
            source: document.getElementById('ik-f-source').value,
            sourceDetail: document.getElementById('ik-f-source-detail').value.trim(),
            photo: state.formPhoto,
            characteristics: document.getElementById('ik-f-characteristics').value.trim(),
            notes: document.getElementById('ik-f-notes').value.trim(),
            isolationStatus: {
                isInIsolation: isInIsolation,
                startDate: isInIsolation ? document.getElementById('ik-f-iso-start').value : '',
                endDate: isInIsolation ? document.getElementById('ik-f-iso-end').value : '',
                reason: isInIsolation ? document.getElementById('ik-f-iso-reason').value.trim() : ''
            }
        };

        const weight = parseFloat(document.getElementById('ik-f-weight').value);
        if (!isNaN(weight) && weight > 0) data.weight = weight;

        if (isInIsolation) {
            data.status = 'isolated';
        }

        if (state.editId) {
            Store.updateAnimal(state.editId, data);
        } else {
            Store.createAnimal(data);
        }

        closeModal();
        render();
    }

    function init() {
        const panel = document.getElementById('module-intake');
        if (!panel) return;

        panel.addEventListener('click', (e) => {
            if (e.target.id === 'ik-add-btn') {
                showFormModal(null);
                return;
            }
            const actionBtn = e.target.closest('[data-action]');
            if (actionBtn) {
                const action = actionBtn.dataset.action;
                const id = actionBtn.dataset.id;
                if (action === 'view') showViewModal(id);
                if (action === 'edit') showFormModal(id);
                return;
            }
        });

        const overlay = document.getElementById('modalOverlay');
        overlay.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close') || e.target.id === 'ik-modal-close' || e.target.id === 'ik-modal-close-btn' || e.target.id === 'ik-modal-cancel') {
                closeModal();
                return;
            }
            if (e.target.id === 'ik-modal-save') {
                saveAnimal();
                return;
            }
            if (e.target === overlay) {
                closeModal();
            }
        });
    }

    return { init, render };
})();
