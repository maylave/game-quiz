<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30">
    <!-- Dot grid bg -->
    <div class="fixed inset-0 opacity-20 pointer-events-none"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>

    <!-- Top nav -->
    <header class="sticky top-0 z-40 border-b border-zinc-700 bg-zinc-900/90 backdrop-blur">
      <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        <div class="flex items-center gap-3 cursor-pointer" @click="currentView = 'dashboard'">
          <div class="w-7 h-7 rounded-md bg-indigo-500 flex items-center justify-center shrink-0">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-white">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          <span class="text-sm font-bold tracking-tight">Quiz Admin</span>
        </div>

        <div class="flex items-center gap-2">
          <!-- Navigation Buttons -->
          <button v-if="currentView !== 'dashboard'" @click="currentView = 'dashboard'"
            class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 transition-colors">
            К списку тестов
          </button>
          
          <div v-if="currentView === 'dashboard'" class="flex gap-2">
             <button @click="exportAllData" class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition">
               Экспорт БД
             </button>
             <label class="text-xs font-semibold px-3 py-1.5 rounded-lg border border-zinc-700 text-zinc-400 hover:text-zinc-200 transition cursor-pointer">
               Импорт БД
               <input type="file" accept=".json" class="hidden" @change="importAllData">
             </label>
             <button @click="createNewTest" class="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Новый тест
             </button>
             
             <!-- Logout Button for Admin -->
             <button @click="logout" 
               class="ml-4 flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-red-900/50 text-red-400 hover:bg-red-950/30 transition-colors">
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
      <div v-if="currentView === 'dashboard'" class="animate-fade-in">
        <h1 class="text-2xl font-bold mb-6">Управление тестами</h1>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <!-- Test Card -->
          <div v-for="test in tests" :key="test.id" 
            class="bg-zinc-800 border border-zinc-700 rounded-xl p-5 flex flex-col gap-4 hover:border-zinc-500 transition group relative overflow-hidden">
            
            <div class="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-zinc-800/90 backdrop-blur rounded-bl-xl">
               <button @click.stop="editTest(test.id)" class="text-zinc-400 hover:text-indigo-400" title="Редактировать">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
               </button>
               <button @click.stop="deleteTest(test.id)" class="text-zinc-400 hover:text-red-400" title="Удалить">
                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
               </button>
            </div>

            <div>
              <h3 class="font-bold text-lg text-zinc-100">{{ test.title }}</h3>
              <p class="text-xs text-zinc-500 mt-1 line-clamp-2">{{ test.description || 'Нет описания' }}</p>
            </div>
            
            <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono">
              <span class="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {{ test.questions.length }} вопр.
              </span>
              <span v-if="test.shuffle" class="text-amber-500/80 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
                Random
              </span>
            </div>

            <button @click="previewTest(test.id)" 
              class="mt-auto w-full py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-sm font-bold transition-all">
              Предпросмотр
            </button>
          </div>

          <!-- Empty State -->
          <div v-if="tests.length === 0" class="col-span-full py-20 text-center border-2 border-dashed border-zinc-800 rounded-xl">
            <p class="text-zinc-500">Список тестов пуст. Создайте первый тест или импортируйте базу!</p>
          </div>
        </div>
      </div>

      <!-- VIEW: EDITOR (Create/Edit Test) -->
      <div v-if="currentView === 'editor'" class="animate-fade-in">
        <div class="mb-6 bg-zinc-800 border border-zinc-700 p-4 rounded-xl flex flex-col gap-3">
          <input v-model="editingTest.title" placeholder="Название теста (например: HTML Basics)" 
            class="bg-transparent text-xl font-bold text-zinc-100 outline-none placeholder-zinc-600 w-full">
          <textarea v-model="editingTest.description" placeholder="Описание теста..." rows="2"
            class="bg-transparent text-sm text-zinc-400 outline-none resize-none w-full"></textarea>
          
          <div class="flex items-center gap-3 pt-2 border-t border-zinc-700/50">
            <label class="flex items-center gap-2 cursor-pointer select-none">
              <div class="relative">
                <input type="checkbox" v-model="editingTest.shuffle" class="sr-only peer">
                <div class="w-9 h-5 bg-zinc-700 rounded-full peer-checked:bg-indigo-500 transition-colors"></div>
                <div class="absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform peer-checked:translate-x-4"></div>
              </div>
              <span class="text-xs font-medium text-zinc-400">Случайный порядок вопросов</span>
            </label>
          </div>
        </div>

        <!-- Question List in Editor -->
        <div class="flex flex-col gap-3">
          <div v-for="(q, qi) in editingTest.questions" :key="q.id"
            class="bg-zinc-800 border rounded-xl overflow-hidden transition-all duration-200"
            :class="editingQuestionId === q.id ? 'border-indigo-500/60' : 'border-zinc-700'">
            
            <!-- Header Row -->
            <div class="flex items-center gap-4 px-5 py-3.5 cursor-pointer select-none" @click="toggleEditQuestion(q.id)">
              <span class="w-6 h-6 flex items-center justify-center rounded bg-zinc-900 border border-zinc-700 text-[10px] font-black text-zinc-500 shrink-0 font-mono">
                {{ qi + 1 }}
              </span>
              <span class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded font-mono shrink-0"
                :class="{
                  'bg-blue-950 text-blue-400': q.type === 'input',
                  'bg-violet-950 text-violet-400': q.type === 'choice',
                  'bg-orange-950 text-orange-400': q.type === 'drag',
                }">{{ q.type }}</span>
              <p class="text-sm text-zinc-300 truncate flex-1" v-html="stripHtml(q.text) || '(без текста)'"></p>
              
              <div class="flex items-center gap-1 shrink-0" @click.stop>
                <button @click="moveQuestion(qi, -1)" :disabled="qi===0" class="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 disabled:opacity-20"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"/></svg></button>
                <button @click="moveQuestion(qi, 1)" :disabled="qi===editingTest.questions.length-1" class="p-1.5 rounded hover:bg-zinc-700 text-zinc-500 disabled:opacity-20"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button>
                <button @click="duplicateQuestion(qi)" class="p-1.5 rounded hover:bg-zinc-700 text-zinc-500"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg></button>
                <button @click="deleteQuestion(qi)" class="p-1.5 rounded hover:bg-red-950 text-zinc-500 hover:text-red-400"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg></button>
              </div>
            </div>

            <!-- Edit Panel -->
            <div v-if="editingQuestionId === q.id" class="border-t border-zinc-700 p-5 flex flex-col gap-4 bg-zinc-900/40">
              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Текст вопроса</label>
                <textarea v-model="q.text" rows="2" class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm text-zinc-200 outline-none resize-none transition-colors placeholder-zinc-700"></textarea>
              </div>

              <div class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Тип</label>
                <div class="flex gap-2">
                  <button v-for="t in ['input', 'choice', 'drag']" :key="t" @click="changeType(q, t)"
                    class="px-4 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer font-mono"
                    :class="q.type === t ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-500'">
                    {{ t }}
                  </button>
                </div>
              </div>

              <!-- INPUT Logic -->
              <div v-if="q.type === 'input'" class="flex flex-col gap-1.5">
                <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Ответ</label>
                <input v-model="q.correctAnswer" type="text" class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-4 py-2.5 text-sm text-indigo-400 font-mono outline-none" placeholder="ответ">
              </div>

              <!-- CHOICE Logic -->
              <div v-if="q.type === 'choice'" class="flex flex-col gap-3">
                <div v-for="(opt, oi) in q.options" :key="oi" class="flex items-center gap-2">
                  <button @click="q.correctAnswer = opt"
                    class="shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors"
                    :class="q.correctAnswer === opt ? 'border-indigo-500 bg-indigo-500' : 'border-zinc-600 hover:border-zinc-400'">
                    <span v-if="q.correctAnswer === opt" class="w-1.5 h-1.5 rounded-full bg-zinc-900"></span>
                  </button>
                  <input v-model="q.options[oi]" type="text" class="flex-1 bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-zinc-200 font-mono outline-none" />
                  <button @click="removeOption(q, oi)" class="p-1.5 text-zinc-600 hover:text-red-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                </div>
                <button @click="addOption(q)" class="text-xs text-zinc-500 hover:text-zinc-200 w-fit">+ Добавить вариант</button>
              </div>

              <!-- DRAG Logic -->
              <div v-if="q.type === 'drag'" class="flex flex-col gap-3">
                 <label class="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-bold">Правильный порядок</label>
                 <div v-for="(item, ii) in q.correctOrder" :key="'co'+ii" class="flex items-center gap-2">
                    <span class="text-xs text-zinc-500 font-mono w-4">{{ ii+1 }}</span>
                    <input v-model="q.correctOrder[ii]" type="text" class="flex-1 bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-3 py-1.5 text-sm text-zinc-200 font-mono outline-none" />
                    <button @click="removeDragItem(q, 'correctOrder', ii)" class="p-1.5 text-zinc-600 hover:text-red-400"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                 </div>
                 <button @click="addDragItem(q, 'correctOrder')" class="text-xs text-zinc-500 hover:text-zinc-200 w-fit">+ Элемент</button>
                 <div class="pt-2 border-t border-zinc-700/50 flex justify-between items-center">
                    <span class="text-xs text-zinc-600">Студент увидит перемешанный список автоматически.</span>
                 </div>
              </div>
            </div>
          </div>

          <button @click="addQuestion" class="w-full py-4 border-2 border-dashed border-zinc-700 rounded-xl text-zinc-500 hover:border-indigo-500 hover:text-indigo-500 transition flex items-center justify-center gap-2 font-bold text-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Добавить вопрос
          </button>
        </div>
      </div>

      <!-- VIEW: PLAYER (Preview Mode for Admin) -->
      <div v-if="currentView === 'player'" class="max-w-2xl mx-auto animate-fade-in">
        <div class="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
          <!-- Player Header -->
          <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-800">
            <div>
              <p class="text-sm font-bold text-zinc-100">{{ activeTest?.title }} <span class="text-xs text-zinc-500 font-normal">(Предпросмотр)</span></p>
              <p class="text-xs text-zinc-500">Вопрос {{ currentQIndex + 1 }} из {{ activeQuestions.length }}</p>
            </div>
            <button @click="quitTest" class="text-xs text-zinc-500 hover:text-red-400">Закрыть</button>
          </header>
          
          <!-- Progress Bar -->
          <div class="h-1 bg-zinc-700">
            <div class="h-full bg-indigo-500 transition-all duration-500" :style="{ width: ((currentQIndex) / activeQuestions.length) * 100 + '%' }"></div>
          </div>

          <div class="p-6 min-h-[300px]">
            <!-- Results Screen -->
            <div v-if="isFinished" class="text-center py-8 animate-fade-in">
              <div class="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl font-black text-indigo-500">{{ score }}%</span>
              </div>
              <h2 class="text-2xl font-bold mb-2">Предпросмотр завершен</h2>
              <p class="text-zinc-400 mb-6">Вы ответили правильно на {{ scoreCount }} из {{ activeQuestions.length }} вопросов.</p>
              <button @click="currentView = 'dashboard'" class="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition">Вернуться к редактированию</button>
            </div>

            <!-- Question Screen -->
            <div v-else>
              <span class="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-700 text-zinc-400">
                {{ currentQ.type }}
              </span>
              <p class="text-lg leading-relaxed text-zinc-200 mb-6" v-html="currentQ.text"></p>

              <!-- Input Type -->
              <div v-if="currentQ.type === 'input'" class="flex flex-col gap-2">
                <input v-model="userAnswer" @keyup.enter="checkAnswer" :disabled="answered" type="text" placeholder="Ваш ответ..." 
                  class="w-full bg-zinc-900 border border-zinc-700 focus:border-indigo-500 rounded-lg px-4 py-3 text-indigo-400 font-mono outline-none disabled:opacity-50"
                  :class="answered && !isCorrect ? 'border-red-500 bg-red-950/20' : ''">
              </div>

              <!-- Choice Type -->
              <div v-if="currentQ.type === 'choice'" class="grid grid-cols-1 gap-2">
                <button v-for="(opt, i) in currentQ.options" :key="i" @click="selectOption(opt)" :disabled="answered"
                  class="text-left px-4 py-3 rounded-lg border transition-all font-mono text-sm"
                  :class="getOptionClass(opt)">
                  {{ opt }}
                </button>
              </div>

              <!-- Drag Type -->
              <div v-if="currentQ.type === 'drag'" class="flex flex-col gap-2">
                <div v-for="(item, i) in dragItems" :key="item.id" draggable="true"
                  @dragstart="onDragStart(i)" @dragover.prevent="onDragOver(i)" @dragend="onDragEnd"
                  class="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-zinc-900 border-zinc-700 cursor-move hover:border-zinc-500 transition select-none"
                  :class="answered ? (isDragCorrect(i) ? 'border-emerald-500 bg-emerald-950/20' : 'border-red-500 bg-red-950/20') : ''">
                   <svg width="12" height="12" viewBox="0 0 24 24" class="text-zinc-600"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
                   <span class="font-mono text-sm">{{ item.value }}</span>
                </div>
                <p v-if="answered && !isCorrect" class="text-xs text-red-400 mt-2">Правильно: {{ currentQ.correctOrder.join(' → ') }}</p>
              </div>

              <!-- Feedback & Next Button -->
              <div class="mt-8 flex items-center justify-between border-t border-zinc-700 pt-4">
                <div v-if="answered" class="text-sm font-bold" :class="isCorrect ? 'text-emerald-400' : 'text-red-400'">
                  {{ isCorrect ? 'Верно!' : 'Ошибка' }}
                </div>
                <div class="flex-1"></div>
                
                <button v-if="!answered" @click="checkAnswer" :disabled="!canCheck"
                  class="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-bold rounded-lg transition">
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- STATE MANAGEMENT ---
const currentView = ref('dashboard') // dashboard, editor, player

