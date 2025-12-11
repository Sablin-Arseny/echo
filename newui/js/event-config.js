import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Sample data
    const eventData = JSON.parse(localStorage.getItem("eventData"));

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
    const authText = document.getElementById("authText");
    const registerError = document.getElementById('userAddError');

    const modal = document.getElementById('participant-modal');
    const openBtn = document.getElementById('add-participant-btn');
    const closeBtn = document.getElementById('close-participant-modal');

    let editing = false;

    getUserInfoByToken();
    initEventData()
    initEventFields();

    async function initEventData(){
        const eventData = await SmartAPI.getEventById(JSON.parse(localStorage.getItem("currentEventId")));
        localStorage.setItem('eventData', JSON.stringify(eventData));
        renderParticipants();
    }

    async function getUserInfoByToken(){
        const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        authText.innerHTML = `<b>${userData.username}</b>`;
    }

    openBtn.addEventListener('click', () => {
        modal.classList.add('active'); // показываем модалку
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
        
        // Проверяем, является ли строка валидной датой
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Если не валидная, возвращаем как есть
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}.${month}.${year}`;
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

    async function renderParticipants() {
        const participants = JSON.parse(localStorage.getItem("eventData")).participants;
        participants.forEach((p, idx) => {
            const el = document.createElement('div');
            if (!(idx === 0)) {
                el.className = 'participant-item';
                el.innerHTML = `
                <div class="participant-tg">${p.username}</div>
                <div class="participant-actions">
                    <button class="btn btn-secondary small" data-idx="${idx}">x</button>
                </div>
            `;
                participantsList.appendChild(el);
            }else {
                el.className = 'participant-item';
                el.innerHTML = `
                <div class="participant-tg">${p.username}</div>
                <div class="participant-actions">
                    admin
                </div>
            `;
                participantsList.appendChild(el);
            }
        });

        // Attach delete handlers
        participantsList.querySelectorAll('button[data-idx]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(btn.dataset.idx, 10);
                participants.splice(idx, 1);
                renderParticipants();
            });
        });
    }

    // Modal open
    addBtn.addEventListener('click', () => {
        tgInput.value = '';
        modal.style.display = 'flex';
        tgInput.focus();
    });
    
    closeModalBtn.addEventListener('click',  () => modal.style.display = 'none');

    // Confirm add
    confirmAdd.addEventListener('click', async function ()  {
        clearRegisterError();
        const val = tgInput.value.trim();
        try{
            const isUser = await SmartAPI.checkUserByUserName(val);
            console.log(isUser);
            if (isUser){
                console.log("isUser");
            }
        } catch (error) {
            showRegisterError('Пользователь не найден');
            return;
        }

        // participants.push(val);
        // renderParticipants();
        modal.style.display = 'none';
    });

    // Пока что отключил
    /*
    // Edit button click handler
    editBtn.addEventListener('click', () => {
        if (!editing) {
            // Entering edit mode
            toggleEditMode(true);
        } else {
            // Exiting edit mode - save data
            saveFormData();
            toggleEditMode(false);
        }
    });

     */

    // Click outside modal to close
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Save with Enter key in edit mode
    document.addEventListener('keydown', (e) => {
        if (editing && e.key === 'Enter' && !e.target.matches('textarea')) {
            e.preventDefault();
            editBtn.click();
        }
    });

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