<template>
  <div class="min-h-screen bg-zinc-900 flex items-center justify-center p-4 font-sans relative overflow-hidden">
    
  
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
          @click="mode = 'student'"
          class="flex-1 py-4 text-sm font-medium transition-all duration-200 focus:outline-none relative"
          :class="mode === 'student' ? 'text-amber-500 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/20'"
        >
          Студент
          <div v-if="mode === 'student'" class="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
        </button>
        <button 
          @click="mode = 'admin'"
          class="flex-1 py-4 text-sm font-medium transition-all duration-200 focus:outline-none relative"
          :class="mode === 'admin' ? 'text-indigo-400 bg-zinc-700/30' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700/20'"
        >
          Администратор
          <div v-if="mode === 'admin'" class="absolute bottom-0 left-0 w-full h-0.5 bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
        </button>
      </div>

      <div class="p-8">
        
        <!-- STUDENT MODE -->
        <div v-if="mode === 'student'" class="animate-fade-in">
          <div class="text-center mb-6">
            
          </div>

          <form @submit.prevent="startTest" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Имя</label>
              <input 
                v-model="student.firstName" 
                type="text" 
                required
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="Например: Иван"
              >
            </div>

            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Фамилия</label>
              <input 
                v-model="student.lastName" 
                type="text" 
                required
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-zinc-200 placeholder-zinc-600 transition-colors"
                placeholder="Например: Иванов"
              >
            </div>

            <button 
              type="submit"
              class="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-lg shadow-lg shadow-amber-500/20 transition transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <span>Войти как студент</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </form>
        </div>

        <!-- ADMIN MODE -->
        <div v-else class="animate-fade-in">
          <div class="text-center mb-6">
            <h2 class="text-lg font-bold text-zinc-100">Панель управления</h2>
            <p class="text-zinc-500 text-xs mt-1">Доступ только для преподавателей</p>
          </div>

          <form @submit.prevent="loginAdmin" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">Код доступа</label>
              <input 
                v-model="adminCode" 
                type="password" 
                required
                class="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-zinc-200 text-center tracking-[0.5em] placeholder-zinc-700 transition-colors"
                placeholder="Введите код доступа"
              >
            </div>

            <div v-if="error" class="bg-red-950/50 border border-red-900/50 text-red-400 text-xs text-center p-3 rounded-lg animate-pulse">
              {{ error }}
            </div>

            <button 
              type="submit"
              class="w-full py-3.5 bg-zinc-700 hover:bg-zinc-600 text-white font-bold rounded-lg shadow-lg transition transform active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <span>Войти в систему</span>
            </button>
            
           
          </form>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const mode = ref('student') // 'student' или 'admin'
const adminCode = ref('')
const error = ref('')

const student = reactive({
  firstName: '',
  lastName: ''
})

// Логика для студента
const startTest = () => {
  const fullName = `${student.firstName.trim()} ${student.lastName.trim()}`
  
  // Сохраняем имя студента и роль
  localStorage.setItem('tempStudentName', fullName)
  localStorage.setItem('userRole', 'student')
  
  // Перенаправляем на страницу студента (Dashboard)
  router.push('/')
}

// Логика для админа
const loginAdmin = () => {
  // ПАРОЛЬ: may123
  if (adminCode.value === 'may123') {
    localStorage.setItem('tempStudentName', 'Администратор')
    localStorage.setItem('userRole', 'admin')
    
    // Очищаем ошибку и пароль
    error.value = ''
    adminCode.value = ''
    
    // Перенаправляем в админку
    router.push('/admin')
  } else {
    error.value = 'Неверный код доступа'
    adminCode.value = ''
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