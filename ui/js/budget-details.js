import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ BUDGET-DETAILS ===');

    const backBtn = document.getElementById('back-btn');
    const addExpenseBtn = document.getElementById('add-expense-btn');
    const expenseModal = document.getElementById('expense-modal');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const saveExpenseBtn = document.getElementById('save-expense-btn');
    const expensesTbody = document.getElementById('expenses-tbody');
    const debtsTbody = document.getElementById('debts-tbody');

    // Элементы формы
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseAuthorSelect = document.getElementById('expense-author');
    const expenseParticipantsSelect = document.getElementById('expense-participants');
    const expenseAmountInput = document.getElementById('expense-amount');

    let expenses = [];
    let participants = [];
    let currentEventId = null;

    // Получаем ID мероприятия
    function getEventId() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventIdFromUrl = urlParams.get('eventId');
        const eventIdFromStorage = localStorage.getItem('currentEventId');

        console.log('🔍 Поиск eventId для budget-details:');
        console.log('  - Из URL:', eventIdFromUrl);
        console.log('  - Из localStorage:', eventIdFromStorage);

        return eventIdFromUrl || eventIdFromStorage;
    }

    // Загрузка данных
    async function loadData() {
        currentEventId = getEventId();

        if (!currentEventId) {
            console.error('❌ ID мероприятия не найден');
            showErrorMessage('ID мероприятия не найден');
            loadFromLocalStorage();
            return;
        }

        console.log('🔄 Загрузка данных для мероприятия:', currentEventId);

        try {
            // Загружаем участников
            participants = JSON.parse(localStorage.getItem('participants')) || [];
            console.log('👥 Участники:', participants);

            // Загружаем расходы из API
            console.log('📡 Запрос бюджета из API...');
            const budgetData = await SmartAPI.getFullBudget(currentEventId);
            console.log('💰 Данные бюджета получены:', budgetData);

            expenses = Array.isArray(budgetData) ? budgetData : [];

            // Обновляем интерфейс
            updateParticipantsSelect();
            updateAuthorSelect();
            updateExpensesTable();
            updateDebtsTable();

        } catch (error) {
            console.error('❌ Ошибка загрузки данных:', error);
            showErrorMessage('Ошибка загрузки данных: ' + error.message);
            loadFromLocalStorage();
        }
    }

    // Fallback на localStorage
    function loadFromLocalStorage() {
        console.log('🔄 Загрузка из localStorage...');
        participants = JSON.parse(localStorage.getItem('participants')) || [];
        expenses = JSON.parse(localStorage.getItem('expenses')) || [];

        updateParticipantsSelect();
        updateAuthorSelect();
        updateExpensesTable();
        updateDebtsTable();
    }

    // Обновление выпадающего списка участников для выбора
    function updateParticipantsSelect() {
        expenseParticipantsSelect.innerHTML = '';

        participants.forEach(participant => {
            const option = document.createElement('option');
            let value, text;

            if (typeof participant === 'string') {
                value = participant;
                text = participant;
            } else if (typeof participant === 'object' && participant !== null) {
                value = participant.tg_id || 'unknown';
                text = participant.display_name || participant.full_name || `User ${participant.tg_id || 'Unknown'}`;
            } else {
                value = 'unknown';
                text = 'Неизвестный участник';
            }

            option.value = value;
            option.textContent = text;
            expenseParticipantsSelect.appendChild(option);
        });
    }

    // Обновление выпадающего списка для автора
    function updateAuthorSelect() {
        expenseAuthorSelect.innerHTML = '';

        // Добавляем пустой вариант по умолчанию
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите автора';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        expenseAuthorSelect.appendChild(defaultOption);

        participants.forEach(participant => {
            const option = document.createElement('option');
            let value, text;

            if (typeof participant === 'string') {
                value = participant;
                text = participant;
            } else if (typeof participant === 'object' && participant !== null) {
                value = participant.tg_id || 'unknown';
                text = participant.display_name || participant.full_name || `User ${participant.tg_id || 'Unknown'}`;
            } else {
                value = 'unknown';
                text = 'Неизвестный участник';
            }

            option.value = value;
            option.textContent = text;
            expenseAuthorSelect.appendChild(option);
        });
    }

    // Обновление таблицы расходов
    function updateExpensesTable() {
        expensesTbody.innerHTML = '';
        let totalAmount = 0;
        let totalPerPerson = 0;

        console.log('📊 Обновление таблицы расходов:', expenses);

        expenses.forEach((expense, index) => {
            const participantsCount = expense.participants ? expense.participants.length : 1;
            const perPersonAmount = expense.amount / participantsCount;

            const row = document.createElement('tr');

            // Форматируем список участников
            let participantsList = 'Не указаны';
            if (expense.participants && Array.isArray(expense.participants)) {
                participantsList = expense.participants.map(p =>
                    p.full_name || p.display_name || p.username || 'Неизвестный'
                ).join(', ');
            }

            // Форматируем автора
            let authorName = 'Не указан';
            if (expense.paid_by) {
                authorName = expense.paid_by.full_name || expense.paid_by.display_name || expense.paid_by.username || 'Неизвестный';
            }

            row.innerHTML = `
                <td>${expense.description || 'Без описания'}</td>
                <td>
                    <span class="author-badge">${authorName}</span>
                </td>
                <td>
                    <div class="participants-list" title="${participantsList}">
                        ${participantsList}
                    </div>
                </td>
                <td>${perPersonAmount.toFixed(2)} ₽</td>
                <td>${expense.amount.toFixed(2)} ₽</td>
                <td>
                    <button class="delete-expense-btn" data-index="${index}" data-expense-id="${expense.id}">×</button>
                </td>
            `;

            expensesTbody.appendChild(row);
            totalAmount += expense.amount;
            totalPerPerson += perPersonAmount;
        });

        // Обновляем итоги
        document.getElementById('total-amount').textContent = `${totalAmount.toFixed(2)} ₽`;
        document.getElementById('total-per-person').textContent = `${totalPerPerson.toFixed(2)} ₽`;

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('.delete-expense-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const expenseId = this.getAttribute('data-expense-id');
                deleteExpense(index, expenseId);
            });
        });
    }

    // Обновление таблицы долгов
    function updateDebtsTable() {
        debtsTbody.innerHTML = '';

        // Рассчитываем долги для каждого участника
        const debts = calculateDebts();

        Object.entries(debts).forEach(([participant, debt]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${participant}</td>
                <td class="${debt > 0 ? 'debt-positive' : 'debt-negative'}">${debt.toFixed(2)} ₽</td>
            `;
            debtsTbody.appendChild(row);
        });
    }

    // Расчет долгов участников
    function calculateDebts() {
        const debts = {};

        // Инициализируем долги для всех участников
        participants.forEach(participant => {
            let participantName;
            if (typeof participant === 'string') {
                participantName = participant;
            } else if (typeof participant === 'object' && participant !== null) {
                participantName = participant.display_name || participant.full_name || `User ${participant.tg_id || 'Unknown'}`;
            } else {
                participantName = 'Неизвестный участник';
            }
            debts[participantName] = 0;
        });

        // Распределяем расходы
        expenses.forEach(expense => {
            if (!expense.participants || !Array.isArray(expense.participants)) return;

            const perPersonAmount = expense.amount / expense.participants.length;

            expense.participants.forEach(participant => {
                let participantName;
                if (typeof participant === 'string') {
                    participantName = participant;
                } else if (typeof participant === 'object' && participant !== null) {
                    participantName = participant.full_name || participant.display_name || participant.username || 'Неизвестный';
                } else {
                    participantName = 'Неизвестный участник';
                }

                if (debts[participantName] !== undefined) {
                    debts[participantName] += perPersonAmount;
                }
            });
        });

        return debts;
    }

    // Добавление новой траты через API
    async function addExpense(description, authorTgId, selectedParticipantTgIds, amount) {
        if (!currentEventId) {
            throw new Error('ID мероприятия не найден');
        }

        try {
            // Находим автора среди участников
            const author = participants.find(p => {
                if (typeof p === 'string') return p === authorTgId;
                return p.tg_id === authorTgId;
            });

            if (!author) {
                throw new Error('Автор не найден среди участников');
            }

            // Подготавливаем данные для API
            const budgetData = {
                event_id: parseInt(currentEventId.toString().replace('local_', '')),
                paid_by_id: 1, // Временное значение - нужно получить реальный ID пользователя
                amount: parseFloat(amount),
                description: description,
                participants: participants,
            };

            console.log('📤 Отправка данных траты в API:', budgetData);

            const result = await SmartAPI.createBudget(budgetData);
            console.log('✅ Трата создана:', result);

            // Обновляем локальные данные
            await loadData();

            return result;

        } catch (error) {
            console.error('❌ Ошибка при добавлении траты:', error);

            // Fallback в localStorage
            const expense = {
                id: 'local_expense_' + Date.now(),
                description: description,
                author: authorTgId,
                participants: selectedParticipantTgIds,
                amount: parseFloat(amount),
                date: new Date().toISOString()
            };

            expenses.push(expense);
            localStorage.setItem('expenses', JSON.stringify(expenses));

            updateExpensesTable();
            updateDebtsTable();

            throw error;
        }
    }

    // Удаление траты
    async function deleteExpense(index, expenseId) {
        if (!confirm('Вы уверены, что хотите удалить эту трату?')) {
            return;
        }

        try {
            // TODO: Реализовать удаление через API когда будет endpoint
            console.log('Удаление траты:', expenseId);

            // Пока удаляем только локально
            expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));

            updateExpensesTable();
            updateDebtsTable();

        } catch (error) {
            console.error('Ошибка при удалении траты:', error);
            alert('Ошибка при удалении траты: ' + error.message);
        }
    }

    // Показать сообщение об ошибке
    function showErrorMessage(message) {
        let errorContainer = document.getElementById('error-message');
        if (!errorContainer) {
            errorContainer = document.createElement('div');
            errorContainer.id = 'error-message';
            errorContainer.style.cssText = `
                background: #f8d7da;
                color: #721c24;
                padding: 15px;
                margin: 20px 0;
                border: 1px solid #f5c6cb;
                border-radius: 5px;
            `;
            document.querySelector('.container').prepend(errorContainer);
        }
        errorContainer.textContent = message;
    }

    // Обработчики событий
    backBtn.addEventListener('click', function() {
        window.location.href = `../html/event-info.html?eventId=${currentEventId}`;
    });

    addExpenseBtn.addEventListener('click', function() {
        expenseModal.classList.add('active');
        expenseDescriptionInput.focus();
    });

    cancelExpenseBtn.addEventListener('click', function() {
        expenseModal.classList.remove('active');
        resetExpenseForm();
    });

    saveExpenseBtn.addEventListener('click', async function() {
        const description = expenseDescriptionInput.value.trim();
        const authorTgId = expenseAuthorSelect.value;
        const selectedOptions = Array.from(expenseParticipantsSelect.selectedOptions);
        const selectedParticipantTgIds = selectedOptions.map(option => option.value);
        const amount = expenseAmountInput.value;

        // Валидация
        if (!description) {
            alert('Пожалуйста, введите статью траты');
            return;
        }

        if (!authorTgId) {
            alert('Пожалуйста, выберите автора траты');
            return;
        }

        if (selectedParticipantTgIds.length === 0) {
            alert('Пожалуйста, выберите хотя бы одного участника');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert('Пожалуйста, введите корректную сумму');
            return;
        }

        try {
            // Показываем индикатор загрузки
            saveExpenseBtn.disabled = true;
            saveExpenseBtn.textContent = 'Добавление...';

            await addExpense(description, authorTgId, selectedParticipantTgIds, amount);

            expenseModal.classList.remove('active');
            resetExpenseForm();

        } catch (error) {
            console.error('Ошибка:', error);
            alert('Ошибка при добавлении траты: ' + error.message);
        } finally {
            saveExpenseBtn.disabled = false;
            saveExpenseBtn.textContent = 'Добавить';
        }
    });

    // Закрытие модального окна при клике вне его
    expenseModal.addEventListener('click', function(e) {
        if (e.target === expenseModal) {
            expenseModal.classList.remove('active');
            resetExpenseForm();
        }
    });

    // Сброс формы
    function resetExpenseForm() {
        expenseDescriptionInput.value = '';
        expenseAuthorSelect.selectedIndex = 0;
        expenseParticipantsSelect.selectedIndex = -1;
        expenseAmountInput.value = '';
    }

    // Загружаем данные при старте
    console.log('🚀 Запуск загрузки данных budget-details...');
    loadData();
});