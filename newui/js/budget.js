import SmartAPI from "./api.js";

document.addEventListener('DOMContentLoaded', async () => {
    // --- Элементы модалки ---
    const expenseModal = document.getElementById("expense-modal");
    const addExpenseBtn = document.getElementById("add-expense-btn");
    const closeExpenseBtn = document.getElementById("close-expense-btn");
    const cancelExpenseBtn = document.getElementById("cancel-expense-btn");
    const saveExpenseBtn = document.getElementById("save-expense-btn");
    const authText = document.getElementById("authText");
    const logo = document.querySelector('.logo');

    const expenseForm = document.getElementById("expenseForm");
    const descInput = document.getElementById("expense-description");
    const amountInput = document.getElementById("expense-amount");
    const deleteExpenseBtn = document.getElementById('delete-expense-btn');
    const modalTitle = document.getElementById('modal-title');

    const expensesTbody = document.getElementById("expenses-tbody");
    const debtsTbody = document.getElementById("debts-tbody");
    const totalAmountEl = document.getElementById("total-amount");

    // --- Multi-select участников ---
    const multiSelect = document.getElementById('expense-participants');
    const multiSelected = multiSelect.querySelector('.multi-selected');
    const multiItems = multiSelect.querySelector('.multi-items');

    let expenses = [];
    let debts = {};
    let participantsDict = {}; // username -> tg_id
    const currentUser = await getCurrentUserInfo();
    const currentEventId = JSON.parse(localStorage.getItem('currentEventId'));
    let editingIndex = null;

    await getEventUsers();
    await updateExpensesFromServer();

    // Logo click handler - navigate to events page
    if (logo) {
        logo.addEventListener('click', () => {
            // Переходим на страницу "Мои мероприятия"
            window.location.href = 'my-event-page.html';
        });
    }

    async function getEventUsers() {
        const eventData = await SmartAPI.getEventById(currentEventId);
        participantsDict = {};
        eventData.participants.forEach(p => {
            participantsDict[p.username] = p.tg_id;
        });
        loadParticipants(Object.keys(participantsDict));
    }

    async function getCurrentUserInfo() {
        const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        authText.innerHTML = `<b>${userData.username}</b>`;

        const authorDisplay = document.getElementById("expense-author-display");
        if (authorDisplay) authorDisplay.textContent = userData.username;

        return userData;
    }

    async function updateExpensesFromServer() {
        try {
            const serverExpenses = await SmartAPI.getBudget(currentEventId);

            // Преобразуем серверный формат → в формат frontend
            expenses = serverExpenses.map(budget => ({
                desc: budget.description || "",
                author: budget.paid_by.username,
                participants: budget.participants.map(p => p.username),
                amount: budget.amount,
                status: "Создано"
            }));

            updateExpensesTable();
            updateDebts();

        } catch (error) {
            console.error("Ошибка загрузки расходов с сервера:", error);
        }
    }

    function openModal() { expenseModal.style.display = 'flex'; }
    function closeModal() { expenseModal.style.display = 'none'; }

    addExpenseBtn.addEventListener('click', () => {
        editingIndex = null;
        expenseForm.reset();
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        deleteExpenseBtn.style.display = 'none';
        modalTitle.textContent = 'Новая трата';
        document.getElementById("expense-author-display").textContent = currentUser.username;
        openModal();
    });

    closeExpenseBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', () => { expenseForm.reset(); closeModal(); });

    // --- закрытие мультиселекта ---
    document.addEventListener('click', e => {
        if (!multiSelect.contains(e.target)) multiItems.classList.add('select-hide');
    });

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

    function updateMultiSelectedText() {
        const checked = Array.from(multiItems.querySelectorAll('input:checked')).map(c => c.value);
        multiSelected.textContent = checked.length ? checked.join(', ') : 'Выберите участников';
    }

    multiSelected.addEventListener('click', () => multiItems.classList.toggle('select-hide'));

    // --- Сохранение траты ---
    saveExpenseBtn.addEventListener('click', async () => {
        const desc = descInput.value.trim();
        const participantsUsername = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
        const participantsTgIds = participantsUsername.map(u => String(participantsDict[u]));
        const amount = parseFloat(amountInput.value);

        if (!desc || participantsUsername.length === 0 || isNaN(amount) || amount <= 0) return;

        if (editingIndex !== null) {
            const ex = expenses[editingIndex];
            ex.desc = desc;
            ex.participants = participantsUsername;
            ex.amount = amount;
            ex.status = "Создано";
            editingIndex = null;
        } else {
            const expense = {
                desc,
                author: currentUser.username,
                participants: participantsUsername,
                amount,
                status: "Создано"
            };
            const data = {
                event_id: currentEventId,
                amount,
                description: desc,
                participants: participantsTgIds
            };
            console.log('Создание бюджета с данными:', data);
            try {
                await SmartAPI.createBudget(data);
                expenses.push(expense);
            } catch (err) {
                console.error('Ошибка при создании бюджета:', err);
                return;
            }
        }

        updateExpensesTable();
        updateDebts();
        expenseForm.reset();
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        closeModal();
    });

    function updateExpensesTable() {
        expensesTbody.innerHTML = '';
        let totalAmount = 0, totalPerPerson = 0;
        expenses.forEach((e, idx) => {
            const row = document.createElement('tr');
            const perPerson = (e.amount / e.participants.length).toFixed(2);
            totalAmount += e.amount;
            totalPerPerson += parseFloat(perPerson);

            row.innerHTML = `
                <td data-label="Описание">${e.desc}</td>
                <td data-label="Автор">${e.author}</td>
                <td data-label="Участники">${e.participants.join(', ')}</td>
                <td data-label="С каждого">${perPerson} ₽</td>
                <td data-label="Сумма">${e.amount} ₽</td>
                <td data-label="Статус">Создано</td>
            `;

            row.addEventListener('click', () => {
                if (e.author !== currentUser.username) return;
                editingIndex = idx;
                descInput.value = e.desc;
                amountInput.value = e.amount;
                document.getElementById("expense-author-display").textContent = e.author;
                multiItems.querySelectorAll('input').forEach(cb => cb.checked = e.participants.includes(cb.value));
                updateMultiSelectedText();
                deleteExpenseBtn.style.display = 'inline-block';
                modalTitle.textContent = 'Изменение траты';
                openModal();
            });

            expensesTbody.appendChild(row);
        });

        totalAmountEl.textContent = totalAmount.toFixed(2) + ' ₽';
    }

    function updateDebts() {
        debtsTbody.innerHTML = '';
        debts = {};
        expenses.forEach(e => {
            const share = e.amount / e.participants.length;
            e.participants.forEach(p => {
                debts[p] = (debts[p] || 0) + share;
            });
        });
        Object.entries(debts).sort((a,b) => b[1]-a[1]).forEach(([p, amt]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${p}</td><td>${amt.toFixed(2)} ₽</td>`;
            debtsTbody.appendChild(row);
        });
    }

    deleteExpenseBtn.addEventListener('click', () => {
        if (editingIndex === null) return;
        if (expenses[editingIndex].author !== currentUser.username) return;
        expenses.splice(editingIndex, 1);
        editingIndex = null;
        expenseForm.reset();
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        deleteExpenseBtn.style.display = 'none';
        closeModal();
        updateExpensesTable();
        updateDebts();
    });

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

});
