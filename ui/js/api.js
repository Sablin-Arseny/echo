// api.js - модуль для работы с вашим бэкендом
const API_BASE = 'http://localhost:8000'; // FastAPI по умолчанию

class EventAPI {
    // Создание мероприятия
    static async createEvent(eventData) {
        try {
            const response = await fetch(`${API_BASE}/event`, {
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

    // Получение мероприятия по ID
    static async getEvent(eventId) {
        try {
            // Убедитесь, что eventId - число (убираем префикс 'local_')
            const cleanEventId = eventId.toString().replace('local_', '');

            const response = await fetch(`${API_BASE}/event/id/${cleanEventId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки мероприятия:', error);
            throw error;
        }
    }

    // Проверка пользователя по tg_id
    static async checkUserByTgId(tgId) {
        try {
            const response = await fetch(`${API_BASE}/user/check_by_tg_id/${tgId}`);

            if (response.status === 404) {
                return false; // Пользователь не найден
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true; // Пользователь существует
        } catch (error) {
            console.error('Ошибка проверки пользователя:', error);
            return false;
        }
    }
    // Пользователь по Тг
    static async getUserByTgId(tgId) {
        try {
            console.log('🔍 Запрос пользователя по tg_id:', tgId);

            const response = await fetch(`${API_BASE}/user/by_any_id?tg_id=${tgId}`);

            console.log('📥 Ответ статус:', response.status);

            if (response.status === 404) {
                return null; // Пользователь не найден
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json();
            console.log('✅ Данные пользователя получены:', userData);
            return userData;

        } catch (error) {
            console.error('❌ Ошибка получения пользователя:', error);
            throw error;
        }
    }

    // Создание группы
    // static async createGroup(groupData) {
    //     try {
    //         const response = await fetch(`${API_BASE}/group`, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //             },
    //             body: JSON.stringify({
    //                 name: groupData.name
    //             })
    //         });
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //
    //         return await response.json();
    //     } catch (error) {
    //         console.error('Ошибка создания группы:', error);
    //         throw error;
    //     }
    // }

    // Создание бюджета (траты)
    static async createBudget(budgetData) {
        try {
            console.log('📤 Создание бюджета:', budgetData);

            const response = await fetch(`${API_BASE}/budget/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    event_id: budgetData.event_id,
                    paid_by_id: budgetData.paid_by_id,
                    amount: budgetData.amount,
                    description: budgetData.description,
                    participants: budgetData.participants,
                })
            });

            console.log('📥 Ответ от сервера:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Ошибка сервера:', errorText);
                throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
            }

            const result = await response.json();
            console.log('✅ Бюджет создан:', result);
            return result;

        } catch (error) {
            console.error('❌ Ошибка создания бюджета:', error);
            throw error;
        }
    }

    // Получение полного бюджета мероприятия
    static async getFullBudget(eventId) {
        try {
            const cleanEventId = eventId.toString().replace('local_', '');
            console.log('📥 Запрос полного бюджета для event_id:', cleanEventId);

            const response = await fetch(`${API_BASE}/budget/full/${cleanEventId}`);

            console.log('📤 Ответ статус:', response.status);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Данные бюджета получены:', data);
            return data;

        } catch (error) {
            console.error('❌ Ошибка загрузки бюджета:', error);
            throw error;
        }
    }

