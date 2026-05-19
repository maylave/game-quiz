export interface User {
	token: string
	login: string
	username: string
	role: string
}
export interface loginForm {
	login: string
	code: string
}
export interface RegisterForm {
	name: string
	login: string
	code: string
	role: string
}
