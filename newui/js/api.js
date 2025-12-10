const API_BASE = 'http://localhost:8000';
// Ключи для localStorage
const LOCAL_STORAGE_KEYS = {
    CURRENT_EVENT: 'eventData',  // текущее выбранное мероприятие
    ALL_EVENTS: 'smart_all_events',  // все мероприятия
    EVENT_COUNTER: 'smart_event_counter',
    SYNC_QUEUE: 'smart_sync_queue'
};
class EventAPI {
    static async createEvent(eventData) {
        try {
            const response = await fetch(`${API_BASE}/event/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    name: eventData.name,
                    description: eventData.description,
                    start_date: eventData.date,
                    cancel_of_event_date: eventData.exitDate,
                    event_place: eventData.place,
                    participants: [0],
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка создания мероприятия:', error);
            throw error;
        }
    }
    // получать все эвенты usera по user id
    static async getUserEvents(userId){

    }
}

class UserApi{
    static async registerUser(UserData){
        try {
            const response = await fetch(`${API_BASE}/auth/register?password=${UserData.password}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    username: UserData.userName,
                    tg_id: UserData.tg_id,
                    full_name: UserData.fullname
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            throw error;
        }
    }

    static async authorizationUser(UserData){
        try {
            const response = await fetch(`${API_BASE}/auth/login?password=${UserData.password}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    username: UserData.userName
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            throw error;
        }
    }

    static async getUserInfo(userToken){
        try {
            const response = await fetch(`${API_BASE}/auth/get_info`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            throw error;
        }
    }

    static async getUserByUserName(userName){
        try {
            const response = await fetch(`${API_BASE}/user/by_any_id?username=${userName}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            throw error;
        }
    }

    static async getUserByTgName(userName){
        try {
            const response = await fetch(`${API_BASE}/user/by_any_id?tg_id=${userName}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения данных пользователя:', error);
            throw error;
        }
    }
}
/*
class LocalStorageHelper {
    static generateLocalEventId() {
        // Генерируем уникальный ID для локального мероприятия
        const counter = parseInt(localStorage.getItem(LOCAL_STORAGE_KEYS.EVENT_COUNTER) || '0') + 1;
        localStorage.setItem(LOCAL_STORAGE_KEYS.EVENT_COUNTER, counter.toString());
        return `local_${Date.now()}_${counter}`;
    }

    static getAllEvents() {
        try {
            const events = localStorage.getItem(LOCAL_STORAGE_KEYS.ALL_EVENTS);
            return events ? JSON.parse(events) : [];
        } catch (error) {
            console.error('Ошибка чтения мероприятий из localStorage:', error);
            return [];
        }
    }

    static saveEvent(event) {
        try {
            const events = this.getAllEvents();

            // Проверяем, есть ли уже мероприятие с таким ID
            const existingIndex = events.findIndex(e => e.id === event.id);

            if (existingIndex >= 0) {
                // Обновляем существующее
                events[existingIndex] = event;
            } else {
                // Добавляем новое
                events.push(event);
            }

            localStorage.setItem(LOCAL_STORAGE_KEYS.ALL_EVENTS, JSON.stringify(events));

            // Добавляем в очередь синхронизации
            // this.addToSyncQueue(event);

            return event;
        } catch (error) {
            console.error('Ошибка сохранения мероприятия в localStorage:', error);
            throw error;
        }
    }
}

class FallbackLocalStorage{
    static async createEventLocalStorage(eventData) {
        console.log("Создание мероприятия в localStorage (fallback)");
        // Генерируем локальный ID
        const localEventId = LocalStorageHelper.generateLocalEventId();

        const localEvent = {
            id: localEventId,
            name: eventData.name,
            date: eventData.date,
            exitDate: eventData.exitDate || null,
            place: eventData.place || 'Место не указано',
            description: eventData.description || '',
            tg_chat: eventData.tg_chat || null,
            // Флаги для локального хранения
            isLocal: true,
            syncStatus: 'pending', // pending, synced, error
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
        };

        LocalStorageHelper.saveEvent(localEvent);

        // Возвращаем данные в формате, похожем на API-ответ
        return {
            id: localEventId,
            name: localEvent.name,
            date: localEvent.date,
            exitDate: localEvent.exitDate,
            place: localEvent.place,
            description: localEvent.description,
            tg_chat: localEvent.tg_chat,
            isLocal: true,
            message: 'Мероприятие сохранено локально. Будет синхронизировано при восстановлении связи.'
        };
    }

}
 */
class SmartAPI {
    // Добавить localstorage
    static async execute(apiCall, fallbackCall, ...args) {
        try {
            return await apiCall(...args);
        } catch (error) {
            console.warn('Бэкенд недоступен, используем localStorage:', error);
            return await fallbackCall(...args);
        }
    }

    static createEvent(eventData){
        return EventAPI.createEvent(eventData);
    }

    static getUserEvents(userData){

    }
    static registerUser(userData) {
        return UserApi.registerUser(userData);
    }
    static getUserInfo(userToken){
        return UserApi.getUserInfo(userToken)
    }

    static authorizationUser(userData){
        return UserApi.authorizationUser(userData);
    }

    static getUserByUserName(userName){
        return UserApi.getUserByUserName(userName);
    }

    static getUserByTgName(userTg){
        return UserApi.getUserByTgName(userTg);
    }

}

export default SmartAPI;