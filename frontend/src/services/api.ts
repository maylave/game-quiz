import { useAuthStore } from '@/stores/auth.store' // Убедись, что путь к стору верный
import axios from 'axios'

// Создаем экземпляр Axios
const api = axios.create({
	baseURL: '/api', // Лучше указать полный URL бэкенда, чтобы не зависеть от прокси Vite
	headers: {
		'Content-Type': 'application/json',
		Accept: 'application/json'
	},
	timeout: 10000
})

// --- REQUEST INTERCEPTOR (Перехватчик запросов) ---
api.interceptors.request.use(
	config => {
		// Получаем доступ к стору авторизации
		const authStore = useAuthStore()

		// Если токен есть, добавляем его в заголовки
		if (authStore.token) {
			// Важно: Бэкенд ожидает формат "Bearer <token>"
			config.headers.Authorization = `Bearer ${authStore.token}`
		}

		return config
	},
	error => {
		return Promise.reject(error)
	}
)

// --- RESPONSE INTERCEPTOR (Перехватчик ответов) ---
// Опционально, но очень полезно. Если токен протух (401), мы разлогиним пользователя.
api.interceptors.response.use(
	response => response,
	error => {
		// Проверяем, что ошибка связана с авторизацией (401 Unauthorized)
		if (error.response && error.response.status === 401) {
			const authStore = useAuthStore()

			// Очищаем стейт (удаляем токен и данные пользователя)
			authStore.logout()

			// Опционально: можно добавить редирект на страницу логина
			// import router from '@/router'
			// router.push('/login')

			console.warn(
				'Сессия истекла или токен невалиден. Пользователь разлогинен.'
			)
		}

		return Promise.reject(error)
	}
)

export default api
