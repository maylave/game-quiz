import { apiFetchUser, apiLogin, apiRegister } from '@/services/auth.serves'
import type { loginForm, RegisterForm, User } from '@/types/user'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
	const user = ref<User | null>(null)
	const token = ref<string | null>(null)

	const isLoading = ref(false)

	const isAdmin = computed(() => user.value?.role === 'admin')
	const isTeacher = computed(() => user.value?.role === 'teacher')
	const isStudent = computed(() => user.value?.role === 'student')
	const isAuthenticated = computed(() => !!token.value)

	async function loginAction(data: loginForm) {
		isLoading.value = true
		try {
			token.value = await apiLogin(data)
			await fetchUser()
		} finally {
			isLoading.value = false
		}
	}

	async function registerAction(data: RegisterForm) {
		isLoading.value = true
		try {
			token.value = await apiRegister(data)
			await fetchUser()
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
		token.value = null
		isLoading.value = false
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
		isAuthenticated
	}
})
