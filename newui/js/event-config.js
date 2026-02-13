import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sample data
    let eventData = JSON.parse(localStorage.getItem("eventData"));
    const eventId = JSON.parse(localStorage.getItem("currentEventId"));
    // Elements
    const evTitle = document.getElementById('ev-title');
    const evDate = document.getElementById('ev-date');
    const evMax = document.getElementById('ev-maxdate');
    const evPlace = document.getElementById('ev-place');
    const evDesc = document.getElementById('ev-desc');

    const evTitleDisplay = document.getElementById('ev-title-display');
    const evDateDisplay = document.getElementById('ev-date-display');
    const evMaxDisplay = document.getElementById('ev-maxdate-display');
    const evPlaceDisplay = document.getElementById('ev-place-display');
    const evDescDisplay = document.getElementById('ev-desc-display');

    const participantsList = document.getElementById('participants-list');
    const addBtn = document.getElementById('add-participant-btn');
    const closeModalBtn = document.getElementById('close-participant-modal');
    const confirmAdd = document.getElementById('confirm-add');
    const tgInput = document.getElementById('participant-tg');
    const editBtn = document.getElementById('edit-btn');
    const budgetBtn = document.getElementById('budget-btn');
    const taskBtn = document.getElementById("task-btn");
    const authText = document.getElementById("authText");
    const authButton = document.getElementById('authButton');
    const registerError = document.getElementById('userAddError');
    const logo = document.querySelector('.logo');

    const modal = document.getElementById('participant-modal');
    const openBtn = document.getElementById('add-participant-btn');
    const closeBtn = document.getElementById('close-participant-modal');

    let editing = false;
    let currentUser = null;
    let currentUserRole = null;

    getUserInfoByToken();
    initEventData();
    initEventFields();

    async function initEventData(){
        eventData = await SmartAPI.getEventById(eventId);
        localStorage.setItem('eventData', JSON.stringify(eventData));
        const participants = JSON.parse(localStorage.getItem("eventData")).participants;
        checkUserAccess(participants);
        setCurrentUserRole(participants);

        renderParticipants(participants);
    }

    function setCurrentUserRole(participants) {
        const currentUserId = currentUser.id;
        const me = participants.find(p => p.id === currentUserId);

        if (me) {
            currentUserRole = me.role;
        }
    }

    async function getUserInfoByToken(){
        currentUser = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        authText.innerHTML = `<b>${currentUser.username}</b>`;
    }

    async function checkUserAccess(participants) {
        // Находим текущего пользователя в списке участников
        const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        const userInParticipants = participants.find(p => p.id === userData.id);
        // Проверяем статус пользователя
        if (!userInParticipants || userInParticipants.status !== "PARTICIPATING") {
            // Если пользователь не участник или его статус не PARTICIPATING,
            // отключаем кнопку добавления участников
            addBtn.disabled = true;
            addBtn.style.opacity = "0.5";
            addBtn.style.cursor = "not-allowed";
            addBtn.title = "Только участники могут добавлять других пользователей";

            // Также скрываем или отключаем кнопку редактирования мероприятия
            if (editBtn) {
                editBtn.disabled = true;
                editBtn.style.opacity = "0.5";
                editBtn.style.cursor = "not-allowed";
                editBtn.title = "Только участники могут редактировать мероприятие";
            }
        } else {
            // Если пользователь имеет доступ, включаем кнопки
            addBtn.disabled = false;
            addBtn.style.opacity = "1";
            addBtn.style.cursor = "pointer";
            addBtn.title = "Добавить участника";

            if (editBtn) {
                editBtn.disabled = false;
                editBtn.style.opacity = "1";
                editBtn.style.cursor = "pointer";
                editBtn.title = "Редактировать мероприятие";
            }
        }
    }

    openBtn.addEventListener('click', () => {
        if (!addBtn.disabled) {
            modal.classList.add('active'); // показываем модалку
        }
    });

    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active'); // скрываем модалку
    });

    // Закрытие при клике вне окна
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Function to format date from YYYY-MM-DD to DD.MM.YYYY
    function formatDateForDisplay(dateString) {
        if (!dateString) return '';

        try {
            // Пробуем распарсить как дату
            let date;

            // Если это строка в формате YYYY-MM-DD или ISO с временем
            if (dateString.includes('T') || /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
                // Для избежания проблем с часовыми поясами, парсим дату явно
                const parts = dateString.split('T')[0].split('-');
                if (parts.length === 3) {
                    const [year, month, day] = parts;
                    date = new Date(year, parseInt(month) - 1, parseInt(day));
                } else {
                    date = new Date(dateString);
                }
            } else if (/^(\d{2})\.(\d{2})\.(\d{4})$/.test(dateString)) {
                // Если уже в формате DD.MM.YYYY, просто возвращаем
                return dateString;
            } else {
                // Попытаемся распарсить как обычную дату
                date = new Date(dateString);
            }

            // Проверяем валидность даты
            if (isNaN(date.getTime())) {
                return dateString;
            }

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}.${month}.${year}`;
        } catch (error) {
            console.error('Ошибка форматирования даты:', error, dateString);
            return dateString;
        }
    }

    // Function to format date from DD.MM.YYYY to YYYY-MM-DD (для input[type="date"])
    function formatDateForInput(dateString) {
        if (!dateString) return '';

        // Если уже в формате YYYY-MM-DD, возвращаем как есть
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }

        // Пробуем распарсить формат DD.MM.YYYY
        const parts = dateString.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
        if (parts) {
            const [, day, month, year] = parts;
            return `${year}-${month}-${day}`;
        }

        // Пробуем распарсить как ISO дату с временем (YYYY-MM-DDTHH:mm:ss)
        try {
            const date = new Date(dateString);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch (e) {
            // Если не смогли распарсить, продолжаем
        }

        return dateString; // Если не распарсилось, возвращаем как есть
    }

    // Helper function to update placeholder styling
    function updatePlaceholderStyle(displayElement, value) {
        if (!value || value === '') {
            displayElement.classList.add('placeholder');
        } else {
            displayElement.classList.remove('placeholder');
        }
    }

    // Update input fields with current data from eventData
    function updateInputFields() {
        evTitle.value = eventData.name || '';
        evDate.value = eventData.start_date ? formatDateForInput(eventData.start_date) : '';
        evMax.value = eventData.cancel_of_event_date ? formatDateForInput(eventData.cancel_of_event_date) : '';
        evPlace.value = eventData.event_place || '';
        evDesc.value = eventData.description || '';
    }

    // Update display fields with current data
    function updateDisplayFields() {
        // Форматируем даты для отображения
        const displayTitle = eventData.name
        const displayDate = eventData.start_date ? formatDateForDisplay(eventData.start_date) : '';
        const displayMaxdate = eventData.cancel_of_event_date ? formatDateForDisplay(eventData.cancel_of_event_date) : '';
        const displayPlace = eventData.event_place;
        const displayDesc = eventData.description;

        evTitleDisplay.textContent = displayTitle;
        evDateDisplay.textContent = displayDate;
        evMaxDisplay.textContent = displayMaxdate;
        evPlaceDisplay.textContent = displayPlace;
        evDescDisplay.textContent = displayDesc;

        // Update placeholder styling
        updatePlaceholderStyle(evTitleDisplay, eventData.name);
        updatePlaceholderStyle(evDateDisplay, eventData.start_date);
        updatePlaceholderStyle(evMaxDisplay, eventData.cancel_of_event_date);
        updatePlaceholderStyle(evPlaceDisplay, eventData.event_place);
        updatePlaceholderStyle(evDescDisplay, eventData.description);
    }

    // Function to toggle edit mode
    function toggleEditMode(isEditing) {
        editing = isEditing;

        const displayFields = [
            evTitleDisplay,
            evDateDisplay,
            evMaxDisplay,
            evPlaceDisplay,
            evDescDisplay
        ];

        const settingsPanel = document.querySelector('.settings-panel');

        if (isEditing) {
            // Вход в режим редактирования
            // Обновляем поля ввода текущими данными из eventData
            updateInputFields();

            // Показываем поля ввода
            document.querySelectorAll('.edit-field').forEach(inp => {
                inp.classList.add('active');
            });

            // Скрываем field-display элементы
            displayFields.forEach(field => {
                field.classList.add('hidden');
            });

            // Добавляем класс для визуального выделения панели
            if (settingsPanel) {
                settingsPanel.classList.add('editing-mode');
            }

            // Update button text
            editBtn.textContent = "Сохранить";

            // Focus first field
            setTimeout(() => {
                const firstField = document.querySelector('.edit-field.active');
                if (firstField) firstField.focus();
            }, 10);

        } else {
            // Выход из режима редактирования
            // Скрываем поля ввода
            document.querySelectorAll('.edit-field').forEach(inp => {
                inp.classList.remove('active');
            });

            // Показываем field-display элементы
            displayFields.forEach(field => {
                field.classList.remove('hidden');
            });

            // Удаляем класс визуального выделения панели
            if (settingsPanel) {
                settingsPanel.classList.remove('editing-mode');
            }

            // Update button text
            editBtn.textContent = "Редактировать";
        }
    }

    // Save data from input fields to eventData
    function saveFormData() {
        const newTitle = evTitle.value.trim();
        const newDate = evDate.value; // Уже в формате YYYY-MM-DD
        const newMaxdate = evMax.value; // Уже в формате YYYY-MM-DD
        const newPlace = evPlace.value.trim();
        const newDesc = evDesc.value.trim();

        // Сохраняем значения
        eventData.name = newTitle;
        eventData.start_date = newDate;
        eventData.cancel_of_event_date = newMaxdate;
        eventData.event_place = newPlace;
        eventData.description = newDesc;

        // Обновляем отображение
        updateDisplayFields();
    }

    // Init fields
    function initEventFields() {
        // Set initial values
        updateInputFields();
        updateDisplayFields();

        // Start in non-edit mode
        toggleEditMode(false);
    }

    function renderParticipants(participants) {
        participantsList.innerHTML = '';

        // Фильтруем участников, оставляя только тех, у кого статус не REFUSED
        const activeParticipants = participants.filter(p =>
            p.status !== "REFUSED" && p.status !== "DELETED"
        );

        activeParticipants.forEach((p) => {
            if (p.status === "PARTICIPATING") {

                const isOwner = p.role === "OWNER";
                const isAdmin = p.role === "ADMIN";
                const isMember = p.role === "PARTICIPATING";

                let roleClass = "";
                let roleBadgeClass = "";
                let roleText = p.role;

                if (isOwner) {
                    roleClass = "participant-owner";
                    roleBadgeClass = "role-owner";
                    roleText = "OWNER";
                } else if (isAdmin) {
                    roleClass = "participant-admin";
                    roleBadgeClass = "role-admin";
                    roleText = "ADMIN";
                } else {
                    roleClass = "participant-member";
                    roleBadgeClass = "role-member";
                    roleText = "PARTICIPANT";
                }

                const canManageRoles = currentUserRole === "OWNER";
                const canDelete =
                    currentUserRole === "OWNER" ||
                    (currentUserRole === "ADMIN" && !isOwner);

                const el = document.createElement('div');
                el.className = `participant-item ${roleClass}`;

                el.innerHTML = `
                    <div>
                        ${p.username}
                        <span class="participant-role ${roleBadgeClass}">
                            ${roleText}
                        </span>
                    </div>
            
                    <div class="participant-actions">
            
                        ${
                                canManageRoles && !isOwner && !isAdmin
                                    ? `<button class="make-admin-btn"
                                     data-user-id="${p.id}">
                                     Сделать ADMIN
                                   </button>`
                                    : ''
                            }
            
                        ${
                                canManageRoles && isAdmin
                                    ? `<button class="remove-admin-btn"
                                     data-user-id="${p.id}">
                                     Убрать ADMIN
                                   </button>`
                                    : ''
                            }
            
                        ${
                                canDelete && p.id !== currentUser.id
                                    ? `<button class="btn btn-secondary small delete-btn"
                                     data-user-id="${p.id}"
                                     data-username="${p.username}">
                                     x
                                   </button>`
                                    : ''
                            }
            
                    </div>
                `;

                participantsList.appendChild(el);
            } else {
                // Участники с другими статусами (приглашенные и т.д.)
                const el = document.createElement('div');
                el.className = 'participant-item participant-pending';

                let statusText = '';
                if (p.status === "DRAFT" || p.status === "INVITED") {
                    statusText = 'Приглашен';

                }

                el.innerHTML = `
                    <div class="participant-tg">${p.username}</div>
                    <div class="participant-status">${statusText}</div>
                `;
                participantsList.appendChild(el);
            }
        });

        // Attach delete handlers
        attachDeleteHandlers();
        attachRoleHandlers();
    }

    function attachRoleHandlers() {
        const makeButtons = participantsList.querySelectorAll('.make-admin-btn');
        const removeButtons = participantsList.querySelectorAll('.remove-admin-btn');

        const userToken = JSON.parse(localStorage.getItem("userToken"));

        makeButtons.forEach(btn => {
            btn.addEventListener('click', async function () {

                const userId = parseInt(this.dataset.userId);

                await SmartAPI.updateRoleOfMember(
                    {
                        event_id: eventId,
                        user_id: userId
                    },
                    "ADMIN",
                    userToken
                );

                await initEventData();
            });
        });

        removeButtons.forEach(btn => {
            btn.addEventListener('click', async function () {

                const userId = parseInt(this.dataset.userId);

                await SmartAPI.updateRoleOfMember(
                    {
                        event_id: eventId,
                        user_id: userId
                    },
                    "PARTICIPATING",
                    userToken
                );

                await initEventData();
            });
        });
    }

    // Функция для добавления обработчиков удаления
    function attachDeleteHandlers() {
        const deleteButtons = participantsList.querySelectorAll('.delete-btn');

        deleteButtons.forEach(btn => {
            btn.addEventListener('click', async function(e) {
                e.stopPropagation(); // Останавливаем всплытие события

                const userId = this.dataset.userId;
                const username = this.dataset.username;

                // Подтверждение удаления
                if (confirm(`Вы уверены, что хотите удалить участника ${username}?`)) {
                    try {
                        // Получаем ID пользователя из кнопки
                        const userIdToDelete = parseInt(userId);

                        // Проверяем, что ID валидный
                        if (!userIdToDelete || isNaN(userIdToDelete)) {
                            console.error('Некорректный ID пользователя:', userId);
                            alert('Ошибка: некорректный ID пользователя');
                            return;
                        }

                        console.log('Удаление пользователя:', {
                            eventId: eventId,
                            userId: userIdToDelete,
                            username: username
                        });

                        // Вызываем API для изменения статуса участника на DELETED
                        const result = await SmartAPI.updateStatusOfMemberToInvited({
                            event_id: eventId,
                            id: userIdToDelete
                        }, "DELETED");

                        console.log('Результат удаления:', result);

                        // Обновляем список участников
                        await initEventData();

                        console.log(`Участник ${username} успешно удален`);

                    } catch (error) {
                        console.error('Ошибка при удалении участника:', error);
                        alert('Не удалось удалить участника. Попробуйте еще раз.');
                    }
                }
            });
        });
    }

    // Modal open
    addBtn.addEventListener('click', () => {
        if (addBtn.disabled) return;
        tgInput.value = '';
        modal.style.display = 'flex';
        tgInput.focus();
    });

    closeModalBtn.addEventListener('click',  () => {
        modal.style.display = 'none'
        clearRegisterError()
    });

    // Confirm add
    confirmAdd.addEventListener('click', async function ()  {
        clearRegisterError();
        const val = tgInput.value.trim();
        try{
            const isUser = await SmartAPI.checkUserByUserName(val);
            if (isUser){
                const userData = await SmartAPI.getUserByUserName(val);
                const data = {
                    event_id: eventId,
                    id: userData.id,
                }
                try {
                    const userToken = JSON.parse(localStorage.getItem("userToken"));
                    const inviteResult = await SmartAPI.addUserToEvent(data, userToken);
                    renderParticipants(inviteResult.participants);
                    modal.style.display = 'none';
                }catch (error){
                    const eventInfo = await SmartAPI.getEventById(eventId);
                    eventInfo.participants.forEach(member => {
                        if ((member.status === "REFUSED" || member.status === "DELETED") && member.id === userData.id){
                            const data = {
                                event_id: eventId,
                                id: member.id,
                            }
                            SmartAPI.updateStatusOfMemberToInvited(data, "DRAFT");
                        }
                        initEventData();
                        modal.style.display = 'none';
                    });
                    showRegisterError('Пользователь уже добавлен');
                    return;
                }
            }
        } catch (error) {
            showRegisterError('Пользователь не найден');
            return;
        }

        modal.style.display = 'none';
    });

    // Edit button click handler
    editBtn.addEventListener('click', async () => {
        if (!editing) {
            // Entering edit mode
            toggleEditMode(true);
        } else {
            // Exiting edit mode - save data and send to backend
            saveFormData();
            await sendEventDataToBackend();
            toggleEditMode(false);
        }
    });

    // Function to send updated event data to backend
    async function sendEventDataToBackend() {
        try {
            const updateData = {
                id: eventId,
                name: eventData.name,
                description: eventData.description,
                start_date: eventData.start_date,
                cancel_of_event_date: eventData.cancel_of_event_date,
                event_place: eventData.event_place
            };

            const response = await SmartAPI.updateEvent(updateData);
            localStorage.setItem('eventData', JSON.stringify(eventData));

            // alert('Обновлено на бэке:\n' + JSON.stringify(response, null, 2));

        } catch (error) {
            console.error('Ошибка при сохранении данных:', error);
            alert('Ошибка при сохранении данных. Попробуйте еще раз.');
            // Возвращаемся в режим редактирования при ошибке
            toggleEditMode(true);
        }
    }

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            clearRegisterError()
        }
    });

    // Save with Enter key in edit mode
    document.addEventListener('keydown', (e) => {
        if (editing && e.key === 'Enter' && !e.target.matches('textarea')) {
            e.preventDefault();
            editBtn.click();
        }
    });

    budgetBtn.addEventListener('click', () => {
        const eventData = localStorage.getItem('currentEventId', JSON.stringify(eventId));
        window.location.href = `budget.html?eventId=${eventData}`;
    });

    taskBtn.addEventListener('click', () => {
        const eventData = localStorage.getItem('currentEventId', JSON.stringify(eventId));
        window.location.href = `task-page.html?eventId=${eventData}`;
    });

    // Logo click handler - navigate to events page and refresh
    if (logo) {
        logo.addEventListener('click', () => {
            // Переходим на страницу "Мои мероприятия"
            window.location.href = 'my-event-page.html';
        });
    }

    // Auth button click handler - navigate to personal account
    if (authButton) {
        authButton.addEventListener('click', () => {
            window.location.href = 'personal-account.html';
        });
    }

    function clearRegisterError() {
        if (registerError) {
            registerError.textContent = '';
            registerError.classList.remove('show');
        }
    }

    function showRegisterError(message) {
        if (registerError) {
            registerError.textContent = message;
            registerError.classList.add('show');
        }
    }
});