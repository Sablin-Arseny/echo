const API_BASE = 'http://localhost:8000';
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

export default UserApi;