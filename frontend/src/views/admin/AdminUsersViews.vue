<template>
  <div class="min-h-screen bg-zinc-800/90 text-zinc-100 font-sans relative">
    <!-- 1. Фон вынесен сюда, чтобы быть на весь экран -->
    <div class="fixed inset-0 opacity-20 pointer-events-none z-0"
      style="background-image: radial-gradient(circle, #111 1px, transparent 1px); background-size: 28px 28px;">
    </div>

    <Header />

    <!-- 2. Контент имеет z-10, чтобы быть поверх фона -->
    <main class="max-w-6xl mx-auto px-6 py-8 relative z-10">
      
      <!-- Панель управления -->
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-zinc-100">Пользователи</h1>
      </div>

      <!-- Таблица пользователей -->
      <div class="overflow-x-auto rounded-xl border border-zinc-700 bg-zinc-800/50 shadow-xl backdrop-blur-sm">
        <table class="w-full text-left text-sm text-zinc-400">
          <thead class="bg-zinc-950/50 text-xs uppercase text-zinc-300">
            <tr>
              <th scope="col" class="px-6 py-4 font-semibold">Логин</th>
              <th scope="col" class="px-6 py-4 font-semibold">Имя</th>
              <th scope="col" class="px-6 py-4 font-semibold">Роль</th>
              <th scope="col" class="px-6 py-4 text-right font-semibold">Действия</th>
            </tr>
          </thead>
          
          <tbody class="divide-y divide-zinc-700/50">
            <!-- 3. Добавлен :key="user.id" -->
            <tr 
              v-for="user in users" 
               
              class="hover:bg-zinc-700/30 transition-colors duration-200"
            >
              <td class="px-6 py-4 font-medium text-zinc-200">
                {{ user.login }}
              </td>
              <td class="px-6 py-4">
                {{ user.username }}
              </td>
              <td class="px-6 py-4">
                <span 
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border"
                  :class="{
                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20': user.role === 'admin',
                    'bg-blue-500/10 text-blue-400 border-blue-500/20': user.role === 'teacher',
                    'bg-zinc-500/10 text-zinc-400 border-zinc-500/20': user.role === 'student'
                  }"
                >
                  {{ user.role }}
                </span>
              </td>
              <td class="px-6 py-4 text-right">
                <!-- Место для кнопок действий -->
              </td>
            </tr>

            <!-- Состояние пустого списка -->
            <tr v-if="users.length === 0 && !isLoading">
              <td colspan="4" class="px-6 py-8 text-center text-zinc-500">
                Список пользователей пуст
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- Индикатор загрузки -->
      <div v-if="isLoading" class="mt-4 text-center text-zinc-500 text-sm animate-pulse">
        Загрузка данных...
      </div>

    </main>
  </div>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue'
import { getAllUsers } from '@/services/admin.services'
import type { User } from '@/types/user'
import { onMounted, ref } from 'vue'

const users = ref<User[]>([])
const isLoading = ref(false)

async function loadUsers() {
  isLoading.value = true
  try {
    users.value = await getAllUsers()
  } catch (e) {
    console.error('Ошибка загрузки пользователей:', e)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>