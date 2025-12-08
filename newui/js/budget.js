document.addEventListener('DOMContentLoaded', () => {
    // --- Модалка ---
    const expenseModal = document.getElementById("expense-modal");
    const addExpenseBtn = document.getElementById("add-expense-btn");
    const closeExpenseBtn = document.getElementById("close-expense-btn");
    const cancelExpenseBtn = document.getElementById("cancel-expense-btn");
    const saveExpenseBtn = document.getElementById("save-expense-btn");

    const expenseForm = document.getElementById("expenseForm");
    const descInput = document.getElementById("expense-description");
    const amountInput = document.getElementById("expense-amount");
    const statusSelect = document.getElementById('expense-status');
    const selectedStatus = statusSelect.querySelector('.select-selected');
    const statusItems = statusSelect.querySelector('.select-items');
    const deleteExpenseBtn = document.getElementById('delete-expense-btn');
    const modalTitle = document.getElementById('modal-title');

    const expensesTbody = document.getElementById("expenses-tbody");
    const debtsTbody = document.getElementById("debts-tbody");
    const totalPerPersonEl = document.getElementById("total-per-person");
    const totalAmountEl = document.getElementById("total-amount");

    let expenses = [];
    let debts = {};
    const currentUser = 'Иван'; // Текущий пользователь для демо. Замените на реальную логику аутентификации.
    let editingIndex = null;

    function openModal() { expenseModal.style.display = 'flex'; }
    function closeModal() { expenseModal.style.display = 'none'; }

    addExpenseBtn.addEventListener('click', () => {
        // Открываем модалку для создания новой статьи
        editingIndex = null;
        expenseForm.reset();
        selectedAuthor.textContent = 'Выберите автора';
        selectedAuthor.dataset.value = '';
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        selectedStatus.textContent = 'Создано';
        selectedStatus.dataset.value = 'Создано';
        deleteExpenseBtn.style.display = 'none';
        modalTitle.textContent = 'Новая трата';
        openModal();
    });
    closeExpenseBtn.addEventListener('click', closeModal);
    cancelExpenseBtn.addEventListener('click', () => { expenseForm.reset(); closeModal(); });

    // --- Кастомный select автор ---
    const authorSelect = document.getElementById('expense-author');
    const selectedAuthor = authorSelect.querySelector('.select-selected');
    const authorItems = authorSelect.querySelector('.select-items');

    selectedAuthor.addEventListener('click', () => {
        authorItems.classList.toggle('select-hide');
    });

    authorItems.querySelectorAll('div').forEach(item => {
        item.addEventListener('click', () => {
            selectedAuthor.textContent = item.textContent;
            selectedAuthor.dataset.value = item.dataset.value;
            authorItems.classList.add('select-hide');
        });
    });

    // --- Кастомный multi-select участники ---
    const multiSelect = document.getElementById('expense-participants');
    const multiSelected = multiSelect.querySelector('.multi-selected');
    const multiItems = multiSelect.querySelector('.multi-items');

    multiSelected.addEventListener('click', () => {
        multiItems.classList.toggle('select-hide');
    });

    multiItems.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            const checked = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
            multiSelected.textContent = checked.length ? checked.join(', ') : 'Выберите участников';
        });
    });

    // --- Кастомный select статус ---
    selectedStatus.addEventListener('click', () => {
        statusItems.classList.toggle('select-hide');
    });

    statusItems.querySelectorAll('div').forEach(item => {
        item.addEventListener('click', () => {
            selectedStatus.textContent = item.textContent;
            selectedStatus.dataset.value = item.dataset.value;
            statusItems.classList.add('select-hide');
        });
    });

    // Закрытие кастомных select при клике вне
    document.addEventListener('click', (e) => {
        if (!authorSelect.contains(e.target)) authorItems.classList.add('select-hide');
        if (!multiSelect.contains(e.target)) multiItems.classList.add('select-hide');
        if (!statusSelect.contains(e.target)) statusItems.classList.add('select-hide');
    });

    // --- Сохранение расхода ---
    saveExpenseBtn.addEventListener('click', () => {
        const desc = descInput.value.trim();
        const author = selectedAuthor.dataset.value;
        const participants = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
        const amount = parseFloat(amountInput.value);

        if (!desc || !author || participants.length === 0 || isNaN(amount) || amount <= 0) return;

        if (editingIndex !== null) {
            // Обновляем существующую статью
            const ex = expenses[editingIndex];
            // Менять автора и статус через модалку не будем — статус меняется в таблице селектом (только автор может)
            ex.desc = desc;
            ex.participants = participants;
            ex.amount = amount;
            // Статус можно поменять в модалке, но только если текущий пользователь — автор
            if (currentUser === ex.author) ex.status = selectedStatus.dataset.value;
            editingIndex = null;
        } else {
            // Добавляем новую статью (по умолчанию статус "Создано")
            const expense = { desc, author, participants, amount, status: selectedStatus.dataset.value || 'Создано' };
            expenses.push(expense);
        }        updateExpensesTable();
        updateDebts();
        expenseForm.reset();
        selectedAuthor.textContent = 'Выберите автора';
        selectedAuthor.dataset.value = '';
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        closeModal();
    });

    // Удаление статьи из модалки (только автор)
    deleteExpenseBtn.addEventListener('click', () => {
        if (editingIndex === null) return;
        if (expenses[editingIndex].author !== currentUser) return;
        expenses.splice(editingIndex, 1);
        editingIndex = null;
        expenseForm.reset();
        deleteExpenseBtn.style.display = 'none';
        selectedAuthor.textContent = 'Выберите автора';
        selectedAuthor.dataset.value = '';
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        closeModal();
        updateExpensesTable();
        updateDebts();
    });

    function updateExpensesTable() {
        expensesTbody.innerHTML = '';
        let totalAmount = 0;
        let totalPerPerson = 0;

        expenses.forEach((e, index) => {
            const row = document.createElement('tr');

            const perPerson = (e.amount / e.participants.length).toFixed(2);
            totalAmount += e.amount;
            totalPerPerson += parseFloat(perPerson);

            // Строка с показом статуса (не редактируется в таблице)
            row.classList.add('status-' + ((e.status || 'Создано').toLowerCase().replace(/\s+/g,'-')));
            row.innerHTML = `
                <td>${e.desc}</td>
                <td>${e.author}</td>
                <td>${e.participants.join(', ')}</td>
                <td>${perPerson} ₽</td>
                <td>${e.amount} ₽</td>
                <td class="status-cell">${e.status || 'Создано'}</td>
            `;
            // Открытие модалки по клику строки — только для автора
            row.addEventListener('click', () => {
                if (e.author !== currentUser) return;
                editingIndex = index;
                descInput.value = e.desc;
                amountInput.value = e.amount;
                selectedAuthor.textContent = e.author;
                selectedAuthor.dataset.value = e.author;
                multiItems.querySelectorAll('input').forEach(cb => cb.checked = e.participants.includes(cb.value));
                const checked = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
                multiSelected.textContent = checked.length ? checked.join(', ') : 'Выберите участников';
                selectedStatus.textContent = e.status || 'Создано';
                selectedStatus.dataset.value = e.status || 'Создано';
                deleteExpenseBtn.style.display = 'inline-block';
                modalTitle.textContent = 'Изменение траты';
                // Если текущий пользователь не автор, скрываем элементы — but click won't open for non-author
                openModal();
            });
            expensesTbody.appendChild(row);
        });

        totalAmountEl.textContent = totalAmount.toFixed(2) + ' ₽';
        totalPerPersonEl.textContent = totalPerPerson.toFixed(2) + ' ₽';

        // Никаких дополнительных обработчиков — клик строки откроет модалку для автора
    }

    function updateDebts() {
        debtsTbody.innerHTML = '';
        debts = {};

        // В таблице долгов учитываем только неоплаченные статьи (те, у которых статус !== 'Выполнено')
        expenses.filter(e => (e.status !== 'Выполнено')).forEach(e => {
            const share = e.amount / e.participants.length;
            e.participants.forEach(p => {
                if (!debts[p]) debts[p] = 0;
                debts[p] += share;
            });
        });

        // Сортируем участников по убыванию долга
        const sorted = Object.entries(debts).sort((a,b) => b[1] - a[1]);
        sorted.forEach(([participant, amount]) => {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${participant}</td><td>${amount.toFixed(2)} ₽</td>`;
            debtsTbody.appendChild(row);
        });
    }

    // ESC для закрытия модалки
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

    // Примерные данные для демонстрации на странице
    expenses = [
        { desc: 'Пицца и закуски', author: 'Иван', participants: ['Иван', 'Катя', 'Сергей'], amount: 1200 },
        { desc: 'Аренда зала', author: 'Катя', participants: ['Катя', 'Сергей'], amount: 3000 },
        { desc: 'Напитки', author: 'Сергей', participants: ['Иван', 'Катя', 'Сергей'], amount: 600 }
    ];

    updateExpensesTable();
    updateDebts();
});
