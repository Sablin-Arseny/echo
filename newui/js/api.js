const API_BASE = 'http://localhost:8000';

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
                    id: 25,
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
        return EventAPI.createEvent(eventData)
    }

}

export default SmartAPI;