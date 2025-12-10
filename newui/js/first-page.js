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
    const overlay = authPopup;

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

    // Обработка формы
    authForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const username = document.getElementById('login').value;
        const password = document.getElementById('password').value;

        const userData = {
            userName: username,
            password: password,
        };

        const userResult = await SmartAPI.authorizationUser(userData);
        console.log("Пользователь авторизовался: ", userData, userResult);
        localStorage.setItem("userToken", JSON.stringify(userResult));

        // Изменяем текст кнопки на имя пользователя
        authText.innerHTML = `<b>${username}</b>`;
        closeAuthPopup();
        authForm.reset();
        const authUserData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        window.location.href = `my-event-page.html?userId=${authUserData.id}`;

    });

    // Функция закрытия popup
    function closeAuthPopup() {
        authPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        authForm.reset();
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

    // Обработка формы регистрации
    registrationForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        clearRegisterError();

        // Получаем значения полей
        const username = document.getElementById('regUsername').value;
        const tg_id = document.getElementById('regTelegramId').value;
        const full_name = document.getElementById('regFullName').value;
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regConfirmPassword').value;

        // Валидация
        if (!username || !tg_id || !full_name || !password || !confirmPassword) {
            showRegisterError('Заполните все поля');
            return;
        }

        if (password !== confirmPassword) {
            showRegisterError('Пароли не совпадают');
            return;
        }

        if (password.length < 4) {
            showRegisterError('Пароль должен содержать минимум 4 символа');
            return;
        }

        try {
            const existingUser = await SmartAPI.getUserByUserName(username);

            if (existingUser && existingUser.id) {
                showRegisterError('Пользователь с таким именем уже существует');
                return;
            }
        } catch (error) {
            // Если пользователь не найден (404 или другая ошибка), продолжаем регистрацию
            console.log('Пользователь не найден, можно регистрировать:', error);
        }
        try {
            const existingUserTg = await SmartAPI.getUserByTgName(tg_id);

            if (existingUserTg && existingUserTg.id) {
                showRegisterError('Пользователь с tg_id уже существует');
                return;
            }
        } catch (error) {
            // Если пользователь не найден (404 или другая ошибка), продолжаем регистрацию
            console.log('Пользователь не найден, можно регистрировать:', error);
        }


        const userData = {

            userName: username,
            tg_id: tg_id,
            fullname: full_name,
            password: password,
        };

        const userResult = await SmartAPI.registerUser(userData);
        console.log("Пользователь создан: ", userData, userResult);
        localStorage.setItem("userToken", JSON.stringify(userResult));

        // Изменяем текст кнопки на имя пользователя
        authText.innerHTML = `<b>${username}</b>`;
        closeAuthPopup();
        authForm.reset();
        const authUserData = await SmartAPI.getUserInfo(JSON.parse(localStorage.getItem("userToken")));
        window.location.href = `my-event-page.html?userId=${authUserData.id}`;


    });

    // Функции для управления формами
    function showLoginFormFunc() {
        if (loginForm && registerForm) {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
            clearRegisterError();
        }
    }

    function showRegisterFormFunc() {
        if (loginForm && registerForm) {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
            clearRegisterError();
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

});