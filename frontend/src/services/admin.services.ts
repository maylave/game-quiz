import type { RegisterForm, User } from '@/types/user'
import api from './api'

const BASE_URL = '/admin/users'

export const createUser = async (data: RegisterForm): Promise<User> => {
	const payload = {
		username: data.name,
		login: data.login,
		role: data.role,

		password: (data as any).password || (data as any).code
	}

	const res = await api.post(`${BASE_URL}/create`, payload)
	return res.data.user
}

export const getAllUsers = async (): Promise<User[]> => {
	const res = await api.get(`${BASE_URL}/list`)

	return res.data.users || []
}

export const deleteUser = async (userId: string): Promise<void> => {
	await api.delete(`${BASE_URL}/${userId}`)
}

export const updateUserRole = async (
	userId: string,
	newRole: string
): Promise<User> => {
	const res = await api.patch(`${BASE_URL}/${userId}/set-role`, null, {
		params: {
			new_role: newRole
		}
	})
	return res.data.user
}

export const updateUser = async (
	userId: string,
	data: Partial<RegisterForm>
): Promise<User> => {
	const res = await api.put(`${BASE_URL}/${userId}`, data)
	return res.data.user
}
