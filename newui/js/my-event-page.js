import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Открытие модального окна
    const popupCreateEvent = document.getElementById("createPopup");
    const createBtn = document.getElementById("createBtn");
    const closeBtn = document.getElementById("closeBtn");
    const cancelBtn = document.getElementById("cancelBtn");
    const approveBtn = document.getElementById("approveBtn");
    const authText = document.getElementById("authText");
    // Модальное окно
    const eventForm = document.getElementById("eventForm");
    const eventNameInput = document.getElementById("eventName");
    const eventDateInput = document.getElementById("eventDate");
    const eventExitDateInput = document.getElementById("eventExitDate");
    const eventPlaceInput = document.getElementById("eventPlace");
    const eventDescriptionInput = document.getElementById("eventDescription");
    // данные пользователя
    const userData = JSON.parse(localStorage.getItem("userData"));

    const allMyEventsContainer = document.querySelector('.all-my-events');

    authText.innerHTML = `<b>${userData.username}</b>`;

    // Инициализация localStorage ключей
    function initLocalStorage() {
        if (!localStorage.getItem('smart_event_counter')) {
            localStorage.setItem('smart_event_counter', '0');
        }
        if (!localStorage.getItem('smart_all_events')) {
            localStorage.setItem('smart_all_events', '[]');
        }
    }

    initLocalStorage();

    // Функция для добавления мероприятия в DOM
    function addEventToDOM(eventData) {
        const eventCard = document.createElement('div');
        eventCard.className = 'event-card';

        // Добавляем id для возможности удаления/обновления
        eventCard.dataset.eventId = eventData.id;

        eventCard.innerHTML = `
            <div class="event-label">Мероприятие</div>
            <div class="event-name">${eventData.name}</div>
        `;

        // Добавляем обработчик клика для перехода на страницу мероприятия
        eventCard.addEventListener('click', function() {
            // localStorage.setItem('currentEventId', eventData.id);
            // localStorage.setItem('eventData', JSON.stringify(eventData));
            // window.location.href = `event-info.html?eventId=${eventData.id}`;
        });

        // Добавляем карточку в контейнер
        allMyEventsContainer.appendChild(eventCard);
    }

// Функция для загрузки мероприятий пользователя
    async function loadUserEvents() {
        try {
            console.log('Загрузка мероприятий...');

            // 1. Сначала пробуем загрузить с сервера
            if (userData && userData.id) {
                try {
                    // Здесь нужно реализовать метод getUserEvents в API
                    // const serverEvents = await SmartAPI.getUserEvents(userData.id);
                    // if (serverEvents && serverEvents.length > 0) {
                    //     serverEvents.forEach(event => {
                    //         addEventToDOM(event);
                    //     });
                    // }
                } catch (serverError) {
                    console.warn('Не удалось загрузить мероприятия с сервера:', serverError);
                }
            }

            // 2. Загружаем из localStorage (fallback и локальные мероприятия)
            loadEventsFromLocalStorage();

            // 3. Если есть локальные мероприятия, показываем уведомление
            const localEvents = document.querySelectorAll('.event-local-badge');
            if (localEvents.length > 0) {
                console.log(`Загружено ${localEvents.length} локальных мероприятий`);
            }

        } catch (error) {
            console.error('Ошибка при загрузке мероприятий:', error);
        }
    }

    // Функция для загрузки мероприятий из localStorage
    function loadEventsFromLocalStorage() {
        try {
            // Загружаем все мероприятия из localStorage
            const allEvents = JSON.parse(localStorage.getItem("smart_all_events"));

            console.log('Мероприятия из localStorage:', allEvents);

            if (allEvents.length > 0) {
                // Сортируем по дате создания (новые сверху)
                const sortedEvents = allEvents.sort((a, b) => {
                    return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                });

                // Очищаем контейнер перед добавлением
                allMyEventsContainer.innerHTML = '';

                // Добавляем каждое мероприятие в DOM
                sortedEvents.forEach(event => {
                    addEventToDOM(event);
                });

                console.log(`Загружено ${sortedEvents.length} мероприятий из localStorage`);
            } else {
                console.log('Нет сохраненных мероприятий в localStorage');
            }

        } catch (error) {
            console.error('Ошибка при загрузке мероприятий из localStorage:', error);
        }
    }

    // Функция создания мероприятия (обновленная)
    async function createEvent() {
        const eventData = {
            name: eventNameInput.value,
            date: eventDateInput.value,
            exitDate: eventExitDateInput.value,
            place: eventPlaceInput.value,
            description: eventDescriptionInput.value,
            tg_chat: null,
            // creator_id: userData.id
        };

        try {
            // 1. Создаем мероприятие
            const eventResult = await SmartAPI.createEvent(eventData);
            console.log('Мероприятие создано:', eventResult);

            // 2. Добавляем создателя как участника
            /*
            try {
                await SmartAPI.addParticipant(eventResult.id, userData.id);
                console.log('Создатель добавлен как участник');
            } catch (participantError) {
                console.warn('Не удалось добавить создателя как участника:', participantError);
            }
             */

            // 3. Сохраняем в localStorage
            localStorage.setItem('eventData', JSON.stringify(eventResult));

            // 4. Добавляем мероприятие в DOM
            addEventToDOM(eventResult);

            // 5. Закрываем попап и сбрасываем форму
            closePopup();
            resetInfo();

            if (eventResult.isLocal) {
                console.log('Мероприятие сохранено локально. Будет синхронизировано при восстановлении связи.', 'warning');
            } else {
                console.log('Мероприятие успешно создано!', 'success');
            }

        } catch (error) {
            console.error('Ошибка при создании мероприятия:', error);
        }
    }

    //Работа с кнопками открытия и закрытия модального окна
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
    // Загружаем мероприятия при загрузке страницы
    loadUserEvents();

});