const API_BASE = 'http://localhost:8000';

class TaskApi {
    static async getTasksByEventId(EventId, userToken) {
        try {
            const response = await fetch(`${API_BASE}/task/list?event_id=${EventId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка получения списка задач:', error);
            throw error;
        }
    }

    static async updateTaskStatus(TaskId, TaskStatus, userToken) {
        try {
            const response = await fetch(`${API_BASE}/task/update_status?task_id=${TaskId}&status=${TaskStatus}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${userToken}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка обновления статуса задачи:', error);
            throw error;
        }
    }

    static async createTask(TaskData, userToken){
        try {
            const response = await fetch(`${API_BASE}/task/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    event_id: TaskData.event_id,
                    title: TaskData.title,
                    description: TaskData.description,
                    executor_id: TaskData.executor_id,
                    observer_ids: TaskData.observer_ids,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка создания задачи:', error);
            throw error;
        }
    }

    static async updateTask(TaskData, userToken){
        try {
            const response = await fetch(`${API_BASE}/task/create`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userToken}`,
                    'accept': 'application/json'
                },
                body: JSON.stringify({
                    event_id: TaskData.event_id,
                    title: TaskData.title,
                    description: TaskData.description,
                    executor_id: TaskData.executor_id,
                    observer_ids: TaskData.observer_ids,
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Ошибка редактирования задачи:', error);
            throw error;
        }
    }
}

export default TaskApi;