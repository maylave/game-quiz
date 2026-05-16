<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30 flex flex-col">
    <!-- Dot grid bg -->
    <div class="fixed inset-0 opacity-20 pointer-events-none"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>

    <Header :is-active="true" />

    <main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 relative z-10">

      <!-- VIEW: DASHBOARD -->
      <div v-if="view === 'dashboard'" class="animate-fade-in">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
          <div>
            <h1 class="text-2xl font-bold mb-2 text-white">Библиотека тестов</h1>
            <p class="text-zinc-500 text-sm">Выберите категорию и начните проверку знаний</p>
          </div>
          <button @click="fetchTests" :disabled="loading" class="text-xs text-zinc-500 hover:text-amber-500 flex items-center gap-1 transition disabled:opacity-50">
            <svg :class="{'animate-spin': loading}" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            {{ loading ? 'Загрузка...' : 'Обновить список' }}
          </button>
        </div>
        
        <!-- Category Filter Component -->
        <CategoryFilter 
          :tests="tests" 
          :selected-category="selectedCategory" 
          @select="setCategory" 
        />

        <div v-if="loading && tests.length === 0" class="text-center py-20 text-zinc-500 animate-pulse">
          Загрузка тестов с сервера...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Test Card Component -->
          <TestCard 
            v-for="test in filteredTests" 
            :key="test.id" 
            :test="test" 
            @start="startTest" 
          />

          <!-- Empty State -->
          <div v-if="filteredTests.length === 0" class="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
            <div class="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-3 text-zinc-600">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <p class="text-zinc-400 font-medium">Тесты не найдены</p>
            <p class="text-xs text-zinc-600 mt-1">Попробуйте выбрать другую категорию или обновить страницу.</p>
          </div>
        </div>
      </div>

      <!-- VIEW: PLAYER -->
      <div v-if="view === 'player' && activeTest">
        <QuizPlayer 
          :test="activeTest" 
          @quit="quitTest" 
          @restart="restartTest" 
          @finish="view = 'dashboard'" 
        />
      </div>

    </main>
  </div>
</template>

<script setup>
import CategoryFilter from '@/components/CategoryFilter.vue'
import Header from '@/components/Header.vue'
import QuizPlayer from '@/components/QuizPlayer.vue'
import TestCard from '@/components/TestCard.vue'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const view = ref('dashboard')
const tests = ref([])
const loading = ref(true)
const selectedCategory = ref(null)
const activeTest = ref(null)

// --- API ---
const fetchTests = async () => {
  loading.value = true
  try {
    // Имитация задержки сети для демонстрации лоадера
    // await new Promise(r => setTimeout(r, 800)) 
    
    const res = await fetch('/api/tests')
    if (!res.ok) throw new Error('Network response was not ok')
    const data = await res.json()
    tests.value = data
  } catch (error) {
    console.error("Ошибка загрузки тестов:", error)
    // Fallback данные если API нет
    tests.value = [
      {
        id: 1,
        title: "Основы JavaScript",
        category: "Программирование",
        description: "Проверьте свои знания базового синтаксиса JS.",
        shuffle: true,
        questions: [
          { type: 'choice', text: 'Какой тип данных у значения "Hello"?', options: ['Number', 'String', 'Boolean'], correctAnswer: 'String' },
          { type: 'input', text: 'Напишите команду для вывода в консоль.', correctAnswer: 'console.log' }
        ]
      },
      {
        id: 2,
        title: "История Древнего Рима",
        category: "История",
        description: "Тест на знание дат и правителей.",
        shuffle: false,
        questions: [
          { type: 'choice', text: 'Кто был первым императором Рима?', options: ['Юлий Цезарь', 'Август', 'Нерон'], correctAnswer: 'Август' }
        ]
      }
    ]
  } finally {
    loading.value = false
  }
}

// --- LOGIC ---
const filteredTests = computed(() => {
  if (!selectedCategory.value) return tests.value
  return tests.value.filter(t => t.category === selectedCategory.value)
})

const setCategory = (cat) => {
  selectedCategory.value = cat
}

const startTest = (test) => {
  activeTest.value = test
  view.value = 'player'
}

const restartTest = () => {
  // Просто сбрасываем состояние внутри QuizPlayer через ключ или пропсы, 
  // но здесь мы просто оставляем activeTest тем же, а QuizPlayer сам обработает рестарт по событию
}

const quitTest = () => {
  if(confirm('Вы уверены, что хотите прервать тест? Прогресс будет потерян.')) {
    view.value = 'dashboard'
    activeTest.value = null
  }
}

onMounted(() => {
  fetchTests()
})
</script>

<style>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>