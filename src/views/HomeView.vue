<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30">
    <!-- Dot grid bg -->
    <div class="fixed inset-0 opacity-20 pointer-events-none"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>

    <!-- Top nav -->
    <header class="sticky top-0 z-40 border-b border-zinc-700 bg-zinc-900/90 backdrop-blur">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" @click="view = 'dashboard'">
          <div class="w-7 h-7 rounded-md bg-amber-500 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-zinc-900">
              <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <span class="text-sm font-bold tracking-tight">Quiz Student</span>
        </div>

        <div class="flex items-center gap-4">
          <!-- Student Name Display -->
          <div v-if="studentName" class="flex items-center gap-2">
             <div class="text-right hidden sm:block">
               <p class="text-xs text-zinc-400 leading-none">Студент</p>
               <p class="text-sm font-bold text-zinc-200 leading-none mt-0.5">{{ studentName }}</p>
             </div>
             
             <!-- Logout Button -->
             <button @click="logout" 
               class="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-900/50 hover:bg-red-950/30 transition-colors ml-2">
               <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                 <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                 <polyline points="16 17 21 12 16 7"/>
                 <line x1="21" y1="12" x2="9" y2="12"/>
               </svg>
               Выйти
             </button>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content Area -->
    <main class="max-w-5xl mx-auto px-6 py-8 relative z-10">

      <!-- VIEW: DASHBOARD (List of Tests) -->
      <div v-if="view === 'dashboard'" class="animate-fade-in">
        <div class="flex justify-between items-end mb-6">
          <div>
            <h1 class="text-2xl font-bold mb-2">Доступные тесты</h1>
            <p class="text-zinc-500 text-sm">Выберите тему для прохождения:</p>
          </div>
          <!-- Кнопка принудительного обновления (если обновили файл на сервере) -->
          <button @click="loadTestsFromPublic" class="text-xs text-zinc-500 hover:text-amber-500 flex items-center gap-1 transition">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>
            Обновить список
          </button>
        </div>
        
        <div v-if="loading" class="text-center py-10 text-zinc-500 animate-pulse">
          Загрузка тестов...
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Test Card -->
          <div v-for="test in tests" :key="test.id" 
            class="bg-zinc-800 border border-zinc-700 rounded-xl p-5 flex flex-col gap-4 hover:border-amber-500/50 transition group relative overflow-hidden shadow-lg hover:shadow-amber-500/10">
            
            <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
               <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="text-zinc-100"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>

            <div>
              <h3 class="font-bold text-lg text-zinc-100">{{ test.title }}</h3>
              <p class="text-xs text-zinc-500 mt-1 line-clamp-2 min-h-[2.5em]">{{ test.description || 'Описание отсутствует' }}</p>
            </div>
            
            <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-1">
              <span class="flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ test.questions.length }} вопр.
              </span>
              <span v-if="test.shuffle" class="text-amber-500/80 flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                Random
              </span>
            </div>

            <button @click="startTest(test.id)" 
              class="mt-auto w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-amber-500 hover:text-zinc-900 text-zinc-200 text-sm font-bold transition-all flex items-center justify-center gap-2">
              <span>Начать</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="tests.length === 0" class="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <p class="text-zinc-500">Нет доступных тестов.</p>
            <p class="text-xs text-zinc-600 mt-2">Убедитесь, что файл public/tests.json существует.</p>
          </div>
        </div>
      </div>

      <!-- VIEW: PLAYER (Taking the Test) -->
      <div v-if="view === 'player'" class="max-w-2xl mx-auto animate-fade-in">
        <div class="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <!-- Player Header -->
          <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-800">
            <div>
              <p class="text-sm font-bold text-zinc-100">{{ activeTest?.title }}</p>
              <p class="text-xs text-zinc-500">Вопрос {{ currentQIndex + 1 }} из {{ activeQuestions.length }}</p>
            </div>
            <button @click="quitTest" class="text-xs text-zinc-500 hover:text-red-400 transition-colors">Прервать</button>
          </header>
          
          <!-- Progress Bar -->
          <div class="h-1 bg-zinc-700">
            <div class="h-full bg-amber-500 transition-all duration-500" :style="{ width: ((currentQIndex) / activeQuestions.length) * 100 + '%' }"></div>
          </div>

          <div class="p-6 min-h-[300px]">
            <!-- Results Screen -->
            <div v-if="isFinished" class="text-center py-8 animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl font-black text-amber-500">{{ score }}%</span>
              </div>
              <h2 class="text-2xl font-bold mb-2">Тест завершен!</h2>
              <p class="text-zinc-400 mb-6">Вы ответили правильно на {{ scoreCount }} из {{ activeQuestions.length }} вопросов.</p>
              
              <div class="flex gap-3 justify-center">
                <button @click="restartTest" class="px-6 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg transition">
                  Повторить
                </button>
                <button @click="view = 'dashboard'" class="px-6 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-lg transition">
                  К списку
                </button>
              </div>
            </div>

            <!-- Question Screen -->
            <div v-else>
              <span class="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-700 text-zinc-400">
                {{ currentQ.type }}
              </span>
              <p class="text-lg leading-relaxed text-zinc-200 mb-6" v-html="currentQ.text"></p>

              <!-- Input Type -->
              <div v-if="currentQ.type === 'input'" class="flex flex-col gap-2">
                <label class="text-xs text-zinc-500 uppercase font-bold">Ваш ответ:</label>
                <input v-model="userAnswer" @keyup.enter="checkAnswer" :disabled="answered" type="text" placeholder="Введите текст..." 
                  class="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-lg px-4 py-3 text-amber-400 font-mono outline-none disabled:opacity-50 transition-colors"
                  :class="answered && !isCorrect ? 'border-red-500 bg-red-950/20' : ''">
              </div>

              <!-- Choice Type -->
              <div v-if="currentQ.type === 'choice'" class="grid grid-cols-1 gap-2">
                <button v-for="(opt, i) in currentQ.options" :key="i" @click="selectOption(opt)" :disabled="answered"
                  class="text-left px-4 py-3 rounded-lg border transition-all font-mono text-sm relative overflow-hidden"
                  :class="getOptionClass(opt)">
                  {{ opt }}
                </button>
              </div>

              <!-- Drag Type -->
              <div v-if="currentQ.type === 'drag'" class="flex flex-col gap-2">
                <label class="text-xs text-zinc-500 uppercase font-bold mb-1">Расставьте в правильном порядке:</label>
                <div v-for="(item, i) in dragItems" :key="item.id" draggable="true"
                  @dragstart="onDragStart(i)" @dragover.prevent="onDragOver(i)" @dragend="onDragEnd"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-zinc-900 border-zinc-700 cursor-move hover:border-zinc-500 transition select-none"
                  :class="answered ? (isDragCorrect(i) ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' : 'border-red-500 bg-red-950/20 text-red-400') : ''">
                   <svg width="12" height="12" viewBox="0 0 24 24" class="text-zinc-600 shrink-0"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
                   <span class="font-mono text-sm">{{ item.value }}</span>
                </div>
                <p v-if="answered && !isCorrect" class="text-xs text-zinc-500 mt-2">
                  Правильный порядок: <span class="text-emerald-400 font-mono">{{ currentQ.correctOrder.join(' → ') }}</span>
                </p>
              </div>

              <!-- Feedback & Next Button -->
              <div class="mt-8 flex items-center justify-between border-t border-zinc-700 pt-4">
                <div v-if="answered" class="text-sm font-bold flex items-center gap-2" :class="isCorrect ? 'text-emerald-400' : 'text-red-400'">
                  <span v-if="isCorrect">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span v-else>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </span>
                  {{ isCorrect ? 'Верно!' : 'Ошибка' }}
                </div>
                <div class="flex-1"></div>
                
                <button v-if="!answered" @click="checkAnswer" :disabled="!canCheck"
                  class="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 text-zinc-900 font-bold rounded-lg transition shadow-lg shadow-amber-500/20">
                  Проверить
                </button>
                <button v-else @click="nextQuestion"
                  class="px-5 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg transition flex items-center gap-2">
                  {{ currentQIndex + 1 === activeQuestions.length ? 'Завершить' : 'Далее' }}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- STATE MANAGEMENT ---
