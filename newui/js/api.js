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
                    group_id: 1,
                    name: eventData.name,
                    description: eventData.description,
                    start_date: eventData.date,
                    cancel_of_event_date: eventData.exitDate,
                    venue_event: eventData.place,
                    tg_chat: 'eventData.tg_chat'
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
    static async getAllEvents(){

    }
}

class UserApi{
    static async createUser(UserData) {
        try {
            const response = await fetch(`${API_BASE}/user/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    id: 30,
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
            console.error('Ошибка создания пользователя:', error);
            throw error;
        }
    }
}

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

    static createUser(userData){
        return UserApi.createUser(userData);
    }

    static createEvent(eventData){
        return this.execute(EventAPI.createEvent, FallbackLocalStorage.createEventLocalStorage, eventData)
    }

}

export default SmartAPI;