// Data Structure: Array of Tests
const tests = ref([
  {
    id: 'default-html',
    title: 'HTML Основы',
    description: 'Базовые вопросы по структуре HTML документа.',
    shuffle: false,
    questions: [
      { id: 1, text: 'Какой тег используется для самого крупного заголовка?', type: 'input', correctAnswer: 'h1' },
      { id: 2, text: 'Выберите тег для нумерованного списка:', type: 'choice', options: ['<ul>', '<ol>', '<li>'], correctAnswer: '<ol>' },
      { id: 3, text: 'Расставьте структуру документа:', type: 'drag', correctOrder: ['<html>', '<head>', '<body>'], shuffled: [] }
    ]
  }
])

// Editor State
const editingTest = reactive({ id: null, title: '', description: '', shuffle: false, questions: [] })
const editingQuestionId = ref(null)

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
  if (currentQ.value.type === 'drag') return true // Always checkable
  return !!userAnswer.value
})

// --- AUTH CHECK ---
onMounted(() => {
  const role = localStorage.getItem('userRole')
  if (role !== 'admin') {
    router.push('/login')
  }
})

// --- LOGOUT ACTION ---
const logout = () => {
  localStorage.removeItem('tempStudentName')
  localStorage.removeItem('userRole')
  router.push('/login')
}

