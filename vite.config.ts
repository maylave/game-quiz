import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import vueDevTools from 'vite-plugin-vue-devtools'
// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
	plugins: [vue(), mode === 'development' && vueDevTools(), tailwindcss()],
<<<<<<< HEAD
	base: './',
=======
	base: '/',
>>>>>>> dabe19160952aef4e584cb1975c6f3e7410a64f5
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url))
		}
	}
}))
