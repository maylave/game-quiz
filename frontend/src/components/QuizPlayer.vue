<template>
  <div class="max-w-2xl mx-auto animate-fade-in">
    <div class="bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
      
      <!-- Header -->
      <header class="flex items-center justify-between px-6 py-4 border-b border-zinc-700 bg-zinc-800">
        <div>
          <p class="text-sm font-bold text-zinc-100">{{ test.title }}</p>
          <p class="text-xs text-zinc-500">Вопрос {{ currentIndex + 1 }} из {{ questions.length }}</p>
        </div>
        <button @click="$emit('quit')" class="text-xs text-zinc-500 hover:text-red-400 transition-colors font-medium">Прервать</button>
      </header>
      
      <!-- Progress -->
      <div class="h-1 bg-zinc-700">
        <div class="h-full bg-amber-500 transition-all duration-500" :style="{ width: progressPercent + '%' }"></div>
      </div>

      <div class="p-6 min-h-[300px] flex flex-col">
        
        <!-- Results Screen -->
        <div v-if="isFinished" class="text-center py-8 animate-fade-in flex-1 flex flex-col justify-center">
          <div class="w-24 h-24 rounded-full bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
            <span class="text-4xl font-black text-amber-500">{{ score }}%</span>
          </div>
          <h2 class="text-2xl font-bold mb-2 text-white">Тест завершен!</h2>
          <p class="text-zinc-400 mb-8">Вы ответили правильно на <span class="text-amber-500 font-bold">{{ scoreCount }}</span> из {{ questions.length }} вопросов.</p>
          
          <div class="flex gap-3 justify-center">
            <button @click="$emit('restart')" class="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg transition">
              Повторить
            </button>
            <button @click="$emit('finish')" class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold rounded-lg transition shadow-lg shadow-amber-500/20">
              К списку тестов
            </button>
          </div>
        </div>

        <!-- Question Screen -->
        <div v-else class="flex-1 flex flex-col">
          <div class="mb-6">
            <span class="inline-block mb-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-zinc-700 text-zinc-400 border border-zinc-600">
              {{ currentQ.type === 'choice' ? 'Выбор ответа' : currentQ.type === 'input' ? 'Текстовый ответ' : 'Сортировка' }}
            </span>
            <p class="text-xl leading-relaxed text-zinc-100 font-medium" v-html="currentQ.text"></p>
          </div>

          <!-- Input Type -->
          <div v-if="currentQ.type === 'input'" class="flex flex-col gap-2 mb-6">
            <label class="text-xs text-zinc-500 uppercase font-bold">Ваш ответ:</label>
            <input 
              v-model="userAnswer" 
              @keyup.enter="checkAnswer" 
              :disabled="answered" 
              type="text" 
              placeholder="Введите текст..." 
              class="w-full bg-zinc-900 border border-zinc-700 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg px-4 py-3 text-amber-400 font-mono outline-none disabled:opacity-50 transition-all"
              :class="answered && !isCorrect ? 'border-red-500 bg-red-950/20 text-red-400' : ''"
            >
          </div>

          <!-- Choice Type -->
          <div v-if="currentQ.type === 'choice'" class="grid grid-cols-1 gap-3 mb-6">
            <button 
              v-for="(opt, i) in currentQ.options" 
              :key="i" 
              @click="selectOption(opt)" 
              :disabled="answered"
              class="text-left px-4 py-3.5 rounded-lg border transition-all font-medium text-sm relative overflow-hidden flex items-center"
              :class="getOptionClass(opt)">
              <span class="relative z-10">{{ opt }}</span>
            </button>
          </div>

          <!-- Drag Type -->
          <div v-if="currentQ.type === 'drag'" class="flex flex-col gap-3 mb-6">
            <label class="text-xs text-zinc-500 uppercase font-bold">Расставьте элементы в правильном порядке:</label>
            <div 
              v-for="(item, i) in dragItems" 
              :key="item.id" 
              draggable="true"
              @dragstart="onDragStart(i)" 
              @dragover.prevent="onDragOver(i)" 
              @dragend="onDragEnd"
              class="flex items-center gap-3 px-4 py-3 rounded-lg border bg-zinc-900 border-zinc-700 cursor-move hover:border-zinc-500 transition select-none group"
              :class="answered ? (isDragCorrect(i) ? 'border-emerald-500 bg-emerald-950/20 text-emerald-400' : 'border-red-500 bg-red-950/20 text-red-400') : ''">
               <svg width="16" height="16" viewBox="0 0 24 24" class="text-zinc-600 shrink-0 group-hover:text-zinc-400"><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="15" cy="12" r="2"/><circle cx="9" cy="19" r="2"/><circle cx="15" cy="19" r="2"/></svg>
               <span class="font-mono text-base">{{ item.value }}</span>
            </div>
            <div v-if="answered && !isCorrect" class="mt-2 p-3 bg-zinc-900/50 rounded border border-zinc-800">
               <p class="text-xs text-zinc-500 mb-1">Правильный порядок:</p>
               <p class="text-sm text-emerald-400 font-mono">{{ currentQ.correctOrder.join(' → ') }}</p>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="mt-auto pt-6 border-t border-zinc-700 flex items-center justify-between">
            <div v-if="answered" class="text-sm font-bold flex items-center gap-2 animate-fade-in" :class="isCorrect ? 'text-emerald-400' : 'text-red-400'">
              <span v-if="isCorrect">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span v-else>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </span>
              {{ isCorrect ? 'Верно!' : 'Неверно' }}
            </div>
            <div class="flex-1"></div>
            
            <button v-if="!answered" @click="checkAnswer" :disabled="!canCheck"
              class="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed text-zinc-900 font-bold rounded-lg transition shadow-lg shadow-amber-500/20 flex items-center gap-2">
              Проверить ответ
            </button>
            
            <button v-else @click="nextQuestion"
              class="px-6 py-2.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold rounded-lg transition flex items-center gap-2 hover:translate-x-1 transform duration-200">
              {{ currentIndex + 1 === questions.length ? 'Завершить тест' : 'Следующий вопрос' }}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  test: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['quit', 'restart', 'finish'])

