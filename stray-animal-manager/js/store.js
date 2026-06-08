const Store = (() => {
    const KEYS = {
        animals: 'sam_animals',
        medical: 'sam_medical',
        families: 'sam_families',
        placements: 'sam_placements',
        expenses: 'sam_expenses',
        inventory: 'sam_inventory',
        followups: 'sam_followups',
        stockflow: 'sam_stockflow',
        stocktakes: 'sam_stocktakes',
        config: 'sam_config'
    };

    const defaultConfig = {
        stationCapacity: 50,
        stationName: '流浪动物救助站'
    };

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    }

    function load(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Store load error:', key, e);
            return [];
        }
    }

    function save(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Store save error:', key, e);
        }
    }

    function loadConfig() {
        try {
            const data = localStorage.getItem(KEYS.config);
            return data ? { ...defaultConfig, ...JSON.parse(data) } : { ...defaultConfig };
        } catch {
            return { ...defaultConfig };
        }
    }

    function saveConfig(config) {
        save(KEYS.config, config);
    }

    function createAnimal(data) {
        const animals = load(KEYS.animals);
        const animal = {
            id: generateId(),
            name: data.name || '',
            species: data.species || 'cat',
            breed: data.breed || '',
            gender: data.gender || 'unknown',
            age: data.age || '',
            color: data.color || '',
            chipNumber: data.chipNumber || '',
            source: data.source || 'stray',
            sourceDetail: data.sourceDetail || '',
            intakeDate: data.intakeDate || new Date().toISOString().split('T')[0],
            status: data.status || (data.isolationStatus && !data.isolationStatus.isInIsolation ? 'available' : 'isolated'),
            photo: data.photo || '',
            characteristics: data.characteristics || '',
            isolationStatus: {
                isInIsolation: data.isolationStatus?.isInIsolation ?? true,
                startDate: data.isolationStatus?.startDate || new Date().toISOString().split('T')[0],
                endDate: data.isolationStatus?.endDate || '',
                reason: data.isolationStatus?.reason || '新入站观察'
            },
            weightHistory: data.weight ? [{ date: new Date().toISOString().split('T')[0], weight: parseFloat(data.weight) }] : [],
            currentWeight: data.weight ? parseFloat(data.weight) : 0,
            notes: data.notes || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        animals.push(animal);
        save(KEYS.animals, animals);
        return animal;
    }

    function updateAnimal(id, data) {
        const animals = load(KEYS.animals);
        const idx = animals.findIndex(a => a.id === id);
        if (idx === -1) return null;
        animals[idx] = { ...animals[idx], ...data, updatedAt: new Date().toISOString() };
        save(KEYS.animals, animals);
        return animals[idx];
    }

    function deleteAnimal(id) {
        const animals = load(KEYS.animals).filter(a => a.id !== id);
        save(KEYS.animals, animals);
        load(KEYS.medical).filter(m => m.animalId === id).forEach(m => deleteMedical(m.id));
        load(KEYS.placements).filter(p => p.animalId === id).forEach(p => deletePlacement(p.id));
        load(KEYS.followups).filter(f => f.animalId === id).forEach(f => deleteFollowup(f.id));
    }

    function getAnimal(id) {
        return load(KEYS.animals).find(a => a.id === id) || null;
    }

    function getAllAnimals() {
        return load(KEYS.animals);
    }

    function searchAnimals(query, filters) {
        let animals = load(KEYS.animals);
        if (query) {
            const q = query.toLowerCase();
            animals = animals.filter(a =>
                (a.name && a.name.toLowerCase().includes(q)) ||
                (a.chipNumber && a.chipNumber.toLowerCase().includes(q)) ||
                (a.breed && a.breed.toLowerCase().includes(q)) ||
                (a.color && a.color.toLowerCase().includes(q)) ||
                (a.characteristics && a.characteristics.toLowerCase().includes(q))
            );
        }
        if (filters) {
            if (filters.species) animals = animals.filter(a => a.species === filters.species);
            if (filters.status) animals = animals.filter(a => a.status === filters.status);
            if (filters.gender) animals = animals.filter(a => a.gender === filters.gender);
        }
        return animals;
    }

    function batchUpdateStatus(ids, status) {
        const animals = load(KEYS.animals);
        ids.forEach(id => {
            const idx = animals.findIndex(a => a.id === id);
            if (idx !== -1) {
                animals[idx].status = status;
                if (status === 'available') {
                    animals[idx].isolationStatus = {
                        isInIsolation: false,
                        startDate: animals[idx].isolationStatus?.startDate || '',
                        endDate: new Date().toISOString().split('T')[0],
                        reason: animals[idx].isolationStatus?.reason || ''
                    };
                } else if (status === 'isolated') {
                    animals[idx].isolationStatus = {
                        isInIsolation: true,
                        startDate: animals[idx].isolationStatus?.startDate || new Date().toISOString().split('T')[0],
                        endDate: '',
                        reason: animals[idx].isolationStatus?.reason || '重新隔离观察'
                    };
                }
            }
        });
        save(KEYS.animals, animals);
    }

    function updateWeight(animalId, weight, date) {
        const animals = load(KEYS.animals);
        const idx = animals.findIndex(a => a.id === animalId);
        if (idx === -1) return;
        const d = date || new Date().toISOString().split('T')[0];
        const w = parseFloat(weight);
        animals[idx].weightHistory.push({ date: d, weight: w });
        animals[idx].weightHistory.sort((a, b) => new Date(a.date) - new Date(b.date));
        animals[idx].currentWeight = w;
        animals[idx].updatedAt = new Date().toISOString();
        save(KEYS.animals, animals);
    }

    function createMedical(data) {
        const records = load(KEYS.medical);
        const record = {
            id: generateId(),
            animalId: data.animalId,
            date: data.date || new Date().toISOString().split('T')[0],
            type: data.type || 'checkup',
            description: data.description || '',
            vet: data.vet || '',
            cost: parseFloat(data.cost) || 0,
            nextDate: data.nextDate || '',
            medicine: data.medicine || '',
            dosage: data.dosage || '',
            notes: data.notes || '',
            reminderCompleted: false,
            createdAt: new Date().toISOString()
        };
        records.push(record);
        save(KEYS.medical, records);
        return record;
    }

    function updateMedical(id, data) {
        const records = load(KEYS.medical);
        const idx = records.findIndex(r => r.id === id);
        if (idx === -1) return null;
        records[idx] = { ...records[idx], ...data };
        save(KEYS.medical, records);
        return records[idx];
    }

    function deleteMedical(id) {
        save(KEYS.medical, load(KEYS.medical).filter(r => r.id !== id));
    }

    function getMedicalByAnimal(animalId) {
        return load(KEYS.medical).filter(r => r.animalId === animalId).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function getAllMedical() {
        return load(KEYS.medical);
    }

    function getUpcomingReminders(days) {
        const records = load(KEYS.medical);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const future = new Date(today.getTime() + (days || 7) * 86400000);
        future.setHours(23, 59, 59, 999);
        return records.filter(r => {
            if (!r.nextDate) return false;
            if (r.reminderCompleted) return false;
            const d = new Date(r.nextDate + 'T00:00:00');
            return d >= today && d <= future;
        }).map(r => {
            const animal = getAnimal(r.animalId);
            return { ...r, animalName: animal ? animal.name : '未知' };
        });
    }

    function getGroupedReminders() {
        const records = load(KEYS.medical);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 86400000);
        const day7 = new Date(today.getTime() + 7 * 86400000);
        day7.setHours(23, 59, 59, 999);
        const day14 = new Date(today.getTime() + 14 * 86400000);
        day14.setHours(23, 59, 59, 999);

        const groups = { today: [], tomorrow: [], week: [], fortnight: [] };
        records.forEach(r => {
            if (!r.nextDate || r.reminderCompleted) return;
            const d = new Date(r.nextDate + 'T00:00:00');
            if (d < today) return;
            const animal = getAnimal(r.animalId);
            const item = { ...r, animalName: animal ? animal.name : '未知' };
            if (d.getTime() === today.getTime()) {
                groups.today.push(item);
            } else if (d.getTime() === tomorrow.getTime()) {
                groups.tomorrow.push(item);
            } else if (d <= day7) {
                groups.week.push(item);
            } else if (d <= day14) {
                groups.fortnight.push(item);
            }
        });
        return groups;
    }

    function completeReminder(medicalId) {
        const records = load(KEYS.medical);
        const idx = records.findIndex(r => r.id === medicalId);
        if (idx === -1) return null;
        records[idx].reminderCompleted = true;
        save(KEYS.medical, records);
        return records[idx];
    }

    function rescheduleReminder(medicalId, newNextDate) {
        const records = load(KEYS.medical);
        const idx = records.findIndex(r => r.id === medicalId);
        if (idx === -1) return null;
        records[idx].nextDate = newNextDate;
        records[idx].reminderCompleted = false;
        save(KEYS.medical, records);
        return records[idx];
    }

    function createFamily(data) {
        const families = load(KEYS.families);
        const family = {
            id: generateId(),
            name: data.name || '',
            contact: data.contact || '',
            phone: data.phone || '',
            address: data.address || '',
            type: data.type || 'adopt',
            conditions: data.conditions || '',
            preferences: data.preferences || '',
            experience: data.experience || '',
            createdAt: new Date().toISOString()
        };
        families.push(family);
        save(KEYS.families, families);
        return family;
    }

    function updateFamily(id, data) {
        const families = load(KEYS.families);
        const idx = families.findIndex(f => f.id === id);
        if (idx === -1) return null;
        families[idx] = { ...families[idx], ...data };
        save(KEYS.families, families);
        return families[idx];
    }

    function deleteFamily(id) {
        save(KEYS.families, load(KEYS.families).filter(f => f.id !== id));
    }

    function getFamily(id) {
        return load(KEYS.families).find(f => f.id === id) || null;
    }

    function getAllFamilies() {
        return load(KEYS.families);
    }

    function matchAdopters(animalId) {
        const animal = getAnimal(animalId);
        if (!animal) return [];
        const families = load(KEYS.families).filter(f => f.type === 'adopt');
        return families.map(f => {
            let score = 50;
            const prefs = (f.preferences || '').toLowerCase();
            if (prefs.includes(animal.species === 'cat' ? '猫' : '狗')) score += 20;
            if (prefs.includes(animal.breed)) score += 15;
            if (animal.gender !== 'unknown' && prefs.includes(animal.gender === 'male' ? '公' : '母')) score += 10;
            if (f.experience && f.experience.length > 10) score += 10;
            if (f.conditions && f.conditions.length > 10) score += 5;
            score = Math.min(99, score);
            return { ...f, matchScore: score };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }

    function createPlacement(data) {
        const placements = load(KEYS.placements);
        const placement = {
            id: generateId(),
            animalId: data.animalId,
            familyId: data.familyId,
            type: data.type || 'foster',
            startDate: data.startDate || new Date().toISOString().split('T')[0],
            endDate: data.endDate || '',
            agreementPrinted: data.agreementPrinted || false,
            notes: data.notes || '',
            createdAt: new Date().toISOString()
        };
        placements.push(placement);
        save(KEYS.placements, placements);
        if (data.type === 'adopt') {
            updateAnimal(data.animalId, { status: 'adopted' });
        } else if (data.type === 'foster') {
            updateAnimal(data.animalId, { status: 'fostered' });
        }
        return placement;
    }

    function deletePlacement(id) {
        save(KEYS.placements, load(KEYS.placements).filter(p => p.id !== id));
    }

    function updatePlacement(id, data) {
        const placements = load(KEYS.placements);
        const idx = placements.findIndex(p => p.id === id);
        if (idx === -1) return null;
        placements[idx] = { ...placements[idx], ...data };
        save(KEYS.placements, placements);
        return placements[idx];
    }

    function getPlacementsByAnimal(animalId) {
        return load(KEYS.placements).filter(p => p.animalId === animalId);
    }

    function getAllPlacements() {
        return load(KEYS.placements);
    }

    function createExpense(data) {
        const expenses = load(KEYS.expenses);
        const expense = {
            id: generateId(),
            date: data.date || new Date().toISOString().split('T')[0],
            category: data.category || 'other',
            type: data.type || 'expense',
            amount: parseFloat(data.amount) || 0,
            description: data.description || '',
            donor: data.donor || '',
            createdAt: new Date().toISOString()
        };
        expenses.push(expense);
        save(KEYS.expenses, expenses);
        return expense;
    }

    function updateExpense(id, data) {
        const expenses = load(KEYS.expenses);
        const idx = expenses.findIndex(e => e.id === id);
        if (idx === -1) return null;
        expenses[idx] = { ...expenses[idx], ...data };
        save(KEYS.expenses, expenses);
        return expenses[idx];
    }

    function deleteExpense(id) {
        save(KEYS.expenses, load(KEYS.expenses).filter(e => e.id !== id));
    }

    function getAllExpenses() {
        return load(KEYS.expenses);
    }

    function createInventory(data) {
        const items = load(KEYS.inventory);
        const item = {
            id: generateId(),
            name: data.name || '',
            category: data.category || 'food',
            quantity: parseFloat(data.quantity) || 0,
            unit: data.unit || '个',
            minQuantity: parseFloat(data.minQuantity) || 0,
            lastUpdated: new Date().toISOString()
        };
        items.push(item);
        save(KEYS.inventory, items);
        return item;
    }

    function updateInventory(id, data) {
        const items = load(KEYS.inventory);
        const idx = items.findIndex(i => i.id === id);
        if (idx === -1) return null;
        items[idx] = { ...items[idx], ...data, lastUpdated: new Date().toISOString() };
        save(KEYS.inventory, items);
        return items[idx];
    }

    function deleteInventory(id) {
        save(KEYS.inventory, load(KEYS.inventory).filter(i => i.id !== id));
    }

    function getAllInventory() {
        return load(KEYS.inventory);
    }

    function deductInventory(inventoryId, qty, reason, relatedId) {
        const items = load(KEYS.inventory);
        const idx = items.findIndex(i => i.id === inventoryId);
        if (idx === -1) return { ok: false, msg: '物资不存在' };
        const item = items[idx];
        if (item.quantity < qty) return { ok: false, msg: `库存不足：${item.name}当前${item.quantity}${item.unit}，需要${qty}${item.unit}` };
        items[idx].quantity = Math.round((items[idx].quantity - qty) * 1000) / 1000;
        items[idx].lastUpdated = new Date().toISOString();
        save(KEYS.inventory, items);
        createStockflow({
            inventoryId,
            inventoryName: item.name,
            changeType: 'medical_deduct',
            quantity: -qty,
            reason: reason || '医疗扣减',
            relatedId: relatedId || '',
            afterQty: items[idx].quantity,
            unit: item.unit
        });
        return { ok: true, item: items[idx] };
    }

    function createStockflow(data) {
        const flows = load(KEYS.stockflow);
        const flow = {
            id: generateId(),
            inventoryId: data.inventoryId || '',
            inventoryName: data.inventoryName || '',
            changeType: data.changeType || 'manual_add',
            quantity: data.quantity || 0,
            reason: data.reason || '',
            relatedId: data.relatedId || '',
            afterQty: data.afterQty || 0,
            unit: data.unit || '个',
            date: data.date || new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString()
        };
        flows.push(flow);
        save(KEYS.stockflow, flows);
        return flow;
    }

    function getAllStockflows() {
        return load(KEYS.stockflow).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    function returnInventory(inventoryId, qty, reason) {
        const items = load(KEYS.inventory);
        const idx = items.findIndex(i => i.id === inventoryId);
        if (idx === -1) return { ok: false, msg: '物资不存在' };
        items[idx].quantity = Math.round((items[idx].quantity + qty) * 1000) / 1000;
        items[idx].lastUpdated = new Date().toISOString();
        save(KEYS.inventory, items);
        createStockflow({
            inventoryId,
            inventoryName: items[idx].name,
            changeType: 'medical_return',
            quantity: qty,
            reason: reason || '医疗记录删除退回',
            afterQty: items[idx].quantity,
            unit: items[idx].unit
        });
        return { ok: true, item: items[idx] };
    }

    function adjustInventoryDelta(inventoryId, oldQty, newQty, reason) {
        const delta = newQty - oldQty;
        if (delta === 0) return { ok: true, item: null };
        const items = load(KEYS.inventory);
        const idx = items.findIndex(i => i.id === inventoryId);
        if (idx === -1) return { ok: false, msg: '物资不存在' };
        items[idx].quantity = Math.round((items[idx].quantity + delta) * 1000) / 1000;
        if (items[idx].quantity < 0) items[idx].quantity = 0;
        items[idx].lastUpdated = new Date().toISOString();
        save(KEYS.inventory, items);
        createStockflow({
            inventoryId,
            inventoryName: items[idx].name,
            changeType: 'medical_adjust',
            quantity: delta,
            reason: reason || '医疗记录修改调整',
            afterQty: items[idx].quantity,
            unit: items[idx].unit
        });
        return { ok: true, item: items[idx] };
    }

    function createStocktake(data) {
        const stocktakes = load(KEYS.stocktakes);
        const stocktake = {
            id: generateId(),
            month: data.month || '',
            items: data.items || [],
            status: data.status || 'draft',
            createdAt: new Date().toISOString(),
            confirmedAt: data.confirmedAt || ''
        };
        stocktakes.push(stocktake);
        save(KEYS.stocktakes, stocktakes);
        return stocktake;
    }

    function updateStocktake(id, data) {
        const stocktakes = load(KEYS.stocktakes);
        const idx = stocktakes.findIndex(s => s.id === id);
        if (idx === -1) return null;
        stocktakes[idx] = { ...stocktakes[idx], ...data };
        save(KEYS.stocktakes, stocktakes);
        return stocktakes[idx];
    }

    function deleteStocktake(id) {
        save(KEYS.stocktakes, load(KEYS.stocktakes).filter(s => s.id !== id));
    }

    function getAllStocktakes() {
        return load(KEYS.stocktakes).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    function confirmStocktake(id) {
        const stocktakes = load(KEYS.stocktakes);
        const idx = stocktakes.findIndex(s => s.id === id);
        if (idx === -1) return null;
        const st = stocktakes[idx];
        st.status = 'confirmed';
        st.confirmedAt = new Date().toISOString();
        st.items.forEach(item => {
            const diff = item.actualQty - item.bookQty;
            if (diff !== 0) {
                const invItems = load(KEYS.inventory);
                const invIdx = invItems.findIndex(i => i.id === item.inventoryId);
                if (invIdx !== -1) {
                    invItems[invIdx].quantity = Math.round(item.actualQty * 1000) / 1000;
                    invItems[invIdx].lastUpdated = new Date().toISOString();
                    save(KEYS.inventory, invItems);
                    createStockflow({
                        inventoryId: item.inventoryId,
                        inventoryName: item.inventoryName,
                        changeType: 'stocktake_adjust',
                        quantity: diff,
                        reason: `盘点调整（${st.month}）${item.reason ? '：' + item.reason : ''}`,
                        afterQty: item.actualQty,
                        unit: item.unit
                    });
                }
            }
        });
        save(KEYS.stocktakes, stocktakes);
        return stocktakes[idx];
    }

    function getReminderTypeCounts() {
        const groups = getGroupedReminders();
        const all = [...groups.today, ...groups.tomorrow, ...groups.week, ...groups.fortnight];
        const counts = { medication: 0, vaccination: 0, deworming: 0, checkup: 0, surgery: 0, other: 0 };
        all.forEach(r => {
            if (counts[r.type] !== undefined) counts[r.type]++;
            else counts.other++;
        });
        return { ...counts, today: groups.today.length, tomorrow: groups.tomorrow.length, week: groups.week.length, fortnight: groups.fortnight.length, total: all.length };
    }

    function createFollowup(data) {
        const followups = load(KEYS.followups);
        const followup = {
            id: generateId(),
            animalId: data.animalId,
            familyId: data.familyId || '',
            date: data.date || new Date().toISOString().split('T')[0],
            type: data.type || 'post_adopt',
            notes: data.notes || '',
            status: data.status || 'normal',
            createdAt: new Date().toISOString()
        };
        followups.push(followup);
        save(KEYS.followups, followups);
        if (data.type === 'lost') {
            updateAnimal(data.animalId, { status: 'lost' });
        } else if (data.type === 'found') {
            updateAnimal(data.animalId, { status: 'available' });
        }
        return followup;
    }

    function updateFollowup(id, data) {
        const followups = load(KEYS.followups);
        const idx = followups.findIndex(f => f.id === id);
        if (idx === -1) return null;
        followups[idx] = { ...followups[idx], ...data };
        save(KEYS.followups, followups);
        return followups[idx];
    }

    function deleteFollowup(id) {
        save(KEYS.followups, load(KEYS.followups).filter(f => f.id !== id));
    }

    function getFollowupsByAnimal(animalId) {
        return load(KEYS.followups).filter(f => f.animalId === animalId).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    function getAllFollowups() {
        return load(KEYS.followups);
    }

    function getAnimalTimeline(animalId) {
        const animal = getAnimal(animalId);
        if (!animal) return [];
        const events = [];
        events.push({
            date: animal.intakeDate || animal.createdAt,
            type: 'intake',
            title: '入站登记',
            detail: `来源：${animal.sourceDetail || animal.source}，${animal.isolationStatus?.isInIsolation ? '需隔离观察' : '无需隔离'}`,
            sortDate: animal.intakeDate || ''
        });
        (animal.weightHistory || []).forEach(w => {
            events.push({
                date: w.date,
                type: 'weight',
                title: `体重记录：${w.weight} kg`,
                detail: '',
                sortDate: w.date
            });
        });
        load(KEYS.medical).filter(r => r.animalId === animalId).forEach(r => {
            events.push({
                date: r.date,
                type: 'medical',
                title: `${typeMapBrief[r.type] || r.type} - ${r.description || ''}`,
                detail: r.vet ? `兽医：${r.vet}` : '',
                sortDate: r.date,
                medicalType: r.type
            });
        });
        load(KEYS.placements).filter(p => p.animalId === animalId).forEach(p => {
            const family = getFamily(p.familyId);
            const typeLabel = p.type === 'adopt' ? '领养' : '寄养';
            events.push({
                date: p.startDate,
                type: 'placement',
                title: `${typeLabel}${family ? ' - ' + family.name : ''}`,
                detail: p.notes || '',
                sortDate: p.startDate,
                placementType: p.type
            });
        });
        load(KEYS.followups).filter(f => f.animalId === animalId).forEach(f => {
            const family = f.familyId ? getFamily(f.familyId) : null;
            const typeLabels = { post_adopt: '领养回访', post_foster: '寄养回访', lost: '走失', found: '找回', other: '其他' };
            events.push({
                date: f.date,
                type: 'followup',
                title: `${typeLabels[f.type] || f.type}${family ? ' - ' + family.name : ''}`,
                detail: f.notes || '',
                sortDate: f.date,
                followupType: f.type
            });
        });
        events.sort((a, b) => new Date(b.sortDate) - new Date(a.sortDate));
        return events;
    }

    const typeMapBrief = { deworming: '驱虫', vaccination: '疫苗', surgery: '手术', checkup: '体检', medication: '用药', other: '其他' };

    function getStats() {
        const animals = load(KEYS.animals);
        const expenses = load(KEYS.expenses);
        const inStation = animals.filter(a => ['isolated', 'available'].includes(a.status));
        return {
            total: animals.length,
            inStation: inStation.length,
            isolated: animals.filter(a => a.status === 'isolated').length,
            available: animals.filter(a => a.status === 'available').length,
            fostered: animals.filter(a => a.status === 'fostered').length,
            adopted: animals.filter(a => a.status === 'adopted').length,
            lost: animals.filter(a => a.status === 'lost').length,
            deceased: animals.filter(a => a.status === 'deceased').length,
            cats: animals.filter(a => a.species === 'cat').length,
            dogs: animals.filter(a => a.species === 'dog').length,
            totalIncome: expenses.filter(e => e.type === 'income').reduce((s, e) => s + e.amount, 0),
            totalExpense: expenses.filter(e => e.type === 'expense').reduce((s, e) => s + e.amount, 0),
            capacity: inStation.length
        };
    }

    function getMonthlyReport(year, month) {
        const y = year || new Date().getFullYear();
        const m = month || new Date().getMonth() + 1;
        const prefix = `${y}-${String(m).padStart(2, '0')}`;
        const animals = load(KEYS.animals).filter(a => a.intakeDate && a.intakeDate.startsWith(prefix));
        const medicals = load(KEYS.medical).filter(r => r.date && r.date.startsWith(prefix));
        const expenses = load(KEYS.expenses).filter(e => e.date && e.date.startsWith(prefix));
        const placements = load(KEYS.placements).filter(p => p.startDate && p.startDate.startsWith(prefix));
        const followups = load(KEYS.followups).filter(f => f.date && f.date.startsWith(prefix));
        return { animals, medicals, expenses, placements, followups, year: y, month: m };
    }

    function exportData() {
        return {
            animals: load(KEYS.animals),
            medical: load(KEYS.medical),
            families: load(KEYS.families),
            placements: load(KEYS.placements),
            expenses: load(KEYS.expenses),
            inventory: load(KEYS.inventory),
            followups: load(KEYS.followups),
            stockflow: load(KEYS.stockflow),
            stocktakes: load(KEYS.stocktakes),
            config: loadConfig(),
            exportedAt: new Date().toISOString()
        };
    }

    function importData(data) {
        if (data.animals) save(KEYS.animals, data.animals);
        if (data.medical) save(KEYS.medical, data.medical);
        if (data.families) save(KEYS.families, data.families);
        if (data.placements) save(KEYS.placements, data.placements);
        if (data.expenses) save(KEYS.expenses, data.expenses);
        if (data.inventory) save(KEYS.inventory, data.inventory);
        if (data.followups) save(KEYS.followups, data.followups);
        if (data.stockflow) save(KEYS.stockflow, data.stockflow);
        if (data.stocktakes) save(KEYS.stocktakes, data.stocktakes);
        if (data.config) saveConfig(data.config);
    }

    function initDemoData() {
        if (load(KEYS.animals).length > 0) return;
        const demoAnimals = [
            { name: '小花', species: 'cat', breed: '中华田园猫', gender: 'female', age: '2岁', color: '橘白', chipNumber: 'CN20240001', source: 'stray', sourceDetail: '街边救助', status: 'available', characteristics: '左耳有缺口，性格温顺', weight: 4.2 },
            { name: '旺财', species: 'dog', breed: '中华田园犬', gender: 'male', age: '3岁', color: '黄色', chipNumber: 'CN20240002', source: 'surrender', sourceDetail: '主人搬迁弃养', status: 'isolated', characteristics: '右前腿有旧伤疤', weight: 12.5 },
            { name: '雪球', species: 'cat', breed: '英短', gender: 'male', age: '1岁', color: '白色', chipNumber: 'CN20240003', source: 'rescue', sourceDetail: '小区群护发现', status: 'fostered', characteristics: '蓝眼睛，非常亲人', weight: 3.8 },
            { name: '阿黄', species: 'dog', breed: '拉布拉多', gender: 'male', age: '4岁', color: '金色', chipNumber: 'CN20240004', source: 'stray', sourceDetail: '高速路边救助', status: 'available', characteristics: '性格活泼，已绝育', weight: 28.0 },
            { name: '咪咪', species: 'cat', breed: '狸花猫', gender: 'female', age: '6月', color: '虎斑', chipNumber: 'CN20240005', source: 'rescue', sourceDetail: '下水道救出', status: 'isolated', characteristics: '体型偏瘦，胆小', weight: 2.1 },
            { name: '豆豆', species: 'dog', breed: '泰迪', gender: 'female', age: '2岁', color: '棕色', chipNumber: '', source: 'surrender', sourceDetail: '主人过敏弃养', status: 'adopted', characteristics: '已打完疫苗，很乖', weight: 5.5 }
        ];
        demoAnimals.forEach(a => createAnimal(a));
        const a1 = load(KEYS.animals)[0];
        const a2 = load(KEYS.animals)[1];
        createMedical({ animalId: a1.id, date: '2024-11-01', type: 'vaccination', description: '猫三联第一针', vet: '张医生', cost: 120, nextDate: '2025-02-01' });
        createMedical({ animalId: a1.id, date: '2024-12-15', type: 'deworming', description: '体内外驱虫', vet: '张医生', cost: 80, nextDate: '2025-03-15' });
        createMedical({ animalId: a2.id, date: '2024-12-01', type: 'surgery', description: '绝育手术', vet: '李医生', cost: 600, nextDate: '' });
        createFamily({ name: '王女士', contact: '王芳', phone: '13800138001', address: '幸福路88号', type: 'adopt', conditions: '有独立房间，家中无小孩', preferences: '猫，性格温顺', experience: '之前养过两只猫' });
        createFamily({ name: '陈先生', contact: '陈伟', phone: '13900139002', address: '阳光花园12栋', type: 'foster', conditions: '有院子，可以提供活动空间', preferences: '狗，中型犬', experience: '有5年养狗经验' });
        createExpense({ date: '2024-12-01', category: 'donation', type: 'income', amount: 5000, description: '月度爱心捐赠', donor: '爱心人士张先生' });
        createExpense({ date: '2024-12-05', category: 'medical', type: 'expense', amount: 800, description: '疫苗及驱虫费用' });
        createExpense({ date: '2024-12-10', category: 'food', type: 'expense', amount: 1200, description: '猫粮狗粮采购' });
        createInventory({ name: '猫粮（成猫）', category: 'food', quantity: 80, unit: 'kg', minQuantity: 20 });
        createInventory({ name: '狗粮（成犬）', category: 'food', quantity: 50, unit: 'kg', minQuantity: 15 });
        createInventory({ name: '猫砂', category: 'supply', quantity: 30, unit: '袋', minQuantity: 10 });
        createInventory({ name: '驱虫药', category: 'medicine', quantity: 15, unit: '盒', minQuantity: 5 });
        createInventory({ name: '猫三联疫苗', category: 'medicine', quantity: 8, unit: '支', minQuantity: 3 });
        createInventory({ name: '犬用疫苗', category: 'medicine', quantity: 6, unit: '支', minQuantity: 2 });
        createInventory({ name: '消炎药', category: 'medicine', quantity: 10, unit: '盒', minQuantity: 3 });
    }

    return {
        generateId,
        createAnimal, updateAnimal, deleteAnimal, getAnimal, getAllAnimals, searchAnimals, batchUpdateStatus, updateWeight,
        createMedical, updateMedical, deleteMedical, getMedicalByAnimal, getAllMedical, getUpcomingReminders, getGroupedReminders, completeReminder, rescheduleReminder,
        createFamily, updateFamily, deleteFamily, getFamily, getAllFamilies, matchAdopters,
        createPlacement, updatePlacement, deletePlacement, getPlacementsByAnimal, getAllPlacements,
        createExpense, updateExpense, deleteExpense, getAllExpenses,
        createInventory, updateInventory, deleteInventory, getAllInventory, deductInventory, returnInventory, adjustInventoryDelta, createStockflow, getAllStockflows,
        createStocktake, updateStocktake, deleteStocktake, getAllStocktakes, confirmStocktake, getReminderTypeCounts,
        createFollowup, updateFollowup, deleteFollowup, getFollowupsByAnimal, getAllFollowups,
        getStats, getMonthlyReport, getAnimalTimeline, exportData, importData,
        loadConfig, saveConfig, initDemoData
    };
})();
