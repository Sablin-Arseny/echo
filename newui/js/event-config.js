document.addEventListener('DOMContentLoaded', () => {
    // Sample data
    const eventData = {
        title: '',
        date: '',
        maxdate: '',
        place: '',
        desc: ''
    };

    const participants = ['@ivan', '@katya', '@sergey'];

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

    const modal = document.getElementById('participant-modal');
    const openBtn = document.getElementById('add-participant-btn');
    const closeBtn = document.getElementById('close-participant-modal');

    let editing = false;

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
        evTitle.value = eventData.title || '';
        evDate.value = eventData.date ? formatDateForInput(eventData.date) : '';
        evMax.value = eventData.maxdate ? formatDateForInput(eventData.maxdate) : '';
        evPlace.value = eventData.place || '';
        evDesc.value = eventData.desc || '';
    }

    // Update display fields with current data
    function updateDisplayFields() {
        // Форматируем даты для отображения
        const displayTitle = eventData.title
        const displayDate = eventData.date ? formatDateForDisplay(eventData.date) : '';
        const displayMaxdate = eventData.maxdate ? formatDateForDisplay(eventData.maxdate) : '';
        const displayPlace = eventData.place;
        const displayDesc = eventData.desc;
        
        evTitleDisplay.textContent = displayTitle;
        evDateDisplay.textContent = displayDate;
        evMaxDisplay.textContent = displayMaxdate;
        evPlaceDisplay.textContent = displayPlace;
        evDescDisplay.textContent = displayDesc;
        
        // Update placeholder styling
        updatePlaceholderStyle(evTitleDisplay, eventData.title);
        updatePlaceholderStyle(evDateDisplay, eventData.date);
        updatePlaceholderStyle(evMaxDisplay, eventData.maxdate);
        updatePlaceholderStyle(evPlaceDisplay, eventData.place);
        updatePlaceholderStyle(evDescDisplay, eventData.desc);
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
        eventData.title = newTitle;
        eventData.date = newDate;
        eventData.maxdate = newMaxdate;
        eventData.place = newPlace;
        eventData.desc = newDesc;
        
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

    function renderParticipants() {
        participantsList.innerHTML = '';
        participants.forEach((p, idx) => {
            const el = document.createElement('div');
            el.className = 'participant-item';
            el.innerHTML = `
                <div class="participant-tg">${p}</div>
                <div class="participant-actions">
                    <button class="btn btn-secondary small" data-idx="${idx}">x</button>
                </div>
            `;
            participantsList.appendChild(el);
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

    // Initialize everything
    initEventFields();
    renderParticipants();

    // Modal open
    addBtn.addEventListener('click', () => {
        tgInput.value = '';
        modal.style.display = 'flex';
        tgInput.focus();
    });
    
    closeModalBtn.addEventListener('click', () => modal.style.display = 'none');

    // Confirm add
    confirmAdd.addEventListener('click', () => {
        const val = tgInput.value.trim();
        if (!val.startsWith('@') || val.length < 2) {
            alert('Введите Telegram имя пользователя в формате @username');
            return;
        }
        participants.push(val);
        renderParticipants();
        modal.style.display = 'none';
    });

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
});