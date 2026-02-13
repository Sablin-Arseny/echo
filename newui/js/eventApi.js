const API_BASE = 'http://localhost:8000';
class EventApi {
    static async createEvent(eventData) {
        try {
            const response = await fetch(`${API_BASE}/event/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    name: eventData.name,
                    description: eventData.description,
                    start_date: eventData.date,
                    cancel_of_event_date: eventData.exitDate,
                    event_place: eventData.place,
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
    static async getParticipatingGUserEvents(userToken){
        try {
            const response = await fetch(`${API_BASE}/event/get_user_events?status=PARTICIPATING`, {
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
            console.error('Ошибка получения мероприятий пользователя:', error);
            throw error;
        }
    }

    static async getInvitedGUserEvents(userToken){
        try {
            const response = await fetch(`${API_BASE}/event/get_user_events?status=DRAFT`, {
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
            console.error('Ошибка получения приглашенных мероприятий пользователя:', error);
            throw error;
        }
    }
    // получить ивент по id ивента
    static async getEventById(eventId){
        try {
            const response = await fetch(`${API_BASE}/event/${eventId}`, {
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
            console.error('Ошибка получения мероприятия по его id:', error);
            throw error;
        }
    }

    static async addUserToEvent(data, userToken){
        try {
            const response = await fetch(`${API_BASE}/event/add_user_to_event?event_id=${data.event_id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    id: data.id,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка приглашения пользователя:', error);
            throw error;
        }
    }

    static async updateStatusOfMember(data, status){
        try {
            const response = await fetch(`${API_BASE}/event/update_status_of_member?event_id=${data.event_id}&status=${status}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    id: data.id,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка приглашения изменения состояния пользователя:', error);
            throw error;
        }
    }

    static async updateRoleOfMember(data, role, userToken){
        try {
            const response = await fetch(`${API_BASE}/event/update_role_of_member?event_id=${data.event_id}&role=${role}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    id: data.user_id,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка изменения роли пользователя:', error);
            throw error;
        }
    }

    static async updateEvent(eventData){
        try {
            const response = await fetch(`${API_BASE}/event/update`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка изменения информации о мероприятии:', error);
            throw error;
        }
    }
}

export default EventApi;