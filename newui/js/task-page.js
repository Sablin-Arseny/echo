import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // ===== ДАННЫЕ =====
    const eventId = JSON.parse(localStorage.getItem("currentEventId"));
    let tasks = [];
    let currentUser = null;
    let currentTaskId = null;
    let currentFilter = 'all';
    let draggedTask = null;
    let editingIndex = null;
    let participantsDict = {}; // username -> id

    // Флаг для предотвращения множественных предупреждений
    let isDragging = false;

    // ===== ЭЛЕМЕНТЫ =====
    // Шапка
    const authText = document.getElementById("authText");
    const logo = document.querySelector('.logo');

    // Кнопки
    const createTaskBtn = document.getElementById('createTaskBtn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    // Колонки
    const todoColumn = document.getElementById('todo-column');
    const progressColumn = document.getElementById('progress-column');
    const reviewColumn = document.getElementById('review-column');
    const doneColumn = document.getElementById('done-column');

    // Счетчики
    const todoCount = document.getElementById('todo-count');
    const progressCount = document.getElementById('progress-count');
    const reviewCount = document.getElementById('review-count');
    const doneCount = document.getElementById('done-count');

    // Попап создания/редактирования
    const taskPopup = document.getElementById('taskPopup');
    const closeTaskPopup = document.getElementById('closeTaskPopup');
    const cancelTaskBtn = document.getElementById('cancelTaskBtn');
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    const deleteTaskBtn = document.getElementById('deleteTaskBtn');
    const popupTitle = document.getElementById('popupTitle');
    const taskForm = document.getElementById('taskForm');
    const taskAuthorDisplay = document.getElementById('task-author-display');

    // Поля формы
    const taskTitle = document.getElementById('taskTitle');
    const taskDescription = document.getElementById('taskDescription');

    // Селекты для исполнителя и наблюдателей
    const executorSelected = document.getElementById('task-executor-selected');
    const executorItems = document.getElementById('task-executor-items');
    const executorSelect = document.getElementById('task-executor-select');

    const observersMultiSelect = document.getElementById('task-observers-select');
    const observersSelected = observersMultiSelect.querySelector('.multi-selected');
    const observersItems = observersMultiSelect.querySelector('.multi-items');

    // Попап просмотра
    const viewTaskPopup = document.getElementById('viewTaskPopup');
    const closeViewPopup = document.getElementById('closeViewPopup');
    const editTaskBtn = document.getElementById('editTaskBtn');
    const deleteViewTaskBtn = document.getElementById('deleteViewTaskBtn');

    // Элементы просмотра
    const viewTaskId = document.getElementById('viewTaskId');
    const viewTaskTitle = document.getElementById('viewTaskTitle');
    const viewTaskDescription = document.getElementById('viewTaskDescription');
    const viewTaskAuthor = document.getElementById('viewTaskAuthor');
    const viewTaskExecutor = document.getElementById('viewTaskExecutor');
    const viewTaskObservers = document.getElementById('viewTaskObservers');
    const viewTaskStatus = document.getElementById('viewTaskStatus');

    // ===== ИНИЦИАЛИЗАЦИЯ =====
    init();

    async function init() {
        await getUserInfoByToken();
        await getEventParticipants();
        await loadTasks();
        setupEventListeners();
    }

    // ===== ЗАГРУЗКА ДАННЫХ =====
    async function getUserInfoByToken() {
        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));
            if (userToken) {
                currentUser = await SmartAPI.getUserInfo(userToken);
                authText.innerHTML = `<b>${currentUser.username}</b>`;
                if (taskAuthorDisplay) {
                    taskAuthorDisplay.textContent = currentUser.username;
                }
            }
        } catch (error) {
            console.error('Ошибка при получении пользователя:', error);
            authText.innerHTML = '<b>Войти</b>';
        }
    }

    async function getEventParticipants() {
        try {
            const eventData = await SmartAPI.getEventById(eventId);
            participantsDict = {};
            eventData.participants.forEach(p => {
                if (p.status === "PARTICIPATING") {
                    participantsDict[p.username] = p.id;
                }
            });

            // Загружаем участников в селекты
            const usernames = Object.keys(participantsDict);
            console.log(usernames)
            loadExecutorSelect(usernames);
            loadObserversMultiSelect(usernames);

        } catch (error) {
            console.error('Ошибка загрузки участников:', error);
        }
    }

    function loadExecutorSelect(usernames) {
        executorItems.innerHTML = '';

        // Добавляем пункт "Не назначен"
        const noneDiv = document.createElement('div');
        noneDiv.textContent = 'Не назначен';
        noneDiv.dataset.value = '';
        noneDiv.addEventListener('click', function() {
            executorSelected.textContent = 'Не назначен';
            executorSelected.dataset.value = '';
            executorItems.classList.add('select-hide');
        });
        executorItems.appendChild(noneDiv);

        // Добавляем участников
        usernames.forEach(username => {
            const div = document.createElement('div');
            div.textContent = username;
            div.dataset.value = username;
            div.addEventListener('click', function() {
                executorSelected.textContent = username;
                executorSelected.dataset.value = username;
                executorItems.classList.add('select-hide');
            });
            executorItems.appendChild(div);
        });

        // Открытие/закрытие селекта
        executorSelected.addEventListener('click', function(e) {
            e.stopPropagation();
            executorItems.classList.toggle('select-hide');
        });
    }

    function loadObserversMultiSelect(usernames) {
        observersItems.innerHTML = '';

        usernames.forEach(username => {
            const wrapper = document.createElement('div');
            wrapper.className = 'multi-item';
            wrapper.innerHTML = `
                <label>
                    <input type="checkbox" value="${username}">
                    <span>${username}</span>
                </label>
            `;
            observersItems.appendChild(wrapper);
        });

        observersItems.querySelectorAll('input[type="checkbox"]').forEach(cb => {
            cb.addEventListener('change', updateObserversSelectedText);
        });
    }

    function updateObserversSelectedText() {
        const checked = Array.from(observersItems.querySelectorAll('input:checked')).map(c => c.value);
        observersSelected.textContent = checked.length ? checked.join(', ') : 'Выберите наблюдателей';
    }

    async function loadTasks() {
        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));
            if (!userToken) return;

            const serverTasks = await SmartAPI.getTasksByEventId(eventId, userToken);

            if (serverTasks && serverTasks.length > 0) {
                // Фильтруем задачи, исключая DELETED
                tasks = serverTasks
                    .filter(task => task.status !== 'DELETED')
                    .map(task => ({
                        ...task,
                        status: mapStatusFromServer(task.status)
                    }));
            } else {
                tasks = [];
            }

            renderBoard();

        } catch (error) {
            console.error('Ошибка при загрузке задач:', error);
            tasks = [];
            renderBoard();
        }
    }

    // ===== МАППИНГ СТАТУСОВ =====
    function mapStatusFromServer(serverStatus) {
        const statusMap = {
            'CREATED': 'todo',
            'IN_PROGRESS': 'progress',
            'IN_REVIEW': 'review',
            'DONE': 'done'
        };
        return statusMap[serverStatus] || 'todo';
    }

    function mapStatusToServer(clientStatus) {
        const statusMap = {
            'todo': 'CREATED',
            'progress': 'IN_PROGRESS',
            'review': 'IN_REVIEW',
            'done': 'DONE'
        };
        return statusMap[clientStatus] || 'CREATED';
    }

    // ===== ПРОВЕРКА ПРАВ =====
    function isUserAuthor(task) {
        return task.author?.id === currentUser.id;
    }

    function isUserExecutor(task) {
        return task.executor?.id === currentUser.id;
    }

    function isUserObserver(task) {
        return task.observers?.some(observer => observer.id === currentUser.id);
    }

    function canUserMoveTask(task, targetStatus) {
        if (!currentUser || !task) return false;

        // НЕЛЬЗЯ ДВИГАТЬ ЗАДАЧИ ИЗ СТАТУСА DONE
        if (task.status === 'done') {
            return false;
        }

        const isAuthor = isUserAuthor(task);
        const isExecutor = isUserExecutor(task);

        // Если пользователь одновременно автор и исполнитель - имеет все права автора
        if (isAuthor) {
            return true; // Автор может перемещать куда угодно
        }

        // Исполнитель (не автор) может перемещать между todo, progress, review
        if (isExecutor) {
            // Не может переместить в done
            if (targetStatus === 'done') return false;
            return true;
        }

        return false;
    }

    function canUserEditTask(task) {
        if (!currentUser || !task) return false;

        // НЕЛЬЗЯ РЕДАКТИРОВАТЬ ЗАВЕРШЕННЫЕ ЗАДАЧИ
        if (task.status === 'done') {
            return false;
        }

        const isAuthor = isUserAuthor(task);
        const isExecutor = isUserExecutor(task);
        const isObserver = isUserObserver(task);

        return isAuthor || isExecutor || isObserver;
    }

    function canUserDeleteTask(task) {
        if (!currentUser || !task) return false;

        // Только автор может удалять задачу
        return isUserAuthor(task);
    }

    // ===== ОТОБРАЖЕНИЕ ДОСКИ =====
    function renderBoard() {
        todoColumn.innerHTML = '';
        progressColumn.innerHTML = '';
        reviewColumn.innerHTML = '';
        doneColumn.innerHTML = '';

        const filteredTasks = getFilteredTasks();

        const todoTasks = filteredTasks.filter(t => t.status === 'todo');
        const progressTasks = filteredTasks.filter(t => t.status === 'progress');
        const reviewTasks = filteredTasks.filter(t => t.status === 'review');
        const doneTasks = filteredTasks.filter(t => t.status === 'done');

        renderTasks(todoTasks, todoColumn);
        renderTasks(progressTasks, progressColumn);
        renderTasks(reviewTasks, reviewColumn);
        renderTasks(doneTasks, doneColumn);

        showEmptyState(todoColumn, 'Нет задач');
        showEmptyState(progressColumn, 'Нет задач в работе');
        showEmptyState(reviewColumn, 'Нет задач на ревью');
        showEmptyState(doneColumn, 'Нет завершенных задач');

        updateCounts();
        setupDragAndDrop();
    }

    function renderTasks(tasksList, column) {
        tasksList.forEach(task => {
            column.appendChild(createTaskCard(task));
        });
    }

    function createTaskCard(task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.dataset.taskId = task.id;

        // Задачи в DONE нельзя перетаскивать
        if (task.status === 'done') {
            card.setAttribute('draggable', 'false');
            card.classList.add('task-done');
        } else {
            card.setAttribute('draggable', 'true');
        }

        card.addEventListener('dragstart', function(e) {
            // Запрещаем drag для done
            if (task.status === 'done') {
                e.preventDefault();
                return;
            }

            isDragging = true;
            draggedTask = this;
            this.classList.add('dragging');
            e.dataTransfer.setData('text/plain', task.id);
        });

        card.addEventListener('dragend', function() {
            isDragging = false;
            draggedTask = null;
            this.classList.remove('dragging');
            document.querySelectorAll('.column-content').forEach(col => {
                col.classList.remove('drag-over');
            });
        });

        card.addEventListener('click', function(e) {
            if (!isDragging) {
                openViewPopup(task.id);
            }
        });

        const createdDate = task.created_at ? formatDateForDisplay(task.created_at) : '';

        // Иконка замка для завершенных задач
        const lockIcon = task.status === 'done' ?
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-left: 5px;" title="Завершенная задача (нельзя редактировать)"><path d="M4 7V5C4 2.79086 5.79086 1 8 1C10.2091 1 12 2.79086 12 5V7H13C13.5523 7 14 7.44772 14 8V14C14 14.5523 13.5523 15 13 15H3C2.44772 15 2 14.5523 2 14V8C2 7.44772 2.44772 7 3 7H4ZM10 5V7H6V5C6 3.89543 6.89543 3 8 3C9.10457 3 10 3.89543 10 5Z" fill="#FD9C00" fill-opacity="0.6"/></svg>' : '';

        // Индикатор авторства
        const authorIcon = isUserAuthor(task) ?
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="none" style="margin-left: 5px;" title="Вы автор"><path d="M8 0C3.58 0 0 3.58 0 8C0 12.42 3.58 16 8 16C12.42 16 16 12.42 16 8C16 3.58 12.42 0 8 0ZM8 4C9.1 4 10 4.9 10 6C10 7.1 9.1 8 8 8C6.9 8 6 7.1 6 6C6 4.9 6.9 4 8 4ZM8 14C6 14 4.2 12.9 3.3 11.2C4.5 10.5 6.2 10 8 10C9.8 10 11.5 10.5 12.7 11.2C11.8 12.9 10 14 8 14Z" fill="#FD9C00"/></svg>' : '';

        card.innerHTML = `
            <div class="task-card-header">
                <span class="task-id">TASK-${task.id}</span>
            </div>
            <div class="task-title">
                ${escapeHtml(task.title)}
                ${authorIcon}
                ${lockIcon}
            </div>
            ${task.description ? `<div class="task-description-preview">${escapeHtml(task.description.substring(0, 60))}${task.description.length > 60 ? '...' : ''}</div>` : ''}
            <div class="task-footer">
                <span class="task-executor">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                        <circle cx="8" cy="6" r="3" stroke="#FD9C00" stroke-width="1.5"/>
                        <path d="M2 13.5C2 10.4624 4.46243 8 7.5 8H8.5C11.5376 8 14 10.4624 14 13.5" stroke="#FD9C00" stroke-width="1.5"/>
                    </svg>
                    ${task.executor?.username || 'Не назначен'}
                </span>
                <span>${createdDate}</span>
            </div>
        `;

        return card;
    }

    function showEmptyState(column, message) {
        if (column.children.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.innerHTML = `<p>${message}</p>`;
            column.appendChild(emptyState);
        }
    }

    // ===== DRAG AND DROP =====
    function setupDragAndDrop() {
        const columns = [todoColumn, progressColumn, reviewColumn, doneColumn];

        columns.forEach(column => {
            if (!column) return;

            // Удаляем старые обработчики перед добавлением новых
            column.removeEventListener('dragover', handleDragOver);
            column.removeEventListener('dragleave', handleDragLeave);
            column.removeEventListener('drop', handleDrop);

            // Добавляем новые обработчики
            column.addEventListener('dragover', handleDragOver);
            column.addEventListener('dragleave', handleDragLeave);
            column.addEventListener('drop', handleDrop);
        });
    }

    function handleDragOver(e) {
        e.preventDefault();
        this.classList.add('drag-over');
    }

    function handleDragLeave() {
        this.classList.remove('drag-over');
    }

    async function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');

        // Сбрасываем флаг перетаскивания
        if (isDragging) {
            isDragging = false;
        }

        const taskId = e.dataTransfer.getData('text/plain');
        const task = tasks.find(t => t.id == taskId);
        const newStatus = this.closest('.kanban-column').dataset.status;

        if (!task) return;

        // Нельзя двигать задачи из статуса DONE
        if (task.status === 'done') {
            alert('Нельзя перемещать завершенные задачи');
            return;
        }

        // Проверяем права на перемещение
        if (!canUserMoveTask(task, newStatus)) {
            if (isUserExecutor(task) && newStatus === 'done') {
                alert('Исполнитель не может переместить задачу в "Готово". Только автор может завершить задачу.');
            } else {
                alert('У вас нет прав для перемещения задачи в эту колонку.');
            }
            return;
        }

        await updateTaskStatus(taskId, newStatus);
    }

    async function updateTaskStatus(taskId, newStatus) {
        const task = tasks.find(t => t.id == taskId);
        if (!task || task.status === newStatus) return;

        const oldStatus = task.status;
        task.status = newStatus;

        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));
            const serverStatus = mapStatusToServer(newStatus);

            await SmartAPI.updateTaskStatus(taskId, serverStatus, userToken);

            renderBoard();
        } catch (error) {
            console.error('Ошибка при обновлении статуса:', error);
            task.status = oldStatus;
            renderBoard();
            alert('Не удалось обновить статус задачи');
        }
    }

    // ===== ФИЛЬТРАЦИЯ =====
    function getFilteredTasks() {
        if (currentFilter === 'my' && currentUser) {
            return tasks.filter(task =>
                isUserExecutor(task) ||
                isUserObserver(task) ||
                isUserAuthor(task)
            );
        }
        return tasks;
    }

    function setFilter(filter) {
        currentFilter = filter;

        filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        renderBoard();
    }

    // ===== ПОПАПЫ =====
    function openPopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) popup.style.display = 'flex';
    }

    function closePopup(popupId) {
        const popup = document.getElementById(popupId);
        if (popup) popup.style.display = 'none';
    }

    function resetForm() {
        taskForm.reset();
        executorSelected.textContent = 'Выберите исполнителя';
        executorSelected.dataset.value = '';
        observersSelected.textContent = 'Выберите наблюдателей';
        observersItems.querySelectorAll('input').forEach(cb => cb.checked = false);
        deleteTaskBtn.style.display = 'none';
        taskAuthorDisplay.textContent = currentUser?.username || '';
    }

    function openCreatePopup() {
        popupTitle.textContent = 'Создание задачи';
        resetForm();
        editingIndex = null;
        currentTaskId = null;
        openPopup('taskPopup');
    }

    function openEditPopup(taskId) {
        const task = tasks.find(t => t.id == taskId);
        if (!task) return;

        // Проверяем, можно ли редактировать задачу
        if (!canUserEditTask(task)) {
            if (task.status === 'done') {
                alert('Нельзя редактировать завершенные задачи');
            } else {
                alert('Вы не можете редактировать эту задачу. Только автор, исполнитель или наблюдатель могут редактировать задачу.');
            }
            return;
        }

        popupTitle.textContent = 'Редактирование задачи';
        resetForm();

        currentTaskId = taskId;
        editingIndex = tasks.findIndex(t => t.id == taskId);

        taskTitle.value = task.title || '';
        taskDescription.value = task.description || '';
        taskAuthorDisplay.textContent = task.author?.username || currentUser?.username;

        // Устанавливаем исполнителя
        if (task.executor?.username) {
            executorSelected.textContent = task.executor.username;
            executorSelected.dataset.value = task.executor.username;
        }

        // Устанавливаем наблюдателей
        if (task.observers && task.observers.length > 0) {
            const observerUsernames = task.observers.map(o => o.username);
            observersItems.querySelectorAll('input').forEach(cb => {
                cb.checked = observerUsernames.includes(cb.value);
            });
            updateObserversSelectedText();
        }

        deleteTaskBtn.style.display = 'block';
        openPopup('taskPopup');
    }

    async function openViewPopup(taskId) {
        const task = tasks.find(t => t.id == taskId);
        if (!task) return;

        currentTaskId = taskId;

        viewTaskId.textContent = `TASK-${task.id}`;
        viewTaskTitle.textContent = task.title;
        viewTaskDescription.textContent = task.description || 'Нет описания';
        viewTaskStatus.textContent = getStatusText(task.status);

        viewTaskAuthor.textContent = task.author?.username || 'Не назначен';
        viewTaskExecutor.textContent = task.executor?.username || 'Не назначен';

        if (task.observers && task.observers.length > 0) {
            viewTaskObservers.textContent = task.observers.map(o => o.username).join(', ');
        } else {
            viewTaskObservers.textContent = '-';
        }

        // Проверяем права для отображения кнопок
        const userCanEdit = canUserEditTask(task);
        const userCanDelete = canUserDeleteTask(task);

        // В DONE задачи нельзя редактировать, только удалять
        if (editTaskBtn) {
            editTaskBtn.style.display = userCanEdit ? 'block' : 'none';
        }

        if (deleteViewTaskBtn) {
            deleteViewTaskBtn.style.display = userCanDelete ? 'block' : 'none';
        }

        openPopup('viewTaskPopup');
    }

    // ===== CRUD ОПЕРАЦИИ =====
    async function saveTask() {
        const title = taskTitle.value.trim();
        if (!title) {
            taskTitle.focus();
            return;
        }

        const isEdit = popupTitle.textContent === 'Редактирование задачи';

        // Получаем исполнителя
        let executorId = null;
        const executorUsername = executorSelected.dataset.value;
        if (executorUsername) {
            executorId = participantsDict[executorUsername];
        }

        // Получаем наблюдателей
        const observerUsernames = Array.from(observersItems.querySelectorAll('input:checked')).map(cb => cb.value);

        // Автоматически добавляем автора в наблюдатели, если его нет
        if (currentUser?.username && !observerUsernames.includes(currentUser.username)) {
            observerUsernames.push(currentUser.username);
        }

        const observerIds = observerUsernames.map(u => participantsDict[u]).filter(id => id);

        const taskData = {
            event_id: eventId,
            title: title,
            description: taskDescription.value.trim(),
            executor_id: executorId,
            observer_ids: observerIds
        };

        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));

            if (isEdit) {
                // Получаем текущую задачу для получения task_id и статуса
                const currentTask = tasks.find(t => t.id == currentTaskId);

                // Формируем данные для обновления задачи с правильным статусом
                const updateData = {
                    task_id: currentTaskId,
                    title: taskData.title,
                    description: taskData.description,
                    executor_id: taskData.executor_id,
                    observer_ids: taskData.observer_ids,
                    status: currentTask.serverStatus || mapStatusToServer(currentTask.status) // Используем серверный статус
                };

                console.log('Отправка данных на обновление:', updateData);
                await SmartAPI.updateTask(updateData, userToken);

                // Обновляем в локальном массиве
                const taskIndex = tasks.findIndex(t => t.id == currentTaskId);
                if (taskIndex !== -1) {
                    tasks[taskIndex] = {
                        ...tasks[taskIndex],
                        title: taskData.title,
                        description: taskData.description,
                        executor_id: executorId,
                        executor: executorId ? { id: executorId, username: executorUsername } : null,
                        observers: observerIds.map((id, index) => ({
                            id,
                            username: observerUsernames[index]
                        })),
                        serverStatus: currentTask.serverStatus || mapStatusToServer(currentTask.status) // Сохраняем серверный статус
                    };
                }
            } else {
                const newTask = await SmartAPI.createTask(taskData, userToken);
                tasks.push({
                    ...newTask,
                    status: mapStatusFromServer(newTask.status),
                    serverStatus: newTask.status // Сохраняем оригинальный статус с сервера
                });
            }

            closePopup('taskPopup');
            renderBoard();

        } catch (error) {
            console.error('Ошибка при сохранении задачи:', error);
            alert('Не удалось сохранить задачу');
        }
    }

    async function deleteTask() {
        if (!currentTaskId) return;

        const task = tasks.find(t => t.id == currentTaskId);

        if (!canUserDeleteTask(task)) {
            alert('Вы не можете удалить эту задачу. Только автор может удалять задачу.');
            return;
        }

        if (!confirm('Вы уверены, что хотите удалить эту задачу?')) return;

        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));

            // Меняем статус задачи на DELETED через updateTaskStatus
            await SmartAPI.updateTaskStatus(currentTaskId, 'DELETED', userToken);

            // Удаляем задачу из локального массива (она больше не будет отображаться)
            tasks = tasks.filter(t => t.id != currentTaskId);

            closePopup('taskPopup');
            closePopup('viewTaskPopup');
            renderBoard();

        } catch (error) {
            console.error('Ошибка при удалении задачи:', error);
            alert('Не удалось удалить задачу');
        }
    }

    // ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====

    function getStatusText(status) {
        const map = {
            todo: 'Нужно сделать',
            progress: 'В процессе',
            review: 'Ревью',
            done: 'Готово',
            CREATED: 'Нужно сделать',
            IN_PROGRESS: 'В процессе',
            IN_REVIEW: 'Ревью',
            DONE: 'Готово'
        };
        return map[status] || status;
    }

    function formatDateForDisplay(dateString) {
        if (!dateString) return '';

        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return dateString;

            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();

            return `${day}.${month}.${year}`;
        } catch (error) {
            return dateString;
        }
    }

    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function updateCounts() {
        todoCount.textContent = tasks.filter(t => t.status === 'todo').length;
        progressCount.textContent = tasks.filter(t => t.status === 'progress').length;
        reviewCount.textContent = tasks.filter(t => t.status === 'review').length;
        doneCount.textContent = tasks.filter(t => t.status === 'done').length;
    }

    // ===== ОБРАБОТЧИКИ СОБЫТИЙ =====
    function setupEventListeners() {
        // Кнопка создания задачи
        createTaskBtn.addEventListener('click', openCreatePopup);

        // Фильтры
        filterBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                setFilter(this.dataset.filter);
            });
        });

        // Закрытие попапа создания
        closeTaskPopup.addEventListener('click', () => closePopup('taskPopup'));
        cancelTaskBtn.addEventListener('click', () => {
            resetForm();
            closePopup('taskPopup');
        });

        // Сохранение задачи
        saveTaskBtn.addEventListener('click', saveTask);

        // Удаление задачи из попапа редактирования
        deleteTaskBtn.addEventListener('click', deleteTask);

        // Закрытие попапа просмотра
        closeViewPopup.addEventListener('click', () => closePopup('viewTaskPopup'));

        // Редактирование задачи из просмотра
        editTaskBtn.addEventListener('click', function() {
            closePopup('viewTaskPopup');
            openEditPopup(currentTaskId);
        });

        // Удаление задачи из просмотра
        deleteViewTaskBtn.addEventListener('click', async function() {
            await deleteTask();
            closePopup('viewTaskPopup');
        });

        // Логотип
        if (logo) {
            logo.addEventListener('click', () => {
                window.location.href = 'my-event-page.html';
            });
        }

        // Закрытие попапов по Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closePopup('taskPopup');
                closePopup('viewTaskPopup');
            }
        });

        // Закрытие попапов по клику на оверлей
        if (taskPopup) {
            taskPopup.addEventListener('click', function(e) {
                if (e.target === taskPopup) {
                    resetForm();
                    closePopup('taskPopup');
                }
            });
        }

        if (viewTaskPopup) {
            viewTaskPopup.addEventListener('click', function(e) {
                if (e.target === viewTaskPopup) closePopup('viewTaskPopup');
            });
        }

        // Сохранение по Enter (не в textarea)
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.target.matches('textarea') && taskPopup?.style.display === 'flex') {
                e.preventDefault();
                saveTask();
            }
        });

        // Закрытие селектов при клике вне
        document.addEventListener('click', function(e) {
            if (!executorSelect.contains(e.target)) {
                executorItems.classList.add('select-hide');
            }
            if (!observersMultiSelect.contains(e.target)) {
                observersItems.classList.add('select-hide');
            }
        });

        // Открытие мультиселекта наблюдателей
        observersSelected.addEventListener('click', function(e) {
            e.stopPropagation();
            observersItems.classList.toggle('select-hide');
        });
    }
});