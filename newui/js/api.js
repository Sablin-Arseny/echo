import EventApi from './eventApi.js'
import UserApi from './userApi.js'
import eventApi from "./eventApi.js";
import BudgetApi from './budgetApi.js';

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
        return EventApi.createEvent(eventData);
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

    static getParticipatingGUserEvents(userToken) {
        return EventApi.getParticipatingGUserEvents(userToken);
    }

    static getEventById(eventId){
        return EventApi.getEventById(eventId)
    }

    static checkUserByUserName(userName){
        return UserApi.checkUserByUserName(userName);
    }

    static addUserToEvent(data){
        return EventApi.addUserToEvent(data);
    }

    static getInvitedGUserEvents(userToken){
        return EventApi.getInvitedGUserEvents(userToken);
    }

    static updateStatusOfMemberToInvited(data, status){
        return EventApi.updateStatusOfMember(data, status);
    }

    static createBudget(data){
        return BudgetApi.createBudget(data);
    }

    static getBudget(EventId){
        return BudgetApi.getBudget(EventId);
    }

}

export default SmartAPI;
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