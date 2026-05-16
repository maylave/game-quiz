<template>
  <header 
    v-if="isActive" 
    class="sticky top-0 z-40 border-b border-zinc-700 bg-zinc-900/90 backdrop-blur shadow-lg"
  >
    <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
      
      <!-- Логотип / Бренд -->
      <div class="flex items-center gap-3 cursor-pointer group" @click="goHome">
        <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-zinc-900 font-bold transition-transform group-hover:scale-105">
          QG
        </div>
        <span class="text-sm font-bold tracking-tight text-zinc-200 group-hover:text-white transition-colors">Quiz Game</span>
      </div>

      <!-- Навигация (Ссылки) -->
      <nav class="hidden md:flex items-center gap-1">
        <template v-for="link in allowedLinks" :key="link.path">
          <router-link 
            :to="link.path"
            active-class="text-amber-500 bg-amber-500/10"
            class="px-3 py-1.5 rounded-md text-sm font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-all"
          >
            {{ link.label }}
          </router-link>
        </template>
      </nav>

      <!-- Правая часть: Профиль и Выход -->
      <div class="flex items-center gap-4">
        
        <!-- Инфо о пользователе -->
        <div v-if="userName" class="flex items-center gap-3 border-l border-zinc-700 pl-4">
           <div class="text-right hidden sm:block">
             <p class="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">{{ roleLabel }}</p>
             <p class="text-sm font-bold text-zinc-200 leading-none truncate max-w-[150px]">{{ userName }}</p>
           </div>
           
           <!-- Аватарка (заглушка) -->
           <div class="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-400 border border-zinc-600">
             {{ userName.charAt(0).toUpperCase() }}
           </div>

           <!-- Кнопка выхода -->
           <button 
             @click="handleLogout" 
             class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 transition-all ml-1"
             title="Выйти из системы"
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
           </button>
        </div>
      </div>
    </div>
  </header>
</template>
<script setup lang="ts">
import { useAuthStore } from '@/stores/auth.store'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

// Конфигурация навигации
const NAVIGATION_CONFIG = [
  { path: '/', label: 'Главная', roles: ['student', 'teacher', 'admin'] },
  { path: '/quizzes', label: 'Тесты', roles: ['student', 'teacher', 'admin'] },
  { path: '/results', label: 'Мои результаты', roles: ['student'] },
  { path: '/create-quiz', label: 'Создать тест', roles: ['teacher', 'admin'] },
  { path: '/admin/users', label: 'Пользователи', roles: ['admin'] },
  { path: '/admin/settings', label: 'Настройки', roles: ['admin'] }
]

defineProps({
  isActive: {
    type: Boolean,
    default: true
  }
})

// --- ИСПРАВЛЕНИЕ: Берем данные из объекта user в сторе ---

// Имя пользователя
const userName = computed(() => authStore.user?.username )

// Роль пользователя
const userRole = computed(() => authStore.user?.role )

// Красивое название роли
const roleLabel = computed(() => {
  const map: Record<string, string> = {
    student: 'Студент',
    teacher: 'Преподаватель',
    admin: 'Администратор'
  }
  return map[userRole.value] || 'Пользователь'
})

// Фильтрация ссылок
const allowedLinks = computed(() => {
  return NAVIGATION_CONFIG.filter(link => 
    link.roles.includes(userRole.value)
  )
})

const goHome = () => {
  router.push('/')
}

const handleLogout = async () => {
  await authStore.logout() // Если logout асинхронный, лучше await
  router.push('/login')
}
</script>