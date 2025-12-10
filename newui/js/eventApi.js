const API_BASE = 'http://localhost:8000';
class EventApi {
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

export default EventApi;