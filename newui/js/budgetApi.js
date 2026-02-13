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

    static async getBudgetDetail(budgetId) {
        try {
            const response = await fetch(`${API_BASE}/budget/detail/${budgetId}`, {
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
            console.error('Ошибка получения деталей бюджета:', error);
            throw error;
        }
    }

    static async markParticipantPaid(budgetId, amount) {
        try {
            const response = await fetch(`${API_BASE}/budget/mark_paid`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    budget_id: budgetId,
                    amount: amount || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при отметке участника как оплаченного:', error);
            throw error;
        }
    }

    static async confirmPayment(budgetId, participantTgId) {
        try {
            const response = await fetch(`${API_BASE}/budget/confirm_payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                },
                body: JSON.stringify({
                    budget_id: budgetId,
                    participant_tg_id: participantTgId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка при подтверждении платежа:', error);
            throw error;
        }
    }

    static async getUserExpenses(eventId) {
        try {
            const response = await fetch(`${API_BASE}/budget/user_expenses?event_id=${eventId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения расходов пользователя:', error);
            throw error;
        }
    }

    static async deleteBudget(budgetId) {
        try {
            const response = await fetch(`${API_BASE}/budget/${budgetId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${JSON.parse(localStorage.getItem("userToken"))}`,
                    'accept': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка удаления бюджета:', error);
            throw error;
        }
    }
}

export default BudgetApi;