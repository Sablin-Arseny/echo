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

    const expensesTbody = document.getElementById("expenses-tbody");
    const debtsTbody = document.getElementById("debts-tbody");
    const totalPerPersonEl = document.getElementById("total-per-person");
    const totalAmountEl = document.getElementById("total-amount");

    let expenses = [];
    let debts = {};

    function openModal() { expenseModal.style.display = 'flex'; }
    function closeModal() { expenseModal.style.display = 'none'; }

    addExpenseBtn.addEventListener('click', openModal);
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

    // Закрытие кастомных select при клике вне
    document.addEventListener('click', (e) => {
        if (!authorSelect.contains(e.target)) authorItems.classList.add('select-hide');
        if (!multiSelect.contains(e.target)) multiItems.classList.add('select-hide');
    });

    // --- Сохранение расхода ---
    saveExpenseBtn.addEventListener('click', () => {
        const desc = descInput.value.trim();
        const author = selectedAuthor.dataset.value;
        const participants = Array.from(multiItems.querySelectorAll('input:checked')).map(cb => cb.value);
        const amount = parseFloat(amountInput.value);

        if (!desc || !author || participants.length === 0 || isNaN(amount) || amount <= 0) return;

        // Добавляем расход
        const expense = { desc, author, participants, amount };
        expenses.push(expense);

        updateExpensesTable();
        updateDebts();
        expenseForm.reset();
        selectedAuthor.textContent = 'Выберите автора';
        selectedAuthor.dataset.value = '';
        multiSelected.textContent = 'Выберите участников';
        multiItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        closeModal();
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

            row.innerHTML = `
                <td>${e.desc}</td>
                <td>${e.author}</td>
                <td>${e.participants.join(', ')}</td>
                <td>${perPerson} ₽</td>
                <td>${e.amount} ₽</td>
                <td><button class="popup-cancel" data-index="${index}">Удалить</button></td>
            `;
            expensesTbody.appendChild(row);
        });

        totalAmountEl.textContent = totalAmount.toFixed(2) + ' ₽';
        totalPerPersonEl.textContent = totalPerPerson.toFixed(2) + ' ₽';

        // Удаление
        expensesTbody.querySelectorAll('button[data-index]').forEach(btn => {
            btn.addEventListener('click', () => {
                expenses.splice(btn.dataset.index, 1);
                updateExpensesTable();
                updateDebts();
            });
        });
    }

    function updateDebts() {
        debtsTbody.innerHTML = '';
        debts = {};

        expenses.forEach(e => {
            const share = e.amount / e.participants.length;
            e.participants.forEach(p => {
                if (!debts[p]) debts[p] = 0;
                debts[p] += share;
            });
        });

        for (let participant in debts) {
            const row = document.createElement('tr');
            row.innerHTML = `<td>${participant}</td><td>${debts[participant].toFixed(2)} ₽</td>`;
            debtsTbody.appendChild(row);
        }
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
