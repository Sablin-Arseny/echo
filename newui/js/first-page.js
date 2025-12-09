import SmartAPI from './api.js';

document.addEventListener('DOMContentLoaded', function() {
    // Элементы
    const authButton = document.getElementById('authButton');
    const authPopup = document.getElementById('authPopup');
    const closePopup = document.getElementById('closePopup');
    const authForm = document.getElementById('authForm');
    const authText = document.getElementById('authText');
    const overlay = authPopup;

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

        const login = document.getElementById('login').value;
        const password = document.getElementById('password').value;

        // Здесь можно добавить логику авторизации
        console.log('Логин:', login);
        console.log('Пароль:', password);

        // Временная логика
        if (login && password) {

            const userData = {

                userName: login,
                tg_id: login,
                fullname: login
            };

            const userResult = await SmartAPI.createUser(userData);
            console.log("Пользователь создан: ", userData, userResult);
            localStorage.setItem("userData", JSON.stringify(userResult));

            // Изменяем текст кнопки на имя пользователя
            authText.innerHTML = `<b>${login}</b>`;
            closeAuthPopup();
            authForm.reset();
            window.location.href = `my-event-page.html?userId=${userResult.id}`;
        }
    });

    // Функция закрытия popup
    function closeAuthPopup() {
        authPopup.style.display = 'none';
        document.body.style.overflow = 'auto';
        authForm.reset();
    }

});