// --- STATE ---
const questions = ref([])
const currentIndex = ref(0)
const userAnswer = ref('')
const answered = ref(false)
const isCorrect = ref(false)
const scoreCount = ref(0)
const dragItems = ref([])
let dragSrcIndex = null

// --- FUNCTIONS DECLARED BEFORE WATCH TO AVOID TDZ ERROR ---

const resetQuestionState = () => {
  userAnswer.value = ''
  answered.value = false
  isCorrect.value = false
  
  if (currentQ.value && currentQ.value.type === 'drag') {
    const original = currentQ.value.correctOrder
    // Клонируем и перемешиваем
    const shuffled = [...original].sort(() => Math.random() - 0.5)
    dragItems.value = shuffled.map((val, i) => ({ id: i, value: val }))
  }
}

const startTestLogic = (test) => {
  if (!test || !test.questions) return
  
  let qs = [...test.questions]
  if (test.shuffle) {
    qs.sort(() => Math.random() - 0.5)
  }
  questions.value = qs
  currentIndex.value = 0
  scoreCount.value = 0
  resetQuestionState()
}

// --- WATCH ---
// Теперь startTestLogic объявлена выше, поэтому ошибки не будет
watch(() => props.test, (newTest) => {
  if (newTest) {
    startTestLogic(newTest)
  }
}, { immediate: true })

// --- COMPUTED ---
const currentQ = computed(() => questions.value[currentIndex.value] || {})
const isFinished = computed(() => questions.value.length > 0 && currentIndex.value >= questions.value.length)
const progressPercent = computed(() => {
  if (!questions.value.length) return 0
  return ((currentIndex.value) / questions.value.length) * 100
})
const score = computed(() => questions.value.length ? Math.round((scoreCount.value / questions.value.length) * 100) : 0)
const canCheck = computed(() => {
  if (!currentQ.value) return false
  if (currentQ.value.type === 'drag') return true
  return !!userAnswer.value
})

// --- ACTIONS ---
const selectOption = (opt) => {
  if (!answered.value) userAnswer.value = opt
}

const getOptionClass = (opt) => {
  if (!answered.value) {
    return userAnswer.value === opt 
      ? 'border-amber-500 bg-amber-950/40 text-amber-300 ring-1 ring-amber-500/50' 
      : 'border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:bg-zinc-800'
  }
  if (opt === currentQ.value.correctAnswer) return 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50'
  if (opt === userAnswer.value) return 'border-red-500 bg-red-950/40 text-red-300 ring-1 ring-red-500/50'
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
  currentIndex.value++
  if (currentIndex.value < questions.value.length) {
    resetQuestionState()
  }
}
</script>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>