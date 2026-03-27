import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- Получаем eventId из query-параметра ---
    const params = new URLSearchParams(window.location.search);
    const eventId = params.get('eventId');
    if (!eventId) {
        alert("Ошибка: не указан eventId");
        return;
    }

    localStorage.setItem('inviteEventId', eventId);

    // --- Элементы страницы ---
    const eventInfoDiv = document.getElementById('event-info');
    const authSection = document.getElementById('auth-section');
    const choiceSection = document.getElementById('choice-section');
    const joinBtn = document.getElementById('join-btn');
    const declineBtn = document.getElementById('decline-btn');

    const authPopup = document.getElementById('authPopup');
    const loginForm = document.getElementById('loginForm');
    const registrationForm = document.getElementById('registerForm');
    const authForm = document.getElementById('authForm');
    const regForm = document.getElementById('registrationForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const closePopup = document.getElementById('closePopup');
    const closeRegisterForm = document.getElementById('closeRegisterForm');
    const showRegisterFormBtn = document.getElementById('showRegisterForm');
    const showLoginFormBtn = document.getElementById('showLoginForm');

    // --- Функции ---
    function showChoiceSection() {
        authSection.style.display = 'none';
        choiceSection.style.display = 'block';
    }

    function showAuthSection() {
        authSection.style.display = 'block';
        choiceSection.style.display = 'none';
    }

    function openPopup(formType = 'login') {
        authPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        if (formType === 'login') {
            loginForm.style.display = 'block';
            registrationForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registrationForm.style.display = 'block';
        }
        clearLoginError();
        clearRegisterError();
    }

    function closePopupFunc() {
        authPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        authForm.reset();
        regForm.reset();
        clearLoginError();
        clearRegisterError();
    }

    function clearLoginError() {
        loginError.textContent = '';
        loginError.classList.remove('show');
    }

    function showLoginError(msg) {
        loginError.textContent = msg;
        loginError.classList.add('show');
    }

    function clearRegisterError() {
        registerError.textContent = '';
        registerError.classList.remove('show');
    }

    function showRegisterError(msg) {
        registerError.textContent = msg;
        registerError.classList.add('show');
    }

    // --- Закрытие popup ---
    closePopup.addEventListener('click', closePopupFunc);
    closeRegisterForm.addEventListener('click', closePopupFunc);
    authPopup.addEventListener('click', e => { if (e.target === authPopup) closePopupFunc(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closePopupFunc(); });

    showRegisterFormBtn.addEventListener('click', e => { e.preventDefault(); openPopup('register'); });
    showLoginFormBtn.addEventListener('click', e => { e.preventDefault(); openPopup('login'); });

    // --- Валидация ---
    const MAX_USERNAME_LENGTH = 20;
    const MAX_PASSWORD_LENGTH = 20;
    const MIN_PASSWORD_LENGTH = 4;

    function validateUsername(username) {
        if (!username) return 'Введите логин';
        if (username.length > MAX_USERNAME_LENGTH) return `Логин не должен превышать ${MAX_USERNAME_LENGTH} символов`;
        return null;
    }

    function validatePassword(password) {
        if (!password) return 'Введите пароль';
        if (password.length < MIN_PASSWORD_LENGTH) return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символа`;
        if (password.length > MAX_PASSWORD_LENGTH) return `Пароль не должен превышать ${MAX_PASSWORD_LENGTH} символов`;
        return null;
    }

    // --- Авторизация ---
    authForm.addEventListener('submit', async e => {
        e.preventDefault();
        clearLoginError();

        const username = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value;

        const userError = validateUsername(username);
        if (userError) return showLoginError(userError);
        const passError = validatePassword(password);
        if (passError) return showLoginError(passError);

        try {
            const userResult = await SmartAPI.authorizationUser({ userName: username, password });
            if (!userResult || userResult.length === 0) return showLoginError('Ошибка авторизации');

            localStorage.setItem("userToken", JSON.stringify(userResult));
            closePopupFunc();
            showChoiceSection();
        } catch (err) {
            console.error(err);
            showLoginError('Ошибка авторизации. Проверьте логин и пароль');
        }
    });

    // --- Регистрация ---
    regForm.addEventListener('submit', async e => {
        e.preventDefault();
        clearRegisterError();

        const username = document.getElementById('regUsername').value.trim();
        const tg_id = document.getElementById('regTelegramId').value.trim();
        const full_name = document.getElementById('regFullName').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        if (!username || !tg_id || !full_name || !password || !confirmPassword)
            return showRegisterError('Заполните все поля');

        if (!tg_id.startsWith('@')) return showRegisterError('Telegram ID должен начинаться с @');
        if (password !== confirmPassword) return showRegisterError('Пароли не совпадают');

        const userError = validateUsername(username);
        if (userError) return showRegisterError(userError);
        const passError = validatePassword(password);
        if (passError) return showRegisterError(passError);

        try {
            const existingUser = await SmartAPI.getUserByUserName(username).catch(err => null);
            if (existingUser && existingUser.id) return showRegisterError('Пользователь с таким именем уже существует');

            const existingTg = await SmartAPI.getUserByTgName(tg_id).catch(err => null);
            if (existingTg && existingTg.id) return showRegisterError('Пользователь с таким Telegram ID уже существует');

            const userResult = await SmartAPI.registerUser({ userName: username, tg_id, fullname: full_name, password });
            localStorage.setItem("userToken", JSON.stringify(userResult));
            closePopupFunc();
            showChoiceSection();
        } catch (err) {
            console.error(err);
            showRegisterError('Ошибка регистрации. Попробуйте позже.');
        }
    });

    // --- Загрузка данных мероприятия ---
    let eventData;
    try {
        eventData = await SmartAPI.getEventById(eventId);
    } catch (err) {
        console.error(err);
        eventInfoDiv.innerHTML = `<p>Не удалось загрузить данные мероприятия.</p>`;
        return;
    }

    const eventDate = new Date(eventData.start_date);
    const formattedDate = eventDate.toLocaleDateString('ru-RU');

    eventInfoDiv.innerHTML = `
        <h2>${eventData.name}</h2>
        <p>Дата: ${formattedDate}</p>
        <p>Место: ${eventData.event_place}</p>
        <p>Описание: ${eventData.description}</p>
    `;

    // --- Проверка авторизации при загрузке ---
    const token = JSON.parse(localStorage.getItem("userToken"));
    if (token) {
        showChoiceSection();
    } else {
        showAuthSection();
        authSection.innerHTML = `
            <p>Пожалуйста, войдите или зарегистрируйтесь, чтобы присоединиться к мероприятию.</p>
            <button id="authButton" class="btn btn-primary">Войти</button>
        `;

        document.getElementById('authButton').addEventListener('click', () => openPopup('login'));
    }

    // --- Обработка кнопок ---
    joinBtn.addEventListener('click', async () => {
        try {
            const userData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
            const existingParticipant = eventData.participants.find(p => p.id === userData.id);

            if (!existingParticipant) {
                await SmartAPI.addUserToEventByInviteLink({ event_id: eventId, id: userData.id });
                await SmartAPI.updateStatusOfMemberToInvited({ event_id: eventId, id: userData.id }, "PARTICIPATING");
            } else if (['REFUSED','DELETED'].includes(existingParticipant.status)) {
                await SmartAPI.updateStatusOfMemberToInvited({ event_id: eventId, id: userData.id }, "PARTICIPATING");
            }

            window.location.href = '/my-event-page.html';
        } catch (err) {
            console.error(err);
            alert('Не удалось присоединиться к мероприятию. Попробуйте снова.');
        }
    });

    declineBtn.addEventListener('click', () => window.location.href = '/');

});