const view = ref('dashboard')
const studentName = ref('')
const tests = ref([])
const loading = ref(true)

// Player State
const activeTest = ref(null)
const activeQuestions = ref([])
const currentQIndex = ref(0)
const userAnswer = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const scoreCount = ref(0)
const dragItems = ref([])
let dragSrcIndex = null

// --- COMPUTED ---
const currentQ = computed(() => activeQuestions.value[currentQIndex.value] || {})
const isFinished = computed(() => currentQIndex.value >= activeQuestions.value.length)
const score = computed(() => activeQuestions.value.length ? Math.round((scoreCount.value / activeQuestions.value.length) * 100) : 0)
const canCheck = computed(() => {
  if (currentQ.value.type === 'drag') return true
  return !!userAnswer.value
})

// --- LOAD TESTS FROM PUBLIC FOLDER ---
const loadTestsFromPublic = async () => {
  loading.value = true
  try {
    // Путь к файлу в папке public. 
    // Если файл лежит в public/tests.json, то путь просто '/tests.json'
    const response = await fetch('/tests.json')
    
    if (!response.ok) throw new Error('Файл не найден')
    
    const data = await response.json()
    if (Array.isArray(data)) {
      tests.value = data
    } else {
      console.error('Неверный формат JSON')
      tests.value = []
    }
  } catch (error) {
    console.error('Ошибка загрузки тестов:', error)
    // Если файла нет, можно оставить пустым или показать сообщение
    tests.value = [] 
  } finally {
    loading.value = false
  }
}

