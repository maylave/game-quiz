import { apiFetchUser, apiLogin, apiRegister } from '@/services/auth.serves'
import type { loginForm, RegisterForm, User } from '@/types/user'
import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue' // Добавили watch

export const useAuthStore = defineStore('auth', () => {
	// 1. При инициализации пытаемся достать токен из localStorage
	const savedToken = localStorage.getItem('auth_token')

	const user = ref<User | null>(null)
	const token = ref<string | null>(savedToken) // Восстанавливаем токен сразу

	const isLoading = ref(false)

	const isAdmin = computed(() => user.value?.role === 'admin')
	const isTeacher = computed(() => user.value?.role === 'teacher')
	const isStudent = computed(() => user.value?.role === 'student')
	const isAuthenticated = computed(() => !!token.value)

	// 2. Следим за изменением токена и сохраняем его в localStorage
	watch(token, newToken => {
		if (newToken) {
			localStorage.setItem('auth_token', newToken)
		} else {
			localStorage.removeItem('auth_token')
		}
	})

	async function loginAction(data: loginForm) {
		isLoading.value = true
		try {
			const newToken = await apiLogin(data)
			token.value = newToken // Watch автоматически сохранит его в LS
			await fetchUser()
		} catch (e) {
			console.error(e)
		} finally {
			isLoading.value = false
		}
	}

	async function registerAction(data: RegisterForm) {
		isLoading.value = true
		try {
			const newToken = await apiRegister(data)
			token.value = newToken // Watch автоматически сохранит его в LS
			await fetchUser()
		} catch (e) {
			console.error(e)
		} finally {
			isLoading.value = false
		}
	}

	async function fetchUser() {
		if (!token.value) return
		try {
			user.value = await apiFetchUser()
		} catch (error) {
			console.error('Ошибка загрузки профиля', error)
			logout()
		}
	}

	function logout() {
		user.value = null
		token.value = null // Watch автоматически удалит его из LS
		isLoading.value = false
	}

	// Эта функция должна вызываться один раз при старте приложения (в main.ts или App.vue)
	async function initAuth() {
		if (token.value && !user.value) {
			await fetchUser()
		}
	}

	return {
		user,
		token,
		isLoading,
		loginAction,
		registerAction,
		logout,
		fetchUser,
		isAdmin,
		isStudent,
		isTeacher,
		isAuthenticated,
		initAuth
	}
})