// --- ACTIONS: DASHBOARD ---
const createNewTest = () => {
  const newTest = {
    id: Date.now().toString(),
    title: 'Новый тест',
    description: '',
    shuffle: false,
    questions: []
  }
  tests.value.push(newTest)
  editTest(newTest.id)
}

const editTest = (id) => {
  const test = tests.value.find(t => t.id === id)
  if (!test) return
  Object.assign(editingTest, JSON.parse(JSON.stringify(test)))
  currentView.value = 'editor'
  editingQuestionId.value = null
}

const deleteTest = (id) => {
  if(confirm('Удалить этот тест?')) {
    tests.value = tests.value.filter(t => t.id !== id)
  }
}

const saveCurrentTest = () => {
  const idx = tests.value.findIndex(t => t.id === editingTest.id)
  if (idx !== -1) {
    tests.value[idx] = JSON.parse(JSON.stringify(editingTest))
  }
}

// Watch editingTest to auto-save changes
watch(editingTest, () => {
  if (currentView.value === 'editor') saveCurrentTest()
}, { deep: true })


// --- ACTIONS: EDITOR ---
const addQuestion = () => {
  editingTest.questions.push({
    id: Date.now(),
    text: '',
    type: 'input',
    correctAnswer: ''
  })
  editingQuestionId.value = editingTest.questions[editingTest.questions.length - 1].id
}

