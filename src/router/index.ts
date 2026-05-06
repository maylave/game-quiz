import HomeView from '@/views/HomeView.vue'
import LoginView from '@/views/login.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
	{
		path: '/',
		component: HomeView,
		// Можно защитить и главную, если хотите, чтобы студенты тоже логинились
		meta: { requiresAuth: true }
	},
	{
		path: '/login',
		component: LoginView
	},
	{
		path: '/admin',
		component: () => import('@/views/admin/AdminView.vue'),
		meta: { requiresAdmin: true } // Помечаем маршрут как "Только для админов"
	}
]

export const router = createRouter({
	history: createWebHistory(),
	routes
})

// --- ЗАЩИТА МАРШРУТОВ ---
router.beforeEach((to, from, next) => {
	// Получаем роль из localStorage
	const userRole = localStorage.getItem('userRole')

	// Проверяем, требует ли маршрут прав админа
	if (to.meta.requiresAdmin) {
		if (userRole === 'admin') {
			next() // Пускаем админа
		} else {
			next('/login') // Всех остальных отправляем на логин
		}
	}
	// Проверяем, требует ли маршрут просто авторизации (для студентов)
	else if (to.meta.requiresAuth) {
		const studentName = localStorage.getItem('tempStudentName')
		if (studentName) {
			next() // Пускаем студента
		} else {
			next('/login') // Отправляем на логин
		}
	} else {
		next() // Для публичных страниц (например, /login) пускаем всех
	}
})
