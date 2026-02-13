import SmartAPI from "./api.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Элементы модалок и кнопок ---
    const expenseModal = document.getElementById("expense-modal");
    const detailModal = document.getElementById("expense-detail-modal");
    const addExpenseBtn = document.getElementById("add-expense-btn");
    const closeExpenseBtn = document.getElementById("close-expense-btn");
    const closeDetailBtn = document.getElementById("close-detail-btn");
    const cancelExpenseBtn = document.getElementById("cancel-expense-btn");
    const saveExpenseBtn = document.getElementById("save-expense-btn");
    const authText = document.getElementById("authText");
    const authButton = document.getElementById('authButton');
    const logo = document.querySelector('.logo');
    const backBtn = document.getElementById('backBtn');

    // --- Фильтры ---
    const statusFilter = document.getElementById("status-filter");
    const roleFilter = document.getElementById("role-filter");

    // --- Элементы формы ---
    const expenseForm = document.getElementById("expenseForm");
    const descInput = document.getElementById("expense-description");
    const amountInput = document.getElementById("expense-amount");
    const deleteExpenseBtn = document.getElementById('delete-expense-btn');
    const modalTitle = document.getElementById('modal-title');

    // --- Таблицы ---
    const expensesTbody = document.getElementById("expenses-tbody");
    const debtsTbody = document.getElementById("debts-tbody");
    const totalAmountEl = document.getElementById("total-amount");

    // --- Multi-select участников ---
    const multiSelect = document.getElementById('expense-participants');
    const multiSelected = multiSelect.querySelector('.multi-selected');
    const multiItems = multiSelect.querySelector('.multi-items');

    // --- Переменные состояния ---
    let allExpenses = [];
    let debts = {};
    let participantsDict = {}; // username -> tg_id
    const currentUser = await getCurrentUserInfo();
    const currentEventId = JSON.parse(localStorage.getItem('currentEventId'));
    let editingBudgetId = null;
    let filters = {
        status: "",
        role: ""
    };

    // --- Инициализация ---
    await getEventUsers();
    await updateExpensesFromServer();

    // --- Logo click handler ---
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'my-event-page.html';
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            if (window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = 'my-event-page.html';
            }
        });
    }

    // --- Auth button click handler ---
    if (authButton) {
        authButton.addEventListener('click', () => {
            window.location.href = 'personal-account.html';
        });
    }

    // --- Фильтры ---
    statusFilter.addEventListener('change', (e) => {
        filters.status = e.target.value;
        updateExpensesTable();
    });

    roleFilter.addEventListener('change', (e) => {
        filters.role = e.target.value;
        updateExpensesTable();
    });

    // --- Модальные окна ---
    function openModal(modal) { modal.style.display = 'flex'; }
    function closeModal(modal) { modal.style.display = 'none'; }

    addExpenseBtn.addEventListener('click', () => {
        editingBudgetId = null;
        expenseForm.reset();
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        deleteExpenseBtn.style.display = 'none';
        modalTitle.textContent = 'Новая трата';
        document.getElementById("expense-author-display").textContent = currentUser.username;
        openModal(expenseModal);
    });

    closeExpenseBtn.addEventListener('click', () => closeModal(expenseModal));
    closeDetailBtn.addEventListener('click', () => closeModal(detailModal));
    cancelExpenseBtn.addEventListener('click', () => { 
        expenseForm.reset(); 
        closeModal(expenseModal); 
    });

    // --- Закрытие мультиселекта при клике снаружи ---
    document.addEventListener('click', e => {
        if (!multiSelect.contains(e.target)) multiItems.classList.add('select-hide');
    });

    // --- Загрузка участников события ---
    async function getEventUsers() {
        try {
            const eventData = await SmartAPI.getEventById(currentEventId);
            participantsDict = {};
            eventData.participants.forEach(p => {
                if (p.status === "PARTICIPATING") {
                    participantsDict[p.username] = p.tg_id;
                }
            });
            loadParticipants(Object.keys(participantsDict));
        } catch (error) {
            console.error("Ошибка загрузки участников события:", error);
        }
    }

    // --- Получение информации о текущем пользователе ---
    async function getCurrentUserInfo() {
        try {
            const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
            authText.innerHTML = `<b>${userData.username}</b>`;
            const authorDisplay = document.getElementById("expense-author-display");
            if (authorDisplay) authorDisplay.textContent = userData.username;
            return userData;
        } catch (error) {
            console.error("Ошибка получения информации пользователя:", error);
            return null;
        }
    }

    // --- Загрузка расходов с сервера ---
    async function updateExpensesFromServer() {
        try {
            const serverExpenses = await SmartAPI.getBudget(currentEventId);
            allExpenses = serverExpenses || [];
            updateExpensesTable();
            updateDebts();
        } catch(error) {
            console.error("Ошибка загрузки расходов с сервера:", error);
            allExpenses = [];
        }
    }

    // --- Загрузка участников в мультиселект ---
    function loadParticipants(usernames) {
        multiItems.innerHTML = '';
        usernames.forEach(username => {
            const wrapper = document.createElement('label');
            wrapper.className = 'multi-item';
            wrapper.innerHTML = `
                <div class="multi-item">
                    <label>
                        <input type="checkbox" value="${username}">
                        <span>${username}</span>
                    </label>
                </div>
            `;
            multiItems.appendChild(wrapper);
        });
        multiItems.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', updateMultiSelectedText);
        });
    }

    // --- Обновление текста мультиселекта ---
    function updateMultiSelectedText() {
        const checked = Array.from(multiItems.querySelectorAll('input:checked')).map(c => c.value);
        multiSelected.textContent = checked.length ? checked.join(', ') : 'Выберите участников';
    }

    multiSelected.addEventListener('click', () => multiItems.classList.toggle('select-hide'));

    // --- Преобразование статуса траты в русский ---
    function getStatusBudgetRu(status) {
        const statusMap = {
            'ACTIVE': 'Активная',
            'PARTIALLY_PAID': 'Частично оплачена',
            'CLOSED': 'Закрыта',
            'DELETED': 'Удалена'
        };
        return statusMap[status] || status;
    }

    // --- Преобразование статуса участника в русский ---
    function getStatusParticipantRu(status) {
        const statusMap = {
            'PENDING': 'В ожидании оплаты',
            'PAID': 'Полностью оплачено',
            'PARTIALLY_PAID': 'Частично оплачено',
            'CONFIRMED': 'Оплата принята'
        };
        return statusMap[status] || status;
    }

    // --- Фильтрация расходов ---
    function getFilteredExpenses() {
        return allExpenses.filter(expense => {
            // Фильтр по статусу траты
            if (filters.status && expense.status !== filters.status) {
                return false;
            }

            // Фильтр по роли
            if (filters.role === "owner") {
                // Показываем только траты, где я автор
                if (expense.paid_by.username !== currentUser.username) {
                    return false;
                }
            } else if (filters.role === "participant") {
                // Показываем траты, где я участник
                const isParticipant = expense.participants.some(p => p.user.username === currentUser.username);
                if (!isParticipant) {
                    return false;
                }
            }

            return true;
        });
    }

    // --- Обновление таблицы расходов ---
    function updateExpensesTable() {
        expensesTbody.innerHTML = '';
        const filtered = getFilteredExpenses();

        filtered.forEach((expense) => {
            const row = document.createElement('tr');
            row.className = `status-${expense.status.toLowerCase()}`;

            const statusRu = getStatusBudgetRu(expense.status);
            if (expense.status !== 'DELETED') {
                row.innerHTML = `
                    <td data-label="Статья расхода">${expense.description || "Без описания"}</td>
                    <td data-label="Автор">${expense.paid_by.username}</td>
                    <td data-label="Сумма">${expense.amount.toFixed(2)} ₽</td>
                    <td data-label="Статус"><span class="status-badge status-${expense.status.toLowerCase()}">${statusRu}</span></td>
                    <td data-label="Детали"><button class="detail-btn" data-budget-id="${expense.id}">Посмотреть</button></td>
                `;

                row.addEventListener('click', () => {
                    showExpenseDetail(expense);
                });
            }

            expensesTbody.appendChild(row);
        });

        // Всегда показываем общую сумму всех трат, исключая удаленные, независимо от фильтров
        let totalAmount = 0;
        allExpenses.forEach(expense => {
            // Исключаем удаленные траты из общей суммы
            if (expense.status !== 'DELETED') {
                totalAmount += expense.amount;
            }
        });
        totalAmountEl.textContent = totalAmount.toFixed(2) + ' ₽';
    }

    // --- Отображение деталей траты ---
    function showExpenseDetail(expense) {
        const detailContent = document.getElementById("expense-detail-content");
        const isOwner = expense.paid_by.username === currentUser.username;

        let participantsHtml = expense.participants.map(participant => {
            const statusRu = getStatusParticipantRu(participant.status);
            const remainingAmount = Math.max(0, (participant.share_amount - participant.paid_amount).toFixed(2));
            
            let actionBtn = '';
            if (isOwner && (participant.status === "PENDING" || participant.status === "PARTIALLY_PAID" || participant.status === "PAID")) {
                // Владелец может подтвердить при PAID или PARTIALLY_PAID (если участник внес достаточно)
                if (participant.status === "PAID" || (participant.status === "PARTIALLY_PAID" && parseFloat(remainingAmount) <= 0)) {
                    actionBtn = `<button class="confirm-btn" data-participant-id="${participant.id}" data-participant-tg-id="${participant.user.tg_id}">Подтвердить</button>`;
                } else if (participant.status === "PARTIALLY_PAID") {
                    // При частичной оплате показываем статус процесса
                    const progressPercent = ((participant.paid_amount / participant.share_amount) * 100).toFixed(0);
                    actionBtn = `<div class="payment-progress"><span class="progress-text">Оплачено ${progressPercent}%</span></div>`;
                } else if (participant.status === "PENDING") {
                    actionBtn = '';
                }
            }
            
            // Участник может вводить сумму оплаты при PENDING или PARTIALLY_PAID, пока долг не погашен
            if (!isOwner && participant.user.username === currentUser.username && 
                (participant.status === "PENDING" || participant.status === "PARTIALLY_PAID")) {
                const remainingValue = Math.max(0, parseFloat(remainingAmount));
                
                if (remainingValue > 0) {
                    const buttonText = participant.status === "PENDING" ? "Оплатить" : "Добавить";
                    actionBtn = `
                        <div class="payment-input-group">
                            <input type="number" class="payment-input" data-participant-id="${participant.id}" data-share-amount="${participant.share_amount}" data-paid-amount="${participant.paid_amount}" placeholder="0.00" min="0" step="0.01">
                            <button class="pay-submit-btn" data-participant-id="${participant.id}" data-share-amount="${participant.share_amount}" data-paid-amount="${participant.paid_amount}">${buttonText}</button>
                        </div>
                    `;
                }
            }

            return `
                <div class="participant-item">
                    <div class="participant-info">
                        <span class="participant-name">${participant.user.username}</span>
                        <span class="participant-status status-${participant.status.toLowerCase()}">${statusRu}</span>
                    </div>
                    <div class="participant-amounts">
                        <div class="amount-row"><span class="amount-label">Должен:</span> <span class="amount-value">${participant.share_amount.toFixed(2)} ₽</span></div>
                        <div class="amount-row"><span class="amount-label">Оплачено:</span> <span class="amount-value">${participant.paid_amount.toFixed(2)} ₽</span></div>
                        <div class="amount-row"><span class="amount-label">Осталось:</span> <span class="amount-value">${remainingAmount} ₽</span></div>
                    </div>
                    ${actionBtn}
                </div>
            `;
        }).join('');

        const deleteBtn = isOwner && expense.status !== 'DELETED' ? 
            `<button class="detail-delete-btn" data-budget-id="${expense.id}">Удалить трату</button>` : '';

        detailContent.innerHTML = `
            <div class="expense-detail">
                <div class="detail-row">
                    <span class="detail-label">Описание:</span>
                    <span class="detail-value">${expense.description || "Без описания"}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Автор:</span>
                    <span class="detail-value">${expense.paid_by.username}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Общая сумма:</span>
                    <span class="detail-value">${expense.amount.toFixed(2)} ₽</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Статус:</span>
                    <span class="detail-value status-badge status-${expense.status.toLowerCase()}">${getStatusBudgetRu(expense.status)}</span>
                </div>
                <div class="detail-row full-width">
                    <span class="detail-label">Участники:</span>
                </div>
                <div class="participants-list">
                    ${participantsHtml}
                </div>
                ${deleteBtn}
            </div>
        `;

        // Обработчики кнопок в модальном окне
        detailContent.querySelectorAll('.pay-submit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const participantId = parseInt(btn.getAttribute('data-participant-id'));
                const shareAmount = parseFloat(btn.getAttribute('data-share-amount'));
                const currentPaidAmount = parseFloat(btn.getAttribute('data-paid-amount'));
                const input = detailContent.querySelector(`input[data-participant-id="${participantId}"]`);
                let addAmount = parseFloat(input.value);
                
                // Валидация
                if (isNaN(addAmount) || addAmount <= 0) {
                    alert('Пожалуйста, введите корректную сумму!');
                    return;
                }

                // Отправляем ПОЛНУЮ сумму оплаты (которую backend просто установит как есть)
                await markParticipantPaid(expense.id, addAmount);
            });
        });

        detailContent.querySelectorAll('.confirm-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const participantTgId = btn.getAttribute('data-participant-tg-id');
                await confirmPayment(expense.id, participantTgId);
            });
        });

        detailContent.querySelectorAll('.detail-delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const budgetId = parseInt(btn.getAttribute('data-budget-id'));
                if (confirm('Вы уверены, что хотите удалить эту трату?')) {
                    await deleteExpense(budgetId);
                }
            });
        });

        openModal(detailModal);
    }

    // --- Отметить участника как оплачено ---
    async function markParticipantPaid(budgetId, totalPaidAmount) {
        try {
            // Отправляем ПОЛНУЮ сумму оплаты, которую backend просто установит
            await SmartAPI.markParticipantPaid(budgetId, totalPaidAmount);
            await updateExpensesFromServer();
            
            // Находим обновленный расход и перестраиваем модальное окно
            const updatedExpense = allExpenses.find(e => e.id === budgetId);
            if (updatedExpense) {
                showExpenseDetail(updatedExpense);
                // alert('Платеж зафиксирован!');
            }
        } catch (error) {
            console.error('Ошибка при фиксации платежа:', error);
            alert('Ошибка при обновлении статуса!');
        }
    }

    // --- Подтвердить платеж (для владельца) ---
    async function confirmPayment(budgetId, participantTgId) {
        try {
            await SmartAPI.confirmPayment(budgetId, participantTgId);
            await updateExpensesFromServer();
            
            // Находим обновленный расход и перестраиваем модальное окно
            const updatedExpense = allExpenses.find(e => e.id === budgetId);
            if (updatedExpense) {
                showExpenseDetail(updatedExpense);
                // alert('Платеж подтвержден!');
            }
        } catch (error) {
            console.error('Ошибка при подтверждении платежа:', error);
            alert('Ошибка при подтверждении платежа!');
        }
    }

    // --- Удалить трату (маркировать как удаленную) ---
    async function deleteExpense(budgetId) {
        try {
            await SmartAPI.deleteBudget(budgetId);
            await updateExpensesFromServer();
            closeModal(detailModal);
            // alert('Трата удалена!');
        } catch (error) {
            console.error('Ошибка при удалении траты:', error);
            alert('Ошибка при удалении траты!');
        }
    }

    // --- Сохранение новой траты ---
    saveExpenseBtn.addEventListener('click', async () => {
        const desc = descInput.value.trim();
        const participantsUsername = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
        const participantsTgIds = participantsUsername.map(u => String(participantsDict[u]));
        const amount = parseFloat(amountInput.value);

        if (!desc || participantsUsername.length === 0 || isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, заполните все поля корректно!');
            return;
        }

        try {
            const data = {
                event_id: currentEventId,
                amount,
                description: desc,
                participants: participantsTgIds
            };
            
            // Проверка: если владелец - единственный участник (фиктивная трата)
            // То после создания нужно сразу отметить как оплачено
            const isFictitious = participantsUsername.length === 1 && participantsUsername[0] === currentUser.username;
            
            await SmartAPI.createBudget(data);
            
            // Очистка формы
            expenseForm.reset();
            multiSelected.textContent = 'Выберите участников';
            multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
            deleteExpenseBtn.style.display = 'none';
            closeModal(expenseModal);

            // Обновление таблицы
            await updateExpensesFromServer();
            
            if (isFictitious) {
                // Для фиктивной траты автоматически отмечаем как оплачено
                const latestExpense = allExpenses[allExpenses.length - 1];
                if (latestExpense && latestExpense.participants.length === 1) {
                    try {
                        await SmartAPI.markParticipantPaid(latestExpense.id, amount);
                        await updateExpensesFromServer();
                    } catch (err) {
                        console.error('Автоматическая отметка фиктивной траты:', err);
                    }
                }
            }
            
            // alert('Трата успешно добавлена!');
        } catch (error) {
            console.error('Ошибка при создании бюджета:', error);
            alert('Ошибка при создании траты!');
        }
    });

    // --- Обновление табличного представления долгов ---
    function updateDebts() {
        debtsTbody.innerHTML = '';
        debts = {};

        // Посчитаем долги каждого участника, исключая удаленные траты
        allExpenses.forEach(expense => {
            // Исключаем удаленные траты из подсчета долгов
            if (expense.status === 'DELETED') {
                return;
            }
            
            expense.participants.forEach(participant => {
                const remaining = participant.share_amount - participant.paid_amount;
                if (remaining > 0) {
                    const username = participant.user.username;
                    debts[username] = (debts[username] || 0) + remaining;
                }
            });
        });

        // Отсортируем и отобразим
        Object.entries(debts).sort((a, b) => b[1] - a[1]).forEach(([participant, amt]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${participant}</td><td>${amt.toFixed(2)} ₽</td>`;
            debtsTbody.appendChild(row);
        });
    }

    document.addEventListener('keydown', e => { 
        if (e.key === 'Escape') {
            closeModal(expenseModal);
            closeModal(detailModal);
        }
    });

});
