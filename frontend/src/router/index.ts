// router/index.ts
import AdminView from '@/views/admin/AdminView.vue'
import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/login.vue'
import QuizzesView from '@/views/QuizzesView.vue'
import { createRouter, createWebHistory } from 'vue-router'
const routes = [
	{
		path: '/',
		name: 'Home',
		component: HomeView,
		meta: { requiresAuth: true }
	},
	{
		path: '/login',
		name: 'Login',
		component: LoginView
	},
	{
		path: '/quizzes',
		name: 'Quizzes',
		component: QuizzesView,
		meta: { requiresAuth: true }
	},
	{
		path: '/admin',
		name: 'Admin',
		component: AdminView,
		meta: { requiresAdmin: true }
	}
]

export const router = createRouter({
	history: createWebHistory(),
	routes
})

// Используем async и возвращаем значения вместо next()
router.beforeEach(async to => {
	const { useAuthStore } = await import('@/stores/auth.store')
	const authStore = useAuthStore()

	// 1. Маршрут требует прав АДМИНА
	if (to.meta.requiresAdmin) {
		if (!authStore.isAuthenticated) {
			return '/login' // Возвращаем путь для редиректа
		}
		if (!authStore.isAdmin) {
			return '/' // Если не админ, кидаем на главную
		}
		// Если все ок, возвращаем undefined (или ничего), чтобы продолжить навигацию
		return
	}

	// 2. Маршрут требует АВТОРИЗАЦИИ
	if (to.meta.requiresAuth) {
		if (!authStore.isAuthenticated) {
			return '/login'
		}
		return
	}

	// 3. Уже авторизован и пытается зайти на /login
	if (to.path === '/login' && authStore.isAuthenticated) {
		return authStore.isAdmin ? '/admin' : '/'
	}

	// 4. Публичные страницы - разрешаем доступ
	return
})
