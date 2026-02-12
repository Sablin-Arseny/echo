import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Открытие модального окна
    const popupCreateEvent = document.getElementById("createPopup");
    const createBtn = document.getElementById("createBtn");
    const closeBtn = document.getElementById("closeBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const approveBtn = document.getElementById("approveBtn");
    const authText = document.getElementById("authText");
    const authButton = document.getElementById('authButton');
    // Модальное окно
    const eventForm = document.getElementById("eventForm");
    const eventNameInput = document.getElementById("eventName");
    const eventDateInput = document.getElementById("eventDate");
    const eventExitDateInput = document.getElementById("eventExitDate");
    const eventPlaceInput = document.getElementById("eventPlace");
    const eventDescriptionInput = document.getElementById("eventDescription");

    // Контейнеры для вкладок
    const participatingEventsContainer = document.getElementById('participating-events');
    const invitationEventsContainer = document.getElementById('invitation-events');

    // Кнопки вкладок
    const tabBtns = document.querySelectorAll('.tab-btn');

    getUserInfoByToken();

    async function getUserInfoByToken(){
        const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        authText.innerHTML = `<b>${userData.username}</b>`;
    }

    // ===== ФУНКЦИИ ДЛЯ ВКЛАДОК =====

    // Переключение вкладок
    function initTabs() {
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tabId = this.dataset.tab;

                // Убираем активный класс у всех кнопок
                tabBtns.forEach(b => b.classList.remove('active'));
                // Добавляем активный класс текущей кнопке
                this.classList.add('active');

                // Скрываем все вкладки
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });

                // Показываем нужную вкладку
                document.getElementById(`${tabId}-tab`).classList.add('active');
            });
        });
    }

    // ===== ОБНОВЛЕННАЯ ФУНКЦИЯ ДЛЯ ДОБАВЛЕНИЯ МЕРОПРИЯТИЙ В DOM =====
    function addEventToDOM(eventData, isInvitation = false) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        // Добавляем id для возможности удаления/обновления
        eventCard.dataset.eventId = eventData.id;

        // Разный контент для приглашений и обычных мероприятий
        if (isInvitation) {
            eventCard.innerHTML = `
                <div class="event-label">Приглашение</div>
                <div class="event-name">${eventData.name}</div>
                <div class="event-actions">
                    <button class="btn-accept" data-event-id="${eventData.id}">Принять</button>
                    <button class="btn-decline" data-event-id="${eventData.id}">Отклонить</button>
                </div>
            `;
        } else {
            eventCard.innerHTML = `
                <div class="event-label">Мероприятие</div>
                <div class="event-name">${eventData.name}</div>
            `;
        }

        // Обработчик клика для перехода на страницу мероприятия
        eventCard.addEventListener('click', function() {
            localStorage.setItem('currentEventId', eventData.id);
            localStorage.setItem('eventData', JSON.stringify(eventData));
            window.location.href = `event-config.html?eventId=${eventData.id}`;
        });

        // Добавляем карточку в соответствующий контейнер
        if (isInvitation) {
            invitationEventsContainer.appendChild(eventCard);

            // Добавляем обработчики для кнопок приглашения
            const acceptBtn = eventCard.querySelector('.btn-accept');
            const declineBtn = eventCard.querySelector('.btn-decline');

            if (acceptBtn) {
                acceptBtn.addEventListener('click', async function(e) {
                    e.stopPropagation(); // Останавливаем всплытие, чтобы не сработал клик на карточке
                    const eventId = this.dataset.eventId;
                    await handleInvitationResponse(eventId, 'PARTICIPATING');
                });
            }

            if (declineBtn) {
                declineBtn.addEventListener('click', async function(e) {
                    e.stopPropagation(); // Останавливаем всплытие
                    const eventId = this.dataset.eventId;
                    await handleInvitationResponse(eventId, 'REFUSED');
                });
            }
        } else {
            const emptyState = participatingEventsContainer.querySelector('.empty-state');
            if (emptyState) {
                // Если есть сообщение, заменяем его на карточку
                emptyState.remove();
            }

            participatingEventsContainer.appendChild(eventCard);
        }
    }

    // Функция для обработки ответа на приглашение
    async function handleInvitationResponse(eventId, status) {
        try {
            console.log(`Обработка ответа на приглашение: ${status} для мероприятия ${eventId}`);

            const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
            const data = {
                event_id: eventId,
                id: userData.id,
            }
            // Здесь будет вызов API для обработки приглашения
            await SmartAPI.updateStatusOfMemberToInvited(data, status);

            // Удаляем карточку приглашения из DOM
            const invitationCard = document.querySelector(`[data-event-id="${eventId}"]`);
            if (invitationCard) {
                invitationCard.remove();
            }

            // Если приглашение принято, можно перезагрузить список мероприятий
            if (status === 'PARTICIPATING') {
                // Можно добавить мероприятие во вкладку "Участвую"
                loadUserEvents();
            }

        } catch (error) {
            console.error('Ошибка при обработке приглашения:', error);
        }
    }

    // Функция для загрузки мероприятий пользователя
    async function loadUserEvents() {
        try {
            console.log('Загрузка мероприятий...');
            const userToken = JSON.parse(localStorage.getItem("userToken"));

            // Очищаем контейнеры перед загрузкой
            participatingEventsContainer.innerHTML = '';
            invitationEventsContainer.innerHTML = '';

            if (userToken && userToken.length > 0) {
                try {
                    // Загружаем мероприятия, в которых пользователь участвует
                    const serverEvents = await SmartAPI.getParticipatingGUserEvents(userToken);
                    if (serverEvents && serverEvents.length > 0) {
                        console.log('Найдено мероприятий (участвую):', serverEvents.length);
                        serverEvents.forEach(event => {
                            addEventToDOM(event, false); // false = не приглашение
                        });
                    } else {
                        // Показываем состояние "пусто" во вкладке "Участвую"
                        participatingEventsContainer.innerHTML = `
                            <div class="empty-state">
                                <p>Вы пока не участвуете в мероприятиях</p>
                            </div>
                        `;
                    }

                    // Загружаем приглашения на мероприятия
                    const serverInvitedEvents = await SmartAPI.getInvitedGUserEvents(userToken);
                    if (serverInvitedEvents && serverInvitedEvents.length > 0) {
                        console.log('Найдено приглашений:', serverInvitedEvents.length);
                        serverInvitedEvents.forEach(event => {
                            addEventToDOM(event, true); // true = приглашение
                        });
                    } else {
                        // Показываем состояние "пусто" во вкладке "Приглашение"
                        invitationEventsContainer.innerHTML = `
                            <div class="empty-state">
                                <p>Нет новых приглашений</p>
                            </div>
                        `;
                    }

                } catch (serverError) {
                    console.warn('Не удалось загрузить мероприятия с сервера:', serverError);

                    // Показываем состояния "пусто" при ошибке
                    participatingEventsContainer.innerHTML = `
                        <div class="empty-state">
                            <p>Не удалось загрузить мероприятия</p>
                        </div>
                    `;
                    invitationEventsContainer.innerHTML = `
                        <div class="empty-state">
                            <p>Не удалось загрузить приглашения</p>
                        </div>
                    `;
                }
            }

        } catch (error) {
            console.error('Ошибка при загрузке мероприятий:', error);
        }
    }

    // Функция создания мероприятия
    async function createEvent() {
        const eventData = {
            name: eventNameInput.value,
            date: eventDateInput.value,
            exitDate: eventExitDateInput.value,
            place: eventPlaceInput.value,
            description: eventDescriptionInput.value,
            tg_chat: null,
        };

        try {
            // Создаем мероприятие
            const eventResult = await SmartAPI.createEvent(eventData);
            console.log('Мероприятие создано:', eventResult);

            // Сохраняем в localStorage
            localStorage.setItem('eventData', JSON.stringify(eventResult));

            // Добавляем мероприятие в DOM (во вкладку "Участвую")
            addEventToDOM(eventResult, false);

            // Закрываем попап и сбрасываем форму
            closePopup();
            resetInfo();

            console.log('Мероприятие успешно создано!');

        } catch (error) {
            console.error('Ошибка при создании мероприятия:', error);
        }
    }

    // Работа с кнопками открытия и закрытия модального окна
    function openCreateEventPopup() {
        popupCreateEvent.style.display = "flex";
    }

    function closePopup() {
        popupCreateEvent.style.display = "none";
    }

    function resetInfo() {
        eventForm.reset()
    }

    createBtn.addEventListener("click", function (){
        openCreateEventPopup();
    })

    closeBtn.addEventListener("click", function (){
        closePopup();
    })

    cancelBtn.addEventListener("click", function (){
        resetInfo();
        closePopup();
    })

    approveBtn.addEventListener("click", async function (){
        // Валидация полей
        if (!eventNameInput.value.trim()) {
            eventNameInput.focus();
            return;
        }

        if (!eventDateInput.value) {
            eventDateInput.focus();
            return;
        }

        await createEvent();
    })

    popupCreateEvent.addEventListener("click", function (e){
        if (e.target === popupCreateEvent){
            closePopup();
        }
    });

    document.addEventListener('keydown', function (e){
        if (e.key === "Escape"){
            closePopup()
        }
    })

    // Auth button click handler - navigate to personal account
    if (authButton) {
        authButton.addEventListener('click', () => {
            window.location.href = 'personal-account.html';
        });
    }

    // ===== ИНИЦИАЛИЗАЦИЯ =====

    // Инициализируем вкладки
    initTabs();

    // Загружаем мероприятия при загрузке страницы
    loadUserEvents();
});