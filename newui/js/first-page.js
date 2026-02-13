import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Элементы
    const authButton = document.getElementById('authButton');
    const authPopup = document.getElementById('authPopup');
    const closePopup = document.getElementById('closePopup');
    const closeRegisterForm = document.getElementById('closeRegisterForm');
    const authForm = document.getElementById('authForm');
    const registrationForm = document.getElementById('registrationForm');
    const authText = document.getElementById('authText');
    const showRegisterForm = document.getElementById('showRegisterForm');
    const showLoginForm = document.getElementById('showLoginForm');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginError = document.getElementById('loginError');
    const registerError = document.getElementById('registerError');
    const regTelegramId = document.getElementById('regTelegramId');
    const regTgIdError = document.getElementById('regTgIdError');
    const overlay = authPopup;

    // Константы для валидации
    const MAX_USERNAME_LENGTH = 20;
    const MAX_PASSWORD_LENGTH = 20;
    const MIN_PASSWORD_LENGTH = 4;

    initToken();

    async function initToken(){
        try {
            // Получаем токен из localStorage
            const userTokenString = localStorage.getItem("userToken");

            if (userTokenString) {
                // Парсим токен
                const userToken = JSON.parse(userTokenString);
                console.log(userToken);

                // Проверяем, что токен валидный (не пустой объект или строка)
                if (userToken && userToken.length > 0) {
                    // Получаем информацию о пользователе по токену
                    const authUserData = await SmartAPI.getUserInfo(userToken);

                    // Обновляем текст кнопки
                    if (authUserData && authUserData.username) {
                        authText.innerHTML = `<b>${authUserData.username}</b>`;
                        console.log('Пользователь авторизован:', authUserData.username);
                        // Если токен валидный кидаем сразу на страницу с эвентами
                        window.location.href = `my-event-page.html?userId=${authUserData.id}`;

                    } else {
                        // Если не получилось получить данные пользователя, удаляем токен
                        localStorage.removeItem("userToken");
                        authText.innerHTML = '<b>Войти</b>';
                    }
                } else {
                    // Если токен невалидный, удаляем его
                    localStorage.removeItem("userToken");
                    authText.innerHTML = '<b>Войти</b>';
                }
            } else {
                // Токена нет - показываем стандартную кнопку
                authText.innerHTML = '<b>Войти</b>';
            }
        } catch (error) {
            console.error('Ошибка при инициализации токена:', error);
            // При ошибке очищаем localStorage и показываем стандартную кнопку
            localStorage.removeItem("userToken");
            authText.innerHTML = '<b>Войти</b>';
        }
    }

    // Открытие popup
    authButton.addEventListener('click', function() {
        authPopup.style.display = 'flex';
        document.body.style.overflow = 'hidden'; // Блокируем скролл
        clearLoginError();
        clearRegisterError();
    });

    // Закрытие popup по крестику
    closePopup.addEventListener('click', function() {
        closeAuthPopup();
    });

    // Закрытие popup по клику вне окна
    overlay.addEventListener('click', function(event) {
        if (event.target === overlay) {
            closeAuthPopup();
        }
    });

    // Закрытие по клавише Escape
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && authPopup.style.display === 'flex') {
            closeAuthPopup();
        }
    });

    // Функции валидации
    function validateUsername(username) {
        if (!username || username.trim() === '') {
            return 'Введите логин';
        }
        if (username.length > MAX_USERNAME_LENGTH) {
            return `Логин не должен превышать ${MAX_USERNAME_LENGTH} символов`;
        }
        return null;
    }

    function validatePassword(password) {
        if (!password || password.trim() === '') {
            return 'Введите пароль';
        }
        if (password.length > MAX_PASSWORD_LENGTH) {
            return `Пароль не должен превышать ${MAX_PASSWORD_LENGTH} символов`;
        }
        if (password.length < MIN_PASSWORD_LENGTH) {
            return `Пароль должен содержать минимум ${MIN_PASSWORD_LENGTH} символа`;
        }
        return null;
    }

    // Обработка формы входа
    authForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearLoginError();

        const username = document.getElementById('login').value.trim();
        const password = document.getElementById('password').value;

        // Валидация
        const usernameError = validateUsername(username);
        if (usernameError) {
            showLoginError(usernameError);
            return;
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            showLoginError(passwordError);
            return;
        }

        const userData = {
            userName: username,
            password: password,
        };

        try {
            const userResult = await SmartAPI.authorizationUser(userData);
            console.log("Пользователь авторизовался: ", userData, userResult);

            // Проверяем, что токен получен
            if (!userResult || userResult.length === 0) {
                showLoginError('Ошибка авторизации: неверный логин или пароль');
                return;
            }

            localStorage.setItem("userToken", JSON.stringify(userResult));

            // Изменяем текст кнопки на имя пользователя
            authText.innerHTML = `<b>${username}</b>`;
            closeAuthPopup();
            authForm.reset();

            const authUserData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
            window.location.href = `my-event-page.html?userId=${authUserData.id}`;

        } catch (error) {
            console.error('Ошибка авторизации:', error);

            // Обработка различных ошибок от API
            if (error.message && error.message.includes('401')) {
                showLoginError('Неверный логин или пароль');
            } else if (error.message && error.message.includes('404')) {
                showLoginError('Пользователь не найден');
            } else if (error.message && error.message.includes('500')) {
                showLoginError('Ошибка сервера. Попробуйте позже');
            } else {
                showLoginError('Ошибка авторизации. Проверьте логин и пароль');
            }
        }
    });

    // Функция закрытия popup
    function closeAuthPopup() {
        authPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        authForm.reset();
        registrationForm.reset();
        clearLoginError();
        clearRegisterError();
    }

    // Если элементы не найдены, выходим
    if (!showRegisterForm || !registrationForm) return;

    // Переключение на форму регистрации
    showRegisterForm.addEventListener('click', function(e) {
        e.preventDefault();
        showRegisterFormFunc();
    });

    // Переключение на форму входа
    showLoginForm.addEventListener('click', function(e) {
        e.preventDefault();
        showLoginFormFunc();
    });

    // Закрытие формы регистрации
    closeRegisterForm.addEventListener('click', function() {
        closeAuthPopup();
    });

    // Real-time validation for Telegram ID in registration form
    if (regTelegramId) {
        regTelegramId.addEventListener('input', () => {
            const tgIdValue = regTelegramId.value.trim();
            
            if (tgIdValue && !tgIdValue.startsWith('@')) {
                regTgIdError.textContent = 'Telegram ID должен начинаться с символа @';
                regTgIdError.classList.add('show');
            } else {
                regTgIdError.textContent = '';
                regTgIdError.classList.remove('show');
            }
        });
    }

    // Обработка формы регистрации
    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearRegisterError();

        // Получаем значения полей
        const username = document.getElementById('regUsername').value.trim();
        const tg_id = document.getElementById('regTelegramId').value.trim();
        const full_name = document.getElementById('regFullName').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Валидация Telegram ID
        if (tg_id && !tg_id.startsWith('@')) {
            showRegisterError('Telegram ID должен начинаться с символа @');
            return;
        }

        // Валидация
        if (!username || !tg_id || !full_name || !password || !confirmPassword) {
            showRegisterError('Заполните все поля');
            return;
        }

        // Валидация логина
        const usernameError = validateUsername(username);
        if (usernameError) {
            showRegisterError(usernameError);
            return;
        }

        // Валидация пароля
        const passwordError = validatePassword(password);
        if (passwordError) {
            showRegisterError(passwordError);
            return;
        }

        if (password !== confirmPassword) {
            showRegisterError('Пароли не совпадают');
            return;
        }

        // Валидация Telegram ID
        if (!tg_id.startsWith('@')) {
            showRegisterError('Telegram ID должен начинаться с @');
            return;
        }

        if (tg_id.length < 2 || tg_id.length > 32) {
            showRegisterError('Telegram ID должен содержать от 2 до 32 символов');
            return;
        }

        // Валидация полного имени
        if (full_name.length < 2 || full_name.length > 50) {
            showRegisterError('Полное имя должно содержать от 2 до 50 символов');
            return;
        }

        try {
            // Проверяем, существует ли пользователь с таким логином
            try {
                const existingUser = await SmartAPI.getUserByUserName(username);
                if (existingUser && existingUser.id) {
                    showRegisterError('Пользователь с таким именем уже существует');
                    return;
                }
            } catch (error) {
                // Если ошибка 404 - пользователь не найден, продолжаем
                if (!error.message || !error.message.includes('404')) {
                    console.log('Ошибка при проверке пользователя:', error);
                }
            }

            // Проверяем, существует ли пользователь с таким Telegram ID
            try {
                const existingUserTg = await SmartAPI.getUserByTgName(tg_id);
                if (existingUserTg && existingUserTg.id) {
                    showRegisterError('Пользователь с таким Telegram ID уже существует');
                    return;
                }
            } catch (error) {
                // Если ошибка 404 - пользователь не найден, продолжаем
                if (!error.message || !error.message.includes('404')) {
                    console.log('Ошибка при проверке Telegram ID:', error);
                }
            }

            const userData = {
                userName: username,
                tg_id: tg_id,
                fullname: full_name,
                password: password,
            };

            const userResult = await SmartAPI.registerUser(userData);
            console.log("Пользователь создан: ", userData, userResult);

            // Проверяем, что токен получен
            if (!userResult || userResult.length === 0) {
                showRegisterError('Ошибка при регистрации');
                return;
            }

            localStorage.setItem("userToken", JSON.stringify(userResult));

            // Изменяем текст кнопки на имя пользователя
            authText.innerHTML = `<b>${username}</b>`;
            closeAuthPopup();
            registrationForm.reset();

            const authUserData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
            window.location.href = `my-event-page.html?userId=${authUserData.id}`;

        } catch (error) {
            console.error('Ошибка при регистрации:', error);

            // Обработка различных ошибок от API
            if (error.message && error.message.includes('409')) {
                showRegisterError('Пользователь с таким именем или Telegram ID уже существует');
            } else if (error.message && error.message.includes('400')) {
                showRegisterError('Некорректные данные для регистрации');
            } else if (error.message && error.message.includes('500')) {
                showRegisterError('Ошибка сервера. Попробуйте позже');
            } else {
                showRegisterError('Ошибка при регистрации. Попробуйте позже');
            }
        }
    });

    // Функции для управления формами
    function showLoginFormFunc() {
        if (loginForm && registerForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            clearLoginError();
            clearRegisterError();

            // Очищаем поля форм
            document.getElementById('login').value = '';
            document.getElementById('password').value = '';
        }
    }

    function showRegisterFormFunc() {
        if (loginForm && registerForm) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            clearLoginError();
            clearRegisterError();

            // Очищаем поля форм
            document.getElementById('regUsername').value = '';
            document.getElementById('regTelegramId').value = '';
            document.getElementById('regFullName').value = '';
            document.getElementById('regPassword').value = '';
            document.getElementById('regConfirmPassword').value = '';
        }
    }

    // Функции для отображения ошибок
    function clearLoginError() {
        if (loginError) {
            loginError.textContent = '';
            loginError.classList.remove('show');
        }
    }

    function showLoginError(message) {
        if (loginError) {
            loginError.textContent = message;
            loginError.classList.add('show');
        }
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

    // Инициализация - показываем форму входа по умолчанию
    showLoginFormFunc();

    // Добавляем счетчики символов для полей (опционально)
    function addCharacterCounter(inputId, maxLength, counterId) {
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);

        if (input && counter) {
            input.addEventListener('input', function() {
                const remaining = maxLength - this.value.length;
                counter.textContent = `${this.value.length}/${maxLength}`;

                if (this.value.length > maxLength) {
                    counter.style.color = '#ff4444';
                } else {
                    counter.style.color = 'rgba(255, 255, 255, 0.6)';
                }
            });
        }
    }
});