// --- AUTH CHECK ---
onMounted(async () => {
  const name = localStorage.getItem('tempStudentName')
  
  if (!name) {
    router.push('/login')
    return
  }
  
  studentName.value = name
  
  // Загружаем тесты при старте
  await loadTestsFromPublic()
})

// --- LOGOUT ACTION ---
const logout = () => {
  localStorage.removeItem('tempStudentName')
  router.push('/login')
}

// --- ACTIONS: PLAYER ---
const startTest = (id) => {
  const test = tests.value.find(t => t.id === id)
  if (!test) return
  
  activeTest.value = test
  let qs = [...test.questions]
  if (test.shuffle) {
    qs.sort(() => Math.random() - 0.5)
  }
  
  activeQuestions.value = qs
  currentQIndex.value = 0
  scoreCount.value = 0
  resetQuestionState()
  view.value = 'player'
}

const restartTest = () => {
  if(activeTest.value) startTest(activeTest.value.id)
}

const resetQuestionState = () => {
  userAnswer.value = ''
  answered.value = false
  isCorrect.value = false
  
  if (currentQ.value.type === 'drag') {
    const original = currentQ.value.correctOrder
    const shuffled = [...original].sort(() => Math.random() - 0.5)
    dragItems.value = shuffled.map((val, i) => ({ id: i, value: val }))
  }
}

const quitTest = () => {
  if(confirm('Вы уверены, что хотите прервать тест?')) {
    view.value = 'dashboard'
  }
}

const selectOption = (opt) => {
  if (!answered.value) userAnswer.value = opt
}

const getOptionClass = (opt) => {
  if (!answered.value) {
    return userAnswer.value === opt 
      ? 'border-amber-500 bg-amber-950/40 text-amber-300' 
      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500'
  }
  if (opt === currentQ.value.correctAnswer) return 'border-emerald-500 bg-emerald-950/40 text-emerald-300'
  if (opt === userAnswer.value) return 'border-red-500 bg-red-950/40 text-red-300'
  return 'border-zinc-800 bg-zinc-900 text-zinc-600 opacity-50'
}

// Drag Logic
const onDragStart = (i) => { dragSrcIndex = i }
const onDragOver = (i) => {
  if (dragSrcIndex === null || dragSrcIndex === i) return
  const items = [...dragItems.value]
  const [moved] = items.splice(dragSrcIndex, 1)
  items.splice(i, 0, moved)
  dragItems.value = items
  dragSrcIndex = i
}
const onDragEnd = () => { dragSrcIndex = null }

const isDragCorrect = (i) => {
  return dragItems.value[i]?.value === currentQ.value.correctOrder[i]
}

const checkAnswer = () => {
  if (currentQ.value.type === 'input') {
    isCorrect.value = userAnswer.value.trim().toLowerCase() === currentQ.value.correctAnswer.trim().toLowerCase()
  } else if (currentQ.value.type === 'choice') {
    isCorrect.value = userAnswer.value === currentQ.value.correctAnswer
  } else if (currentQ.value.type === 'drag') {
    const currentOrder = dragItems.value.map(i => i.value)
    isCorrect.value = JSON.stringify(currentOrder) === JSON.stringify(currentQ.value.correctOrder)
  }
  
  if (isCorrect.value) scoreCount.value++
  answered.value = true
}

const nextQuestion = () => {
  currentQIndex.value++
  if (currentQIndex.value < activeQuestions.value.length) {
    resetQuestionState()
  }
}
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