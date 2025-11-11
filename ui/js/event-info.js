import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    console.log('=== ИНИЦИАЛИЗАЦИЯ EVENT-INFO ===');

    const backBtn = document.getElementById('back-btn');
    const newExpenseBtn = document.getElementById('new-expense-btn');
    const detailedBudgetBtn = document.getElementById('detailed-budget-btn');
    const expenseModal = document.getElementById('expense-modal');
    const cancelExpenseBtn = document.getElementById('cancel-expense-btn');
    const saveExpenseBtn = document.getElementById('save-expense-btn');

    // Элементы для отображения данных
    const eventNameDisplay = document.getElementById('event-name-display');
    const eventDateDisplay = document.getElementById('event-date-display');
    const eventExitDateDisplay = document.getElementById('event-exit-date-display');
    const eventPlaceDisplay = document.getElementById('event-place-display');
    const eventDescriptionDisplay = document.getElementById('event-description-display');
    const participantsCount = document.getElementById('participants-count');
    const budgetAmount = document.getElementById('budget-amount');
    const plannedAmount = document.getElementById('planned-amount');
    const spentAmount = document.getElementById('spent-amount');
    const remainingAmount = document.getElementById('remaining-amount');
    const expensesList = document.getElementById('expenses-list');
    const participantsScrollList = document.getElementById('participants-scroll-list');

    // Элементы формы добавления траты
    const expenseDescriptionInput = document.getElementById('expense-description');
    const expenseAuthorSelect = document.getElementById('expense-author');
    const expenseParticipantsSelect = document.getElementById('expense-participants');
    const expenseAmountInput = document.getElementById('expense-amount');

    let expenses = [];
    let participants = [];

    // Получаем ID мероприятия
    function getEventId() {
        const urlParams = new URLSearchParams(window.location.search);
        const eventIdFromUrl = urlParams.get('eventId');
        const eventIdFromStorage = localStorage.getItem('currentEventId');

        console.log('🔍 Поиск eventId:');
        console.log('  - Из URL:', eventIdFromUrl);
        console.log('  - Из localStorage:', eventIdFromStorage);
        console.log('  - Полный URL:', window.location.href);

        return eventIdFromUrl || eventIdFromStorage;
    }

    // Загрузка данных из API
    async function loadEventData() {
        const eventId = getEventId();

        console.log('🔄 Загрузка данных мероприятия, ID:', eventId);

        if (!eventId) {
            console.error('❌ ID мероприятия не найден ни в URL, ни в localStorage');
            showErrorMessage('ID мероприятия не найден');
            loadFromLocalStorage();
            return;
        }

        try {
            console.log('📡 Запрос к API для мероприятия...');
            const event = await SmartAPI.getEvent(eventId);
            console.log('✅ Данные мероприятия получены:', event);

            if (!event) {
                throw new Error('Мероприятие не найдено');
            }

            // Заполняем данные о мероприятии
            displayEventData(event);

            // Загружаем участников
            participants = JSON.parse(localStorage.getItem('participants') || '[]');
            console.log('👥 Участники:', participants);
            participantsCount.textContent = participants.length;

            // Загружаем бюджет
            try {
                const budgetData = await SmartAPI.getFullBudget(eventId);
                console.log('💰 Данные бюджета:', budgetData);
                expenses = Array.isArray(budgetData) ? budgetData : [];
            } catch (budgetError) {
                console.warn('⚠️ Не удалось загрузить бюджет:', budgetError);
                expenses = [];
            }

            updateBudgetDisplay();
            updateExpensesList();
            updateParticipantsSelect();
            updateParticipantsScrollList();

        } catch (error) {
            console.error('❌ Ошибка загрузки данных из API:', error);
            showErrorMessage('Ошибка загрузки данных: ' + error.message);
            loadFromLocalStorage();
        }
    }

    // Функция отображения данных мероприятия
    function displayEventData(event) {
        console.log('🎯 Отображение данных мероприятия:', event);

        // Проверяем различные возможные поля названия
        const eventName = event.name || event.event_name || 'Не указано';
        console.log('Название мероприятия:', eventName);

        eventNameDisplay.textContent = eventName;

        // Форматируем даты
        const eventDate = event.start_date || event.date;
        const exitDate = event.cancel_of_event_date || event.exitDate;

        eventDateDisplay.textContent = eventDate ? formatDate(eventDate) : 'Не указана';
        eventExitDateDisplay.textContent = exitDate ? formatDate(exitDate) : 'Не указана';

        // Место проведения
        const place = event.venue_event || event.place || event.location || 'Не указано';
        eventPlaceDisplay.textContent = place;

        // Описание
        const description = event.description || 'Описание не добавлено';
        eventDescriptionDisplay.textContent = description;

        console.log('✅ Данные отображены в интерфейсе');
    }

    // Форматирование даты
    function formatDate(dateString) {
        try {
            // Убираем временную часть если есть
            const dateOnly = dateString.split('T')[0];
            const date = new Date(dateOnly + 'T00:00:00'); // Добавляем время чтобы избежать проблем с часовыми поясами

            return date.toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            console.error('Ошибка форматирования даты:', error, dateString);
            return dateString;
        }
    }

    // Показать сообщение об ошибке
    function showErrorMessage(message) {
        // Создаем или находим контейнер для ошибок
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

    // Fallback на localStorage
    function loadFromLocalStorage() {
        console.log('🔄 Загрузка из localStorage...');
        const eventData = JSON.parse(localStorage.getItem('eventData') || '{}');
        participants = JSON.parse(localStorage.getItem('participants') || '[]');
        expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

        console.log('Данные из localStorage:', { eventData, participants, expenses });

        // Заполняем данные из localStorage
        displayEventData(eventData);
        participantsCount.textContent = participants.length;

        updateBudgetDisplay();
        updateExpensesList();
        updateParticipantsSelect();
        updateParticipantsScrollList();
    }

    // Обновление отображения бюджета
    function updateBudgetDisplay() {
        const totalSpent = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
        const planned = 0;

        budgetAmount.textContent = `${totalSpent.toFixed(2)} ₽`;
        spentAmount.textContent = `${totalSpent.toFixed(2)} ₽`;
        plannedAmount.textContent = `${planned.toFixed(2)} ₽`;
        remainingAmount.textContent = `${(planned - totalSpent).toFixed(2)} ₽`;
    }

    // Обновление списка расходов
    function updateExpensesList() {
        expensesList.innerHTML = '';

        if (expenses.length === 0) {
            expensesList.innerHTML = '<div class="no-expenses">Траты еще не добавлены</div>';
            return;
        }

        const recentExpenses = expenses.slice(-5).reverse();

        recentExpenses.forEach(expense => {
            const expenseItem = document.createElement('div');
            expenseItem.className = 'expense-item';

            const description = expense.description || 'Без описания';
            const amount = expense.amount || 0;

            // Обрабатываем участников траты
            let participantsList = 'Не указаны';
            if (expense.participants) {
                if (Array.isArray(expense.participants)) {
                    participantsList = expense.participants.map(p =>
                        p.full_name || p.display_name || p
                    ).join(', ');
                } else {
                    participantsList = expense.participants;
                }
            }

            expenseItem.innerHTML = `
                <div class="expense-info">
                    <div class="expense-description">${description}</div>
                    <div class="expense-details">
                        Участники: ${participantsList}
                    </div>
                </div>
                <div class="expense-amount">${amount} ₽</div>
            `;

            expensesList.appendChild(expenseItem);
        });
    }

    // Обновление выпадающего списка участников
    function updateParticipantsSelect() {
        expenseParticipantsSelect.innerHTML = '';
        expenseAuthorSelect.innerHTML = '';

        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'Выберите автора';
        defaultOption.disabled = true;
        defaultOption.selected = true;
        expenseAuthorSelect.appendChild(defaultOption);

        participants.forEach(participant => {
            let displayName, tgId;

            if (typeof participant === 'string') {
                displayName = participant;
                tgId = participant;
            } else if (typeof participant === 'object' && participant !== null) {
                displayName = participant.display_name || participant.full_name || `User ${participant.tg_id || 'Unknown'}`;
                tgId = participant.tg_id || 'unknown';
            } else {
                displayName = 'Неизвестный участник';
                tgId = 'unknown';
            }

            const option = document.createElement('option');
            option.value = tgId;
            option.textContent = displayName;
            expenseParticipantsSelect.appendChild(option);

            const authorOption = document.createElement('option');
            authorOption.value = tgId;
            authorOption.textContent = displayName;
            expenseAuthorSelect.appendChild(authorOption);
        });
    }

    // Обновление списка участников со скроллбаром
    function updateParticipantsScrollList() {
        participantsScrollList.innerHTML = '';

        if (participants.length === 0) {
            participantsScrollList.innerHTML = '<div class="no-participants">Участники не добавлены</div>';
            return;
        }

        participants.forEach(participant => {
            const participantItem = document.createElement('div');
            participantItem.className = 'participant-list-item';

            let displayName, tgId;

            if (typeof participant === 'string') {
                displayName = participant;
                tgId = participant;
            } else if (typeof participant === 'object' && participant !== null) {
                displayName = participant.display_name || participant.full_name || `User ${participant.tg_id || 'Unknown'}`;
                tgId = participant.tg_id || 'Не указан';
            } else {
                displayName = 'Неизвестный участник';
                tgId = 'Не указан';
            }

            const firstLetter = displayName && displayName.charAt ? displayName.charAt(0).toUpperCase() : '?';

            participantItem.innerHTML = `
                <div class="participant-avatar">${firstLetter}</div>
                <div class="participant-list-name">${displayName}</div>
                <div class="participant-tg-id">ID: ${tgId}</div>
            `;

            participantsScrollList.appendChild(participantItem);
        });
    }

    // Обработчики событий
    backBtn.addEventListener('click', function() {
        window.location.href = '../index.html';
    });

    newExpenseBtn.addEventListener('click', function() {
        expenseModal.classList.add('active');
        expenseDescriptionInput.focus();
    });

    detailedBudgetBtn.addEventListener('click', function() {
        const eventId = getEventId();
        if (eventId) {
            window.location.href = `../html/budget-details.html?eventId=${eventId}`;
        } else {
            alert('ID мероприятия не найден');
        }
    });

    cancelExpenseBtn.addEventListener('click', function() {
        expenseModal.classList.remove('active');
        resetExpenseForm();
    });

    saveExpenseBtn.addEventListener('click', function() {
        const description = expenseDescriptionInput.value.trim();
        const author = expenseAuthorSelect.value;
        const selectedOptions = Array.from(expenseParticipantsSelect.selectedOptions);
        const selectedParticipants = selectedOptions.map(option => option.textContent);
        const amount = expenseAmountInput.value;

        if (!description) {
            alert('Пожалуйста, введите статью траты');
            return;
        }

        if (!author) {
            alert('Пожалуйста, выберите автора траты');
            return;
        }

        if (selectedParticipants.length === 0) {
            alert('Пожалуйста, выберите хотя бы одного участника');
            return;
        }

        if (!amount || parseFloat(amount) <= 0) {
            alert('Пожалуйста, введите корректную сумму');
            return;
        }

        // Здесь должна быть логика добавления траты
        console.log('Добавление траты:', { description, author, selectedParticipants, amount });
        alert('Функция добавления траты будет реализована позже');

        expenseModal.classList.remove('active');
        resetExpenseForm();
    });

    // Закрытие модального окна при клике вне его
    expenseModal.addEventListener('click', function(e) {
        if (e.target === expenseModal) {
            expenseModal.classList.remove('active');
            resetExpenseForm();
        }
    });

    // Сброс формы траты
    function resetExpenseForm() {
        expenseDescriptionInput.value = '';
        expenseAuthorSelect.selectedIndex = 0;
        expenseParticipantsSelect.selectedIndex = -1;
        expenseAmountInput.value = '';
    }

    // Загружаем данные при загрузке страницы
    console.log('🚀 Запуск загрузки данных...');
    loadEventData();
});