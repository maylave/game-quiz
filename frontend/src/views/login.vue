<template>
  <div class="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
    
    <!-- Background Effects -->
    <div class="fixed inset-0 opacity-20 pointer-events-none"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>
    
    <div class="absolute top-[-10%] left-[-10%] w-96 h-96 bg-amber-500/20 rounded-full blur-[100px]"></div>
    <div class="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px]"></div>

    <div class="relative w-full max-w-md bg-zinc-800 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden animate-fade-in-up">
      
      <!-- Header / Logo Area -->
      <div class="bg-zinc-900/50 p-6 text-center border-b border-zinc-700">
        <div class="w-12 h-12 bg-amber-500 rounded-xl mx-auto flex items-center justify-center mb-3 shadow-lg shadow-amber-500/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-zinc-900">
            <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
          </svg>
        </div>
        <h1 class="text-xl font-bold text-white tracking-tight">Quiz Master</h1>
      </div>

      <!-- Tabs Switcher -->
      <div class="flex border-b border-zinc-700 bg-zinc-800">
        <button 
          @click="mode = 'login'"
          class="flex-1 py-4 text-sm font-medium transition-all duration-200 focus:outline-none relative"
          :class="mode === 'login' ? 'text-amber-500 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/20'"
        >
          Вход
          <div v-if="mode === 'login'" class="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
        </button>
        <button 
          @click="mode = 'register'"
          class="flex-1 py-4 text-sm font-medium transition-all duration-200 focus:outline-none relative"
          :class="mode === 'register' ? 'text-indigo-400 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/20'"
        >
          Регистрация
          <div v-if="mode === 'register'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        </button>
      </div>

      <div class="p-8">
        
        <!-- LOGIN MODE -->
        <div v-if="mode === 'login'" class="animate-fade-in">
          <div class="text-center mb-6">
            <h2 class="text-lg font-bold text-zinc-100">С возвращением!</h2>
            <p class="text-zinc-500 text-xs mt-1">Введите свои данные для входа</p>
          </div>

          <form @submit.prevent="handleLogin" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Логин</label>
              <input 
                v-model="loginForm.login" 
                type="text" 
                required
                autocomplete="username"
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="admin или student"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Код доступа</label>
              <input 
                v-model="loginForm.code" 
                type="password" 
                required
                autocomplete="current-password"
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="••••••••"
              >
            </div>

            <div v-if="error" class="bg-red-950/50 border border-red-900/50 text-red-400 text-xs text-center p-3 rounded-lg">
              {{ error }}
            </div>

            <button 
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full py-3.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <span v-if="!authStore.isLoading">Войти</span>
              <span v-else>Проверка...</span>
              <svg v-if="!authStore.isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
        </div>

        <!-- REGISTER MODE -->
        <div v-else class="animate-fade-in">
          <div class="text-center mb-6">
            <h2 class="text-lg font-bold text-zinc-100">Новый аккаунт</h2>
            <p class="text-zinc-500 text-xs mt-1">Заполните данные для регистрации</p>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Имя</label>
              <!-- ИСПРАВЛЕНО: вызываем локальную функцию-обертку -->
              <input 
                v-model="registerForm.name" 
                @input="handleNameInput"
                type="text" 
                required
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="Иван Иванов"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Логин</label>
              <div class="relative">
                <!-- ИСПРАВЛЕНО: v-model привязан к переменной, а не к функции -->
                <input 
                  v-model="registerForm.login" 
                  type="text" 
                  required
                  class="w-full px-4 py-3 bg-zinc-900/50 border border-zinc-700 rounded-lg text-zinc-400 cursor-not-allowed"
                  readonly
                  placeholder="Генерируется автоматически"
                >
              </div>
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Код</label>
              <input 
                v-model="registerForm.code" 
                type="password" 
                required
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="Минимум 6 символов"
              >
            </div>

            <div v-if="error" class="bg-red-950/50 border border-red-900/50 text-red-400 text-xs text-center p-3 rounded-lg">
              {{ error }}
            </div>

            <button 
              type="submit"
              :disabled="authStore.isLoading"
              class="w-full py-3.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg shadow-lg shadow-amber-500/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <span v-if="!authStore.isLoading">Зарегистрироваться</span>
              <span v-else>Создание...</span>
              <svg v-if="!authStore.isLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import type { loginForm, RegisterForm } from '@/types/user'
import { generateLoginFromName } from '@/utils/translit'
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const mode = ref<'login' | 'register'>('login')
const error = ref<string | null>(null)

// Формы
const loginForm = reactive<loginForm>({
  login: '',
  code: ''
})

const registerForm = reactive<RegisterForm>({
  name: '',
  login: '',
  code: '',
  role: 'admin'
})

// Функция-обертка для генерации логина
const handleNameInput = () => {
  if (registerForm.name) {
    registerForm.login = generateLoginFromName(registerForm.name)
  } else {
    registerForm.login = ''
  }
}

const handleLogin = async () => {
  error.value = null
  try {
    await authStore.loginAction(loginForm)
    if (authStore.user) {
      router.push(authStore.isAdmin ? '/admin' : '/')
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка входа'
  }
}

const handleRegister = async () => {
  error.value = null
  try {
    await authStore.registerAction(registerForm)
    if (authStore.user) {
      router.push(authStore.isAdmin ? '/admin' : '/')
    }
  } catch (e: any) {
    error.value = e.message || 'Ошибка регистрации'
  }
}
</script>

<style scoped>
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
  animation: fade-in-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
.animate-fade-in {
  animation: fade-in-up 0.3s ease-out forwards;
}
</style>