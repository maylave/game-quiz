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
	username: string
	login: string
	code: string
	role: string
}