const toggleEditQuestion = (id) => {
  editingQuestionId.value = editingQuestionId.value === id ? null : id
}

const moveQuestion = (index, direction) => {
  const arr = editingTest.questions
  if (index + direction < 0 || index + direction >= arr.length) return
  ;[arr[index], arr[index + direction]] = [arr[index + direction], arr[index]]
}

const duplicateQuestion = (index) => {
  const copy = JSON.parse(JSON.stringify(editingTest.questions[index]))
  copy.id = Date.now()
  editingTest.questions.splice(index + 1, 0, copy)
}

const deleteQuestion = (index) => {
  editingTest.questions.splice(index, 1)
}

const changeType = (q, type) => {
  q.type = type
  if (type === 'choice') {
    q.options = ['Вариант 1', 'Вариант 2']
    q.correctAnswer = 'Вариант 1'
  } else if (type === 'drag') {
    q.correctOrder = ['Элемент 1', 'Элемент 2', 'Элемент 3']
  } else {
    delete q.options
    delete q.correctOrder
    q.correctAnswer = ''
  }
}

const addOption = (q) => q.options.push('Новый вариант')
const removeOption = (q, i) => {
  q.options.splice(i, 1)
  if (q.correctAnswer === q.options[i]) q.correctAnswer = q.options[0] || ''
}

const addDragItem = (q) => q.correctOrder.push('Новый элемент')
const removeDragItem = (q, key, i) => q[key].splice(i, 1)

const stripHtml = (str) => (str || '').replace(/<[^>]*>/g, '')


// --- ACTIONS: PLAYER (PREVIEW) ---
const previewTest = (id) => {
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
  currentView.value = 'player'
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
  currentView.value = 'dashboard'
}

const selectOption = (opt) => {
  if (!answered.value) userAnswer.value = opt
}

const getOptionClass = (opt) => {
  if (!answered.value) {
    return userAnswer.value === opt 
      ? 'border-indigo-500 bg-indigo-950/40 text-indigo-300' 
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

// --- IMPORT / EXPORT ---
const exportAllData = () => {
  const blob = new Blob([JSON.stringify(tests.value, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'tests.json' // Имя файла для public папки
  a.click()
}

const importAllData = (e) => {
  const file = e.target.files[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (ev) => {
    try {
      const parsed = JSON.parse(ev.target.result)
      if (Array.isArray(parsed)) {
        tests.value = parsed
        alert('База данных успешно загружена!')
      }
    } catch (err) {
      alert('Ошибка файла')
    }
  }
  reader.readAsText(file)
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