    // Создание пользователя
    static async createUser(userData) {
        try {
            const response = await fetch(`${API_BASE}/user/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: userData.username,
                    tg_id: userData.tg_id,
                    full_name: userData.full_name
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

    // Получение всех пользователей
    static async getAllUsers() {
        try {
            const response = await fetch(`${API_BASE}/user/all`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
            throw error;
        }
    }

    // Поиск пользователя
    // static async getUser(searchParams) {
    //     try {
    //         const params = new URLSearchParams();
    //         if (searchParams.id) params.append('id', searchParams.id);
    //         if (searchParams.username) params.append('username', searchParams.username);
    //         if (searchParams.tg_id) params.append('tg_id', searchParams.tg_id);
    //         if (searchParams.full_name) params.append('full_name', searchParams.full_name);
    //
    //         const response = await fetch(`${API_BASE}/user/by_any_id?${params}`);
    //
    //         if (!response.ok) {
    //             throw new Error(`HTTP error! status: ${response.status}`);
    //         }
    //
    //         return await response.json();
    //     } catch (error) {
    //         console.error('Ошибка поиска пользователя:', error);
    //         throw error;
    //     }
    // }
}

// Fallback на localStorage
class StorageFallback {
    static async createEvent(eventData) {
        const localEvent = {
            id: 'local_' + Date.now(),
            name: eventData.name,
            description: eventData.description,
            start_date: eventData.start_date,
            cancel_of_event_date: eventData.cancel_of_event_date,
            venue_event: eventData.venue_event,
            tg_chat: eventData.tg_chat
        };
        localStorage.setItem('eventData', JSON.stringify(localEvent));
        return localEvent;
    }

    static async getEvent(eventId) {
        if (eventId.startsWith('local_')) {
            const eventData = JSON.parse(localStorage.getItem('eventData') || '{}');
            const participants = JSON.parse(localStorage.getItem('participants') || '[]');
            const expenses = JSON.parse(localStorage.getItem('expenses') || '[]');

            return {
                ...eventData,
                participants,
                expenses
            };
        }
        throw new Error('Event not found');
    }

    static async checkUserByTgId(tgId) {
        // В localStorage храним участников
        const participants = JSON.parse(localStorage.getItem('participants') || '[]');
        return participants.some(participant => participant.tg_id === tgId);
    }

    static async getUserByTgId(tgId) {
        // В localStorage храним участников как объекты
        const participants = JSON.parse(localStorage.getItem('participants') || '[]');
        const user = participants.find(p =>
            typeof p === 'object' && p !== null && p.tg_id === tgId
        );
        return user || null;
    }

    static async createBudget(budgetData) {
        const expenses = JSON.parse(localStorage.getItem('expenses') || []);
        const newExpense = {
            id: 'local_expense_' + Date.now(),
            event_id: budgetData.event_id,
            paid_by: { id: budgetData.paid_by_id, full_name: budgetData.paid_by_name },
            amount: budgetData.amount,
            description: budgetData.description,
            participants: budgetData.participant_names.map(name => ({ full_name: name }))
        };
        expenses.push(newExpense);
        localStorage.setItem('expenses', JSON.stringify(expenses));
        return newExpense;
    }

    static async getFullBudget(eventId) {
        if (eventId.startsWith('local_')) {
            return JSON.parse(localStorage.getItem('expenses') || '[]');
        }
        throw new Error('Event not found');
    }
}

// Умный API клиент
class SmartAPI {
    static async execute(apiCall, fallbackCall, ...args) {
        try {
            return await apiCall(...args);
        } catch (error) {
            console.warn('Бэкенд недоступен, используем localStorage:', error);
            return await fallbackCall(...args);
        }
    }

    static createEvent(eventData) {
        return this.execute(EventAPI.createEvent, StorageFallback.createEvent, eventData);
    }

    static checkUserByTgId(tgId) {
        return this.execute(EventAPI.checkUserByTgId, StorageFallback.checkUserByTgId, tgId);
    }

    static getUserByTgId(tgId) {
        return this.execute(EventAPI.getUserByTgId, StorageFallback.getUserByTgId, tgId);
    }

    static getEvent(eventId) {
        return this.execute(EventAPI.getEvent, StorageFallback.getEvent, eventId);
    }

    static createBudget(budgetData) {
        return this.execute(EventAPI.createBudget, StorageFallback.createBudget, budgetData);
    }

    static getFullBudget(eventId) {
        return this.execute(EventAPI.getFullBudget, StorageFallback.getFullBudget, eventId);
    }

    static createGroup(groupData) {
        return this.execute(EventAPI.createGroup, StorageFallback.createGroup, groupData);
    }

    static createUser(userData) {
        return this.execute(EventAPI.createUser, StorageFallback.createUser, userData);
    }

    static getAllUsers() {
        return this.execute(EventAPI.getAllUsers, StorageFallback.getAllUsers);
    }

    static getUser(searchParams) {
        return this.execute(EventAPI.getUser, StorageFallback.getUser, searchParams);
    }
}

export default SmartAPI;