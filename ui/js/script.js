import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    const addParticipantBtn = document.getElementById('add-participant-btn');
    const participantModal = document.getElementById('participant-modal');
    const cancelBtn = document.getElementById('cancel-btn');
    const addBtn = document.getElementById('add-btn');
    const participantNameInput = document.getElementById('participant-name');
    const participantsList = document.getElementById('participants-list');
    const createBtn = document.getElementById('create-btn');
    const clearBtn = document.getElementById('clear-btn');
    const userCheckResult = document.getElementById('user-check-result');

    // Элементы формы
    const eventNameInput = document.getElementById('event-name');
    const eventDateInput = document.getElementById('event-date');
    const eventExitDateInput = document.getElementById('event-exit-date');
    const eventPlaceInput = document.getElementById('event-place');
    const eventDescriptionInput = document.getElementById('event-description');

    let participants = [];

    // Добавляем обязательные поля
    eventNameInput.required = true;
    eventDateInput.required = true;

    // Добавляем класс required к родительским элементам
    eventNameInput.closest('.form-group').classList.add('required');
    eventDateInput.closest('.form-group').classList.add('required');

    // Добавляем сообщения об ошибках
    addErrorMessages();

    // Загрузка сохраненных данных при загрузке страницы
    function loadSavedData() {
        const eventData = JSON.parse(localStorage.getItem('eventData')) || {};
        const savedParticipants = JSON.parse(localStorage.getItem('participants')) || [];

        // Заполняем поля формы
        eventNameInput.value = eventData.name || '';
        eventDateInput.value = eventData.date || '';
        eventExitDateInput.value = eventData.exitDate || '';
        eventPlaceInput.value = eventData.place || '';
        eventDescriptionInput.value = eventData.description || '';

        // Восстанавливаем участников
        savedParticipants.forEach(participant => {
            addParticipantToDOM(participant);
        });

        // Сохраняем в переменную participants
        participants = savedParticipants;

        // Проверяем валидность после загрузки
        validateForm();
    }

    // Добавление сообщений об ошибках
    function addErrorMessages() {
        const nameGroup = eventNameInput.closest('.form-group');
        const dateGroup = eventDateInput.closest('.form-group');

        const nameError = document.createElement('div');
        nameError.className = 'error-message';
        nameError.textContent = 'Пожалуйста, введите название мероприятия';
        nameGroup.appendChild(nameError);

        const dateError = document.createElement('div');
        dateError.className = 'error-message';
        dateError.textContent = 'Пожалуйста, выберите дату мероприятия';
        dateGroup.appendChild(dateError);
    }

    // Валидация формы
    function validateForm() {
        const isNameValid = eventNameInput.value.trim() !== '';
        const isDateValid = eventDateInput.value !== '';

        // Показываем/скрываем ошибки
        toggleError(eventNameInput.closest('.form-group'), isNameValid);
        toggleError(eventDateInput.closest('.form-group'), isDateValid);

        // Активируем/деактивируем кнопку Создать
        createBtn.disabled = !(isNameValid && isDateValid);

        return isNameValid && isDateValid;
    }

    // Показать/скрыть ошибку
    function toggleError(formGroup, isValid) {
        if (isValid) {
            formGroup.classList.remove('error');
        } else {
            formGroup.classList.add('error');
        }
    }

    // Сохранение данных при изменении
    function saveEventData() {
        const eventData = {
            name: eventNameInput.value,
            date: eventDateInput.value,
            exitDate: eventExitDateInput.value,
            place: eventPlaceInput.value,
            description: eventDescriptionInput.value
        };
        localStorage.setItem('eventData', JSON.stringify(eventData));

        // Проверяем валидность после сохранения
        validateForm();
    }

    // Сохранение участников
    function saveParticipants() {
        const participantItems = document.querySelectorAll('.participant-item');
        participants = Array.from(participantItems).map(item => {
            const tgId = item.getAttribute('data-tg-id');
            const userId = item.getAttribute('data-user-id');
            const displayName = item.querySelector('.participant-name').textContent;

            // Сохраняем в формате объекта с ID пользователя
            return {
                id: userId ? parseInt(userId) : null,
                tg_id: tgId,
                display_name: displayName
            };
        });
        localStorage.setItem('participants', JSON.stringify(participants));
        console.log('💾 Участники сохранены:', participants);
    }

    // Слушатели изменений полей формы
    eventNameInput.addEventListener('input', function() {
        saveEventData();
        // Скрываем ошибку при вводе
        if (this.value.trim() !== '') {
            toggleError(this.closest('.form-group'), true);
        }
    });

    eventDateInput.addEventListener('change', function() {
        saveEventData();
        // Скрываем ошибку при выборе даты
        if (this.value !== '') {
            toggleError(this.closest('.form-group'), true);
        }
    });

    eventExitDateInput.addEventListener('change', saveEventData);
    eventPlaceInput.addEventListener('input', saveEventData)
    eventDescriptionInput.addEventListener('input', saveEventData);

    // Валидация при потере фокуса
    eventNameInput.addEventListener('blur', function() {
        validateForm();
    });

    eventDateInput.addEventListener('blur', function() {
        validateForm();
    });

    // Открытие модального окна
    addParticipantBtn.addEventListener('click', function() {
        participantModal.classList.add('active');
        participantNameInput.focus();
        userCheckResult.style.display = 'none';
        // Сбрасываем стили при открытии модального окна
        participantNameInput.classList.remove('valid', 'invalid');
    });

    // Закрытие модального окна при нажатии на Отмена
    cancelBtn.addEventListener('click', function() {
        participantModal.classList.remove('active');
        participantNameInput.value = '';
        userCheckResult.style.display = 'none';
        // Сбрасываем стили при закрытии
        participantNameInput.classList.remove('valid', 'invalid');
    });

    let checkTimeout;

    // При фокусе сбрасываем результат проверки
    participantNameInput.addEventListener('focus', function() {
        userCheckResult.style.display = 'none';
        this.classList.remove('valid', 'invalid');
    });

    // Обработчик ввода с debounce
    participantNameInput.addEventListener('input', function() {
        const tgId = this.value.trim();

        // Скрываем предыдущий результат при новом вводе
        userCheckResult.style.display = 'none';

        // Сбрасываем стили при изменении поля
        if (!tgId) {
            this.classList.remove('valid', 'invalid');
        }

        // Очищаем предыдущий таймаут
        clearTimeout(checkTimeout);

        // Если поле пустое - выходим
        if (!tgId) return;

        // Устанавливаем новый таймаут (проверка через 1 секунду после окончания ввода)
        checkTimeout = setTimeout(() => {
            checkUser(tgId);
        }, 1000);
    });

    // Также проверяем при потере фокуса
    participantNameInput.addEventListener('blur', function() {
        const tgId = this.value.trim();
        if (tgId) {
            checkUser(tgId);
        }
    });

    // Функция проверки пользователя
    async function checkUser(tgId) {
        // Сначала сбрасываем классы
        participantNameInput.classList.remove('valid', 'invalid');

        try {
            showUserCheckResult('checking', 'Проверка пользователя...');

            const userExists = await SmartAPI.checkUserByTgId(tgId);

            if (userExists) {
                showUserCheckResult('success', '✅ Пользователь найден');
                participantNameInput.classList.add('valid');
            } else {
                showUserCheckResult('error', '❌ Пользователь с таким Telegram ID не найден');
                participantNameInput.classList.add('invalid');
            }
        } catch (error) {
            showUserCheckResult('error', 'Ошибка при проверке пользователя: ' + error.message);
            participantNameInput.classList.add('invalid');
        }
    }

    // Функция отображения результата проверки пользователя
    function showUserCheckResult(type, message) {
        userCheckResult.style.display = 'block';
        userCheckResult.className = `user-check-result ${type}`;
        userCheckResult.innerHTML = type === 'checking'
            ? `<div class="checking-status"><div class="spinner"></div>${message}</div>`
            : message;
    }

    // Добавление участника
    addBtn.addEventListener('click', async function() {
        const tgId = participantNameInput.value.trim();

        if (!tgId) {
            alert('Пожалуйста, введите Telegram ID участника');
            return;
        }

        try {
            // Показываем загрузку
            addBtn.disabled = true;
            addBtn.textContent = 'Добавление...';

            // 1. Проверяем существование пользователя
            const userExists = await SmartAPI.checkUserByTgId(tgId);

            if (!userExists) {
                alert('Пользователь с таким Telegram ID не найден. Добавление невозможно.');
                addBtn.disabled = false;
                addBtn.textContent = 'Добавить';
                return;
            }

            // 2. Получаем полные данные пользователя по tgId
            console.log('🔍 Получение данных пользователя по tg_id:', tgId);
            const userData = await SmartAPI.getUserByTgId(tgId);

            if (!userData) {
                throw new Error('Не удалось получить данные пользователя');
            }

            console.log('✅ Данные пользователя получены:', userData);

            // 3. Проверяем, не добавлен ли уже этот пользователь
            const existingParticipants = document.querySelectorAll('.participant-item');
            const isAlreadyAdded = Array.from(existingParticipants).some(item =>
                item.getAttribute('data-tg-id') === tgId
            );

            if (isAlreadyAdded) {
                alert('Этот пользователь уже добавлен в список участников');
                addBtn.disabled = false;
                addBtn.textContent = 'Добавить';
                return;
            }

            // 4. Добавляем пользователя с полными данными (включая ID)
            const participantData = {
                id: userData.id,
                tg_id: tgId,
                display_name: userData.full_name || userData.username || `User ${tgId}`,
                full_name: userData.full_name,
                username: userData.username
            };

            addParticipantToDOM(participantData);
            saveParticipants();

            participantNameInput.value = '';
            participantModal.classList.remove('active');
            userCheckResult.style.display = 'none';
            participantNameInput.classList.remove('valid', 'invalid');

            console.log('✅ Пользователь добавлен:', participantData);

        } catch (error) {
            console.error('❌ Ошибка при добавлении участника:', error);
            alert('Ошибка при добавлении участника: ' + error.message);
        } finally {
            addBtn.disabled = false;
            addBtn.textContent = 'Добавить';
        }
    });

    // Закрытие модального окна при клике вне его
    participantModal.addEventListener('click', function(e) {
        if (e.target === participantModal) {
            participantModal.classList.remove('active');
            participantNameInput.value = '';
            userCheckResult.style.display = 'none';
            participantNameInput.classList.remove('valid', 'invalid');
        }
    });

    // Функция добавления участника в DOM
    function addParticipantToDOM(participantData) {
        const participantItem = document.createElement('div');
        participantItem.className = 'participant-item';

        let tgId, displayName, userId;

        if (typeof participantData === 'string') {
            // При новом добавлении - это строка (Telegram ID)
            tgId = participantData;
            displayName = `Пользователь ${tgId}`;
            userId = null;
        } else if (typeof participantData === 'object' && participantData !== null) {
            // При загрузке из localStorage или новом добавлении - это объект
            tgId = participantData.tg_id || 'unknown';
            displayName = participantData.display_name ||
                participantData.full_name ||
                participantData.username ||
                `Пользователь ${tgId}`;
            userId = participantData.id || null;
        } else {
            tgId = 'unknown';
            displayName = 'Неизвестный пользователь';
            userId = null;
        }

        participantItem.setAttribute('data-tg-id', tgId);
        if (userId) {
            participantItem.setAttribute('data-user-id', userId);
        }

        const nameSpan = document.createElement('span');
        nameSpan.className = 'participant-name';
        nameSpan.textContent = displayName;

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = '×';
        deleteBtn.addEventListener('click', function() {
            participantsList.removeChild(participantItem);
            saveParticipants();
        });

        participantItem.appendChild(nameSpan);
        participantItem.appendChild(deleteBtn);
        participantsList.appendChild(participantItem);
    }

    // Обработчики для кнопок Создать и Очистить
    createBtn.addEventListener('click', async function() {
        // Проверяем валидность перед переходом
        if (!validateForm()) {
            alert('Пожалуйста, заполните все обязательные поля');
            return;
        }

        const eventData = {
            name: eventNameInput.value,
            date: eventDateInput.value,
            exitDate: eventExitDateInput.value,
            place: eventPlaceInput.value,
            description: eventDescriptionInput.value,
            tg_chat: null
        };

        // Получаем участников из переменной participants (уже содержат ID)
        console.log('📤 Отправка участников:', participants);

        try {
            // 1. Создаем мероприятие
            const eventResult = await SmartAPI.createEvent(eventData);
            console.log('Мероприятие создано:', eventResult);

            // 2. Сохраняем участников (уже содержат ID пользователей)
            localStorage.setItem('participants', JSON.stringify(participants));
            localStorage.setItem('currentEventId', eventResult.id);
            localStorage.setItem('eventData', JSON.stringify(eventResult));

            // 3. Переходим на страницу информации
            window.location.href = `../html/event-info.html?eventId=${eventResult.id}`;

        } catch (error) {
            console.error('Ошибка при создании мероприятия:', error);
            // Fallback
            const localEventId = 'local_' + Date.now();
            localStorage.setItem('eventData', JSON.stringify({
                ...eventData,
                id: localEventId
            }));
            localStorage.setItem('participants', JSON.stringify(participants));
            localStorage.setItem('currentEventId', localEventId);

            window.location.href = '../html/event-info.html';
        }
    });

    clearBtn.addEventListener('click', function() {
        if (confirm('Вы уверены, что хотите очистить все поля?')) {
            eventNameInput.value = '';
            eventDateInput.value = '';
            eventExitDateInput.value = '';
            eventPlaceInput.value = '';
            eventDescriptionInput.value = '';
            participantsList.innerHTML = '';

            // Очищаем переменную participants
            participants = [];

            // Удаляем сохраненные данные
            localStorage.removeItem('eventData');
            localStorage.removeItem('participants');

            // Сбрасываем валидацию
            validateForm();
        }
    });

    // Загружаем сохраненные данные при загрузке страницы
    loadSavedData();

});