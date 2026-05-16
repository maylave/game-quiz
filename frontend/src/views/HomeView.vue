<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30">
    <!-- Dot grid bg -->
    <div class="fixed inset-0 opacity-20 pointer-events-none"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>

    <!-- Top nav -->
  <Header :student-name="studentName" :is-active="true" @logout="logout" />

    <!-- Main Content Area -->
    <main class="max-w-5xl mx-auto px-6 py-8 relative z-10">


    </main>
  </div>
</template>

<script setup>
import Header from '@/components/Header.vue'
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

// --- API FUNCTIONS ---
const fetchTests = async () => {
  loading.value = true
  try {
    // Запрос к нашему Python API
    const res = await fetch('/api/tests')
    if (!res.ok) throw new Error('Network response was not ok')
    const data = await res.json()
    tests.value = data
  } catch (error) {
    console.error("Ошибка загрузки тестов:", error)
    tests.value = []
  } finally {
    loading.value = false
  }
}

// --- AUTH CHECK & INIT ---
onMounted(async () => {
  const name = localStorage.getItem('tempStudentName')
  
  if (!name) {
    router.push('/login')
    return
  }
  
  studentName.value = name
  
  // Загружаем тесты с сервера при старте
  await fetchTests()
})

// --- LOGOUT ACTION ---
const logout = () => {
  localStorage.removeItem('tempStudentName')
  router.push('/login')
}

// --- ACTIONS: PLAYER ---
const startTest = (test) => {
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
  if(activeTest.value) startTest(activeTest.value)
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