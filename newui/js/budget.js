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
    const isEquallyCheckbox = document.getElementById("is-equally-checkbox");

    // --- Таблицы ---
    const expensesTbody = document.getElementById("expenses-tbody");
    const debtsTbody = document.getElementById("debts-tbody");
    const totalAmountEl = document.getElementById("total-amount");

    // --- Новые элементы для работы с участниками ---
    const participantsCheckboxes = document.getElementById('participants-checkboxes');
    const participantSharesContainer = document.getElementById('participant-shares-container');
    const participantSharesList = document.getElementById('participant-shares-list');
    let selectedParticipants = []; // { username, tg_id, share }

    // --- Переменные состояния ---
    let allExpenses = [];
    let debts = {};
    let participantsDict = {}; // username -> tg_id
    const currentUser = await getCurrentUserInfo();
    const currentEventId = JSON.parse(localStorage.getItem('currentEventId'));
    let editingBudgetId = null;
    let filters = { status: "", role: "" };

    // --- Инициализация ---
    await getEventUsers();
    await updateExpensesFromServer();

    // --- Обработчики навигации ---
    if (logo) {
        logo.addEventListener('click', () => window.location.href = 'my-event-page.html');
    }
    if (backBtn) {
        backBtn.addEventListener('click', () => window.history.length > 1 ? window.history.back() : window.location.href = 'my-event-page.html');
    }
    if (authButton) {
        authButton.addEventListener('click', () => window.location.href = 'personal-account.html');
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

    // --- Открытие формы добавления траты ---
    addExpenseBtn.addEventListener('click', () => {
        editingBudgetId = null;
        expenseForm.reset();
        // Сброс выбранных участников
        selectedParticipants = [];
        // Сброс чекбоксов
        document.querySelectorAll('#participants-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
        // Автоматически отметить автора
        const authorCheckbox = document.querySelector(`#participants-checkboxes input[value="${currentUser.username}"]`);
        if (authorCheckbox) {
            authorCheckbox.checked = true;
            updateSelectedParticipants(authorCheckbox);
        }
        // Скрыть блок долей, сбросить флаг равного деления
        participantSharesContainer.style.display = 'none';
        isEquallyCheckbox.checked = false;
        deleteExpenseBtn.style.display = 'none';
        modalTitle.textContent = 'Новая трата';
        document.getElementById("expense-author-display").textContent = currentUser.username;
        openModal(expenseModal);
    });

    // --- Закрытие модалок ---
    closeExpenseBtn.addEventListener('click', () => closeModal(expenseModal));
    closeDetailBtn.addEventListener('click', () => closeModal(detailModal));
    cancelExpenseBtn.addEventListener('click', () => {
        expenseForm.reset();
        closeModal(expenseModal);
    });

    // --- Обработка изменения суммы ---
    amountInput.addEventListener('input', () => {
        if (!isEquallyCheckbox.checked) {
            renderParticipantShares();
        } else {
            updateEqualShares();
        }
    });

    // --- Переключение режима "разделить поровну" ---
    isEquallyCheckbox.addEventListener('change', () => {
        if (isEquallyCheckbox.checked) {
            participantSharesContainer.style.display = 'none';
            updateEqualShares();
        } else {
            participantSharesContainer.style.display = 'block';
            renderParticipantShares();
        }
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
            // Убедимся, что текущий пользователь есть в списке (если его нет – добавим)
            if (!participantsDict[currentUser.username]) {
                participantsDict[currentUser.username] = currentUser.tg_id;
            }
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

    // --- Загрузка участников в чекбоксы ---
    function loadParticipants(usernames) {
        participantsCheckboxes.innerHTML = '';
        usernames.forEach(username => {
            const wrapper = document.createElement('label');
            wrapper.className = 'participant-checkbox';
            wrapper.innerHTML = `
                <input type="checkbox" value="${username}" data-tg-id="${participantsDict[username]}">
                <span>${username}</span>
            `;
            const cb = wrapper.querySelector('input');
            cb.addEventListener('change', (e) => {
                updateSelectedParticipants(e.target);
            });
            participantsCheckboxes.appendChild(wrapper);
        });
    }

    // --- Обновление выбранных участников ---
    function updateSelectedParticipants(checkbox) {
        const username = checkbox.value;
        const tg_id = checkbox.getAttribute('data-tg-id');
        const isChecked = checkbox.checked;

        if (isChecked) {
            if (!selectedParticipants.some(p => p.username === username)) {
                selectedParticipants.push({ username, tg_id, share: 0 });
            }
        } else {
            selectedParticipants = selectedParticipants.filter(p => p.username !== username);
        }

        if (isEquallyCheckbox.checked) {
            updateEqualShares();
        } else {
            renderParticipantShares();
        }
    }

    // --- Пересчёт долей поровну ---
    function updateEqualShares() {
        const totalAmount = parseFloat(amountInput.value) || 0;
        const count = selectedParticipants.length;
        const equalShare = count ? totalAmount / count : 0;
        selectedParticipants.forEach(p => p.share = equalShare);
        // Если включен режим поровну, не отображаем поля ввода, но сохраняем доли в selectedParticipants
    }

    // --- Отображение полей ввода долей (режим ручного ввода) ---
    function renderParticipantShares() {
        if (selectedParticipants.length === 0) {
            participantSharesContainer.style.display = 'none';
            return;
        }
        participantSharesContainer.style.display = 'block';
        participantSharesList.innerHTML = '';

        const totalAmount = parseFloat(amountInput.value) || 0;
        const equalShare = selectedParticipants.length ? totalAmount / selectedParticipants.length : 0;

        selectedParticipants.forEach((participant, index) => {
            // Если доля ещё не задана, подставляем поровну
            if (participant.share === 0) participant.share = equalShare;
            const item = document.createElement('div');
            item.className = 'share-item';
            item.innerHTML = `
                <span class="participant-name">${participant.username}</span>
                <input type="number" step="0.01" min="0" value="${participant.share.toFixed(2)}" data-index="${index}">
            `;
            const input = item.querySelector('input');
            input.addEventListener('input', (e) => {
                let value = parseFloat(e.target.value) || 0;
                if (value > totalAmount) value = totalAmount;
                selectedParticipants[parseInt(e.target.getAttribute('data-index'))].share = value;
                validateTotalShares();
            });
            participantSharesList.appendChild(item);
        });
        validateTotalShares();
    }

    let validationMessage = null;

    function validateTotalShares() {
        const totalAmount = parseFloat(amountInput.value) || 0;
        let sharesSum = selectedParticipants.reduce((sum, p) => sum + p.share, 0);
        if (validationMessage) validationMessage.remove();

        if (Math.abs(sharesSum - totalAmount) > 0.01) {
            validationMessage = document.createElement('div');
            validationMessage.className = 'total-validation';
            validationMessage.textContent = `Сумма долей (${sharesSum.toFixed(2)} ₽) не равна общей сумме (${totalAmount.toFixed(2)} ₽)`;
            participantSharesContainer.appendChild(validationMessage);
            saveExpenseBtn.disabled = true;
        } else {
            saveExpenseBtn.disabled = false;
        }
    }

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
            if (filters.status && expense.status !== filters.status) return false;
            if (filters.role === "owner" && expense.paid_by.username !== currentUser.username) return false;
            if (filters.role === "participant" && !expense.participants.some(p => p.user.username === currentUser.username)) return false;
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
                    <td data-label="Статья расхода">${expense.description || "Без описания"}<\/td>
                    <td data-label="Автор">${expense.paid_by.username}<\/td>
                    <td data-label="Сумма">${expense.amount.toFixed(2)} ₽<\/td>
                    <td data-label="Статус"><span class="status-badge status-${expense.status.toLowerCase()}">${statusRu}<\/span><\/td>
                    <td data-label="Детали"><button class="detail-btn" data-budget-id="${expense.id}">Посмотреть<\/button><\/td>
                `;
                row.addEventListener('click', () => showExpenseDetail(expense));
            }
            expensesTbody.appendChild(row);
        });

        // Общая сумма всех трат (исключая удалённые)
        let totalAmount = 0;
        allExpenses.forEach(expense => {
            if (expense.status !== 'DELETED') totalAmount += expense.amount;
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
                if (participant.status === "PAID" || (participant.status === "PARTIALLY_PAID" && parseFloat(remainingAmount) <= 0)) {
                    actionBtn = `<button class="confirm-btn" data-participant-id="${participant.id}" data-participant-tg-id="${participant.user.tg_id}">Подтвердить</button>`;
                } else if (participant.status === "PARTIALLY_PAID") {
                    const progressPercent = ((participant.paid_amount / participant.share_amount) * 100).toFixed(0);
                    actionBtn = `<div class="payment-progress"><span class="progress-text">Оплачено ${progressPercent}%</span></div>`;
                }
            }

            if (!isOwner && participant.user.username === currentUser.username &&
                (participant.status === "PENDING" || participant.status === "PARTIALLY_PAID")) {
                const remainingValue = Math.max(0, parseFloat(remainingAmount));
                if (remainingValue > 0) {
                    const buttonText = participant.status === "PENDING" ? "Оплатить" : "Добавить";
                    actionBtn = `
                        <div class="payment-input-group">
                            <input type="number" class="payment-input" data-participant-id="${participant.id}" placeholder="0.00" min="0" step="0.01">
                            <button class="pay-submit-btn" data-participant-id="${participant.id}">${buttonText}</button>
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

        // Обработчики для кнопок оплаты
        detailContent.querySelectorAll('.pay-submit-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const participantId = parseInt(btn.getAttribute('data-participant-id'));
                const input = detailContent.querySelector(`input[data-participant-id="${participantId}"]`);
                let addAmount = parseFloat(input.value);
                if (isNaN(addAmount) || addAmount <= 0) {
                    alert('Пожалуйста, введите корректную сумму!');
                    return;
                }
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
            await SmartAPI.markParticipantPaid(budgetId, totalPaidAmount);
            await updateExpensesFromServer();
            const updatedExpense = allExpenses.find(e => e.id === budgetId);
            if (updatedExpense) showExpenseDetail(updatedExpense);
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
            const updatedExpense = allExpenses.find(e => e.id === budgetId);
            if (updatedExpense) showExpenseDetail(updatedExpense);
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
        } catch (error) {
            console.error('Ошибка при удалении траты:', error);
            alert('Ошибка при удалении траты!');
        }
    }

    // --- Сохранение новой траты (адаптировано под is_equally) ---
    saveExpenseBtn.addEventListener('click', async () => {
        const desc = descInput.value.trim();
        const amount = parseFloat(amountInput.value);
        const isEqually = isEquallyCheckbox.checked;

        if (!desc || selectedParticipants.length === 0 || isNaN(amount) || amount <= 0) {
            alert('Пожалуйста, заполните все поля корректно!');
            return;
        }

        // Проверка суммы долей, если не поровну
        if (!isEqually) {
            const totalShares = selectedParticipants.reduce((sum, p) => sum + p.share, 0);
            if (Math.abs(totalShares - amount) > 0.01) {
                alert('Сумма долей должна равняться общей сумме траты!');
                return;
            }
        }

        // Формируем данные для API
        let participantsData;
        if (isEqually) {
            // Отправляем только tg_id (share_amount не нужен)
            participantsData = selectedParticipants.map(p => ({ tg_id: p.tg_id })); // Сделано под новую
        } else {
            // Отправляем tg_id и share_amount
            participantsData = selectedParticipants.map(p => ({
                tg_id: p.tg_id,
                share_amount: p.share
            }));
        }

        try {
            const data = {
                event_id: currentEventId,
                amount,
                description: desc,
                is_equally: isEqually,
                participants: participantsData
            };
            await SmartAPI.createBudget(data);

            // Очистка формы
            expenseForm.reset();
            selectedParticipants = [];
            renderParticipantShares();
            document.querySelectorAll('#participants-checkboxes input[type="checkbox"]').forEach(cb => cb.checked = false);
            closeModal(expenseModal);

            await updateExpensesFromServer();
        } catch (error) {
            console.error('Ошибка при создании траты:', error);
            alert('Ошибка при создании траты!');
        }
    });

    // --- Обновление табличного представления долгов ---
    function updateDebts() {
        debtsTbody.innerHTML = '';
        debts = {};

        allExpenses.forEach(expense => {
            if (expense.status === 'DELETED') return;
            expense.participants.forEach(participant => {
                const remaining = participant.share_amount - participant.paid_amount;
                if (remaining > 0) {
                    const username = participant.user.username;
                    debts[username] = (debts[username] || 0) + remaining;
                }
            });
        });

        Object.entries(debts).sort((a, b) => b[1] - a[1]).forEach(([participant, amt]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td data-label="Участник">${participant}<\/td><td data-label="Сумма долга">${amt.toFixed(2)} ₽<\/td>`;
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