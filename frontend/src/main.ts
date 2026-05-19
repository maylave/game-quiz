import { useAuthStore } from '@/stores/auth.store'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import './main.css'
import { router } from './router'
const pinia = createPinia()

const app = createApp(App)
app.use(pinia)
app.use(router)

const authStore = useAuthStore()

authStore.initAuth().finally(() => {
	app.mount('#app')
})
