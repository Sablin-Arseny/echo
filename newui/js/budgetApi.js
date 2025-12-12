const API_BASE = 'http://localhost:8000';
class BudgetApi {
    static async createBudget(Data) {
        try {
            const response = await fetch(`${API_BASE}/budget/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    event_id: Data.event_id,
                    amount: Data.amount,
                    description: Data.description,
                    participants: Data.participants
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка создания бюджета:', error);
            throw error;
        }
    }

    static async getBudget(EventId) {
        try {
            const response = await fetch(`${API_BASE}/budget/${EventId}`, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения бюджета:', error);
            throw error;
        }
    }
}

export default BudgetApi;