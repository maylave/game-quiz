import type { loginForm, RegisterForm, User } from '@/types/user'
import api from './api'

export const apiLogin = async (data: loginForm): Promise<string> => {
	const res = await api.post('/auth/login', data)
	if (!res.data.token) throw new Error('Токен не получен')
	return res.data.token
}

export const apiRegister = async (data: RegisterForm): Promise<string> => {
	const res = await api.post('/auth/register', data)
	if (!res.data.token) throw new Error('Токен не получен')
	return res.data.token
}
export const apiFetchUser = async (): Promise<User> => {
	const res = await api.get<User>('/user/me')
	return res.data
}
