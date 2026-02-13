import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    // Elements
    let userData = null;
    const logo = document.querySelector('.logo');
    const authButton = document.getElementById('authButton');
    const authText = document.getElementById("authText");

    // Account fields elements
    const accUsername = document.getElementById('acc-username');
    const accTgId = document.getElementById('acc-tg-id');
    const accFullName = document.getElementById('acc-full-name');

    const accUsernameDisplay = document.getElementById('acc-username-display');
    const accTgIdDisplay = document.getElementById('acc-tg-id-display');
    const accFullNameDisplay = document.getElementById('acc-full-name-display');

    const editBtn = document.getElementById('edit-btn');
    const accountPanel = document.querySelector('.account-panel');
    const tgIdError = document.getElementById('tg-id-error');

    let editing = false;
    let originalUsername = null; // Store original username before edit

    // Initialize
    async function init() {
        try {
            const userToken = JSON.parse(localStorage.getItem("userToken"));
            if (!userToken) {
                alert('Вы не авторизованы. Пожалуйста, войдите в систему.');
                window.location.href = 'first-page.html';
                return;
            }

            userData = await SmartAPI.getUserInfo(userToken);
            console.log('User data loaded:', userData);

            authText.innerHTML = `<b>${userData.username}</b>`;
            displayUserData();
            initEventFields();

        } catch (error) {
            console.error('Error loading user data:', error);
            alert('Ошибка загрузки данных пользователя');
        }
    }

    // Display user data
    function displayUserData() {
        accUsernameDisplay.textContent = userData.username || '';
        accTgIdDisplay.textContent = userData.tg_id || '';
        accFullNameDisplay.textContent = userData.full_name || '';

        // Update placeholder styling
        updatePlaceholderStyle(accUsernameDisplay, userData.username);
        updatePlaceholderStyle(accTgIdDisplay, userData.tg_id);
        updatePlaceholderStyle(accFullNameDisplay, userData.full_name);
    }

    // Helper function to update placeholder styling
    function updatePlaceholderStyle(displayElement, value) {
        if (!value || value === '') {
            displayElement.classList.add('placeholder');
        } else {
            displayElement.classList.remove('placeholder');
        }
    }

    // Update input fields with current data
    function updateInputFields() {
        accUsername.value = userData.username || '';
        accTgId.value = userData.tg_id || '';
        accFullName.value = userData.full_name || '';
    }

    // Function to toggle edit mode
    function toggleEditMode(isEditing) {
        editing = isEditing;

        const displayFields = [
            accUsernameDisplay,
            accTgIdDisplay,
            accFullNameDisplay
        ];

        if (isEditing) {
            // Entering edit mode
            // Save the original username before entering edit mode
            originalUsername = userData.username;
            
            updateInputFields();

            // Show input fields
            document.querySelectorAll('.edit-field').forEach(inp => {
                inp.classList.add('active');
            });

            // Hide display fields
            displayFields.forEach(field => {
                field.classList.add('hidden');
            });

            // Add editing mode highlight to panel
            if (accountPanel) {
                accountPanel.classList.add('editing-mode');
            }

            // Update button text
            editBtn.textContent = "Сохранить";

            // Focus first field
            setTimeout(() => {
                const firstField = document.querySelector('.edit-field.active');
                if (firstField) firstField.focus();
            }, 10);

        } else {
            // Exiting edit mode
            // Hide input fields
            document.querySelectorAll('.edit-field').forEach(inp => {
                inp.classList.remove('active');
            });

            // Show display fields
            displayFields.forEach(field => {
                field.classList.remove('hidden');
            });

            // Clear error messages
            tgIdError.textContent = '';
            tgIdError.classList.remove('show');

            // Remove editing mode highlight
            if (accountPanel) {
                accountPanel.classList.remove('editing-mode');
            }

            // Update button text
            editBtn.textContent = "Редактировать";
        }
    }

    // Save data from input fields
    function saveFormData() {
        const tgIdValue = accTgId.value.trim();
        const usernameValue = accUsername.value.trim();

        // Validate Telegram ID
        if (tgIdValue && !tgIdValue.startsWith('@')) {
            showError('Telegram ID должен начинаться с символа @');
            return false;
        }

        // Validate username length (max 20)
        if (usernameValue.length > 20) {
            showError('Никнейм не должен превышать 20 символов');
            return false;
        }

        userData.username = usernameValue;
        userData.tg_id = tgIdValue;
        userData.full_name = accFullName.value.trim();

        // Update display
        displayUserData();
        return true;
    }

    // Show error message
    function showError(message) {
        alert(message);
    }

    // Clear error message
    function clearError() {
        // Error clearing if needed
    }

    // Init fields
    function initEventFields() {
        // Start in non-edit mode
        toggleEditMode(false);
    }

    // Edit button click handler
    editBtn.addEventListener('click', async () => {
        if (!editing) {
            // Entering edit mode
            toggleEditMode(true);
        } else {
            // Exiting edit mode - save data and send to backend
            const saveSuccess = saveFormData();
            if (!saveSuccess) {
                // If validation failed, stay in edit mode
                return;
            }
            await sendUserDataToBackend();
            toggleEditMode(false);
        }
    });

    // Function to send updated user data to backend
    async function sendUserDataToBackend() {
        let usernameChanged = false;
        try {
            const updateData = {
                username: userData.username,
                tg_id: userData.tg_id,
                full_name: userData.full_name
            };
            let userToken = JSON.parse(localStorage.getItem("userToken"));

            console.log('Sending updated user data to backend:', updateData);

            // Если имя пользователя изменилось, проверим уникальность на фронте
            usernameChanged = updateData.username !== originalUsername;
            if (usernameChanged && updateData.username) {
                try {
                    const exists = await SmartAPI.checkUserByUserName(updateData.username);
                    if (exists) {
                        // Если существует пользователь с таким именем, получим его данные
                        const existing = await SmartAPI.getUserByUserName(updateData.username).catch(() => null);
                        if (existing && existing.id !== userData.id) {
                            alert('Никнейм уже занят. Пожалуйста, выберите другой.');
                            // Возвращаемся в режим редактирования
                            toggleEditMode(true);
                            return;
                        }
                    }
                } catch (err) {
                    // Если проверка уникальности упала, позволим сервер обработать это, но предупредим пользователя
                    console.warn('Не удалось проверить уникальность ника на фронте:', err);
                }
            }

            const response = await SmartAPI.updateUserInfo(userToken, updateData);
            console.log('Server response:', response);

            // Check if username was actually changed (compare with saved original)
            console.log('Username changed check:', {
                original: originalUsername,
                current: updateData.username,
                changed: usernameChanged
            });

            // Server returns updated user data
            // Update userData with the response data
            if (response.username) userData.username = response.username;
            if (response.tg_id) userData.tg_id = response.tg_id;
            if (response.full_name) userData.full_name = response.full_name;

            console.log('✓ Local userData synchronized with server:', userData);

            // If username was changed, redirect to login page after brief message
            if (usernameChanged) {
                // Clear token and redirect to login
                localStorage.removeItem('userToken');
                window.location.href = 'first-page.html';
                return;
            }

            // Update the display with the synchronized data
            displayUserData();
            authText.innerHTML = `<b>${userData.username}</b>`;

        } catch (error) {
            console.error('Error saving user data:', error);
            alert('Ошибка при сохранении данных. Попробуйте еще раз.');
            // Return to edit mode on error
            toggleEditMode(true);
        }
    }

    // Logo click handler - navigate to events page
    if (logo) {
        logo.addEventListener('click', () => {
            window.location.href = 'my-event-page.html';
        });
    }

    // Auth button click - stay on current page (already logged in)
    if (authButton) {
        authButton.addEventListener('click', () => {
            // User is already on account page, can logout here if needed
            console.log('Auth button clicked on personal account page');
        });
    }

    // Logout button click handler
    const logoutBtn = document.getElementById('logout-btn');
    const logoutModal = document.getElementById('logout-modal');
    const logoutConfirmBtn = document.getElementById('logout-confirm-btn');
    const logoutCancelBtn = document.getElementById('logout-cancel-btn');

    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Show logout modal
            if (logoutModal) {
                logoutModal.classList.add('active');
            }
        });
    }

    // Logout confirm button
    if (logoutConfirmBtn) {
        logoutConfirmBtn.addEventListener('click', () => {
            // Clear token from localStorage
            localStorage.removeItem('userToken');
            console.log('✓ Token cleared, redirecting to login page');
            // Redirect to login page
            window.location.href = 'first-page.html';
        });
    }

    // Logout cancel button
    if (logoutCancelBtn) {
        logoutCancelBtn.addEventListener('click', () => {
            // Hide logout modal
            if (logoutModal) {
                logoutModal.classList.remove('active');
            }
        });
    }

    // Close modal when clicking on overlay
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });
    }

    // Real-time validation for Telegram ID
    accTgId.addEventListener('input', () => {
        const tgIdValue = accTgId.value.trim();
        
        if (tgIdValue && !tgIdValue.startsWith('@')) {
            tgIdError.textContent = 'Telegram ID должен начинаться с символа @';
            tgIdError.classList.add('show');
        } else {
            tgIdError.textContent = '';
            tgIdError.classList.remove('show');
        }
    });

    // Initialize page
    init();
});
