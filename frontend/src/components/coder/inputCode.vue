<script setup lang="ts">
import { useCodeIntelligence, type CompletionItem, type Language } from '@/composables/useCodeIntelligence'
import { computed, onMounted, ref, watch } from 'vue'

// --- Emits ---
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'changeLanguage', lang: Language): void
  (e: 'save', code: string): void
}>()

// --- Props (опционально, если хотим принимать начальный код или язык от родителя) ---
const props = defineProps<{
  modelValue?: string
  initialLanguage?: Language
}>()

// --- Состояние языка ---
// Используем пропс, если передан, иначе 'html'
const currentLanguage = ref<Language>(props.initialLanguage || 'html')

// Начальный код зависит от языка, но приоритет у modelValue, если он есть
const defaultCodes: Record<Language, string> = {
  html: '<div class="container">\n  <h1 class="title">Hello Developer</h1>\n  <p class="description">Пиши "!" для структуры...</p>\n</div>',
  css: '.container {\n  display: flex;\n  justify-content: center;\n}\n\n.title {\n  color: blue;\n}',
  javascript: 'console.log("Hello World");\n\nconst button = document.getElementById("myButton");\nbutton.addEventListener("click", () => {\n  alert("Clicked!");\n});'
}

// Инициализируем код: либо из пропса, либо дефолтный для текущего языка
const htmlCode = ref(props.modelValue ?? defaultCodes[currentLanguage.value])

const editorContainer = ref<HTMLElement | null>(null)
const codeEditor = ref<HTMLElement | null>(null)

// --- Интеллект ---
let intelligence = useCodeIntelligence(htmlCode.value, currentLanguage.value)
let { suggestions, showSuggestions, cursorCoords, findCompletions, getCurrentTagName } = intelligence

// Пересоздаем интеллект при смене языка
const switchLanguage = (lang: Language) => {
  currentLanguage.value = lang
  
  // Если код пустой или дефолтный предыдущего языка, меняем на дефолтный нового
  // Это простая логика, можно усложнить
  if (!props.modelValue) { 
     htmlCode.value = defaultCodes[lang]
     if (codeEditor.value) codeEditor.value.innerHTML = htmlCode.value
  }

  // Эмитим событие смены языка родителю
  emit('changeLanguage', lang)

  // Пересоздаем интеллект
  intelligence = useCodeIntelligence(htmlCode.value, lang)
  ;({ suggestions, showSuggestions, cursorCoords, findCompletions, getCurrentTagName } = intelligence)
}

onMounted(() => {
  if (codeEditor.value) {
    codeEditor.value.innerHTML = htmlCode.value
  }
})

// --- Обновление курсора и подсказок ---
const updateCursorAndSuggestions = () => {
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0 || !codeEditor.value || !editorContainer.value) {
    showSuggestions.value = false
    return
  }

  const range = selection.getRangeAt(0)
  const rect = range.getBoundingClientRect()
  const containerRect = editorContainer.value.getBoundingClientRect()

  cursorCoords.value = {
    x: rect.left - containerRect.left,
    y: rect.top - containerRect.top
  }

  const textNode = range.startContainer
  if (textNode.nodeType !== Node.TEXT_NODE) {
    showSuggestions.value = false
    return
  }

  const fullText = textNode.textContent ?? ""
  const textBefore = fullText.slice(0, range.startOffset)
  const currentTag = getCurrentTagName(textBefore) ?? ""
  
  const found = findCompletions(textBefore, currentTag)
  
  if (found.length > 0) {
    suggestions.value = found
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

// --- Применение подсказки ---
const applySuggestion = (item: CompletionItem) => {
  if (!codeEditor.value) return
  codeEditor.value.focus()
  
  const selection = window.getSelection()
  if (!selection || selection.rangeCount === 0) return

  const range = selection.getRangeAt(0)
  const textNode = range.startContainer
  
  if (textNode.nodeType !== Node.TEXT_NODE) return

  const text = textNode.textContent ?? ""
  const offset = range.startOffset

  let startOffset = offset
  let newTextInsertion = ""
  let newCursorPos = 0

  if (item.type === 'snippet') {
    let keyword = item.label
    if (currentLanguage.value === 'html' && item.label === '!') keyword = '!'
    
    const keywordStart = offset - keyword.length
    
    if (keywordStart >= 0 && text.slice(keywordStart, offset) === keyword) {
       startOffset = keywordStart
       newTextInsertion = item.insertText ?? ""
       newCursorPos = startOffset + newTextInsertion.length
    } else {
       startOffset = offset
       newTextInsertion = item.insertText ?? ""
       newCursorPos = startOffset + newTextInsertion.length
    }

  } else if (item.type === 'class') {
    while (startOffset > 0 && !/\s/.test(text[startOffset - 1]) && text[startOffset - 1] !== '"') {
      startOffset--
    }
    newTextInsertion = item.label
    newCursorPos = startOffset + item.label.length

  } else if (item.type === 'value') {
    while (startOffset > 0 && text[startOffset - 1] !== '"' && text[startOffset - 1] !== ':') {
      startOffset--
    }
    if (startOffset > 0 && (text[startOffset - 1] === ':' || text[startOffset - 1] === '"')) {
       // startOffset уже указывает на позицию после разделителя в логике цикла? 
       // Нет, цикл останавливается ПЕРЕД разделителем или на нем.
       // Проще: просто вставляем значение. Курсор поставим в конец значения.
    }
    newTextInsertion = item.label
    newCursorPos = startOffset + item.label.length

  } else if (item.type === 'tag') {
    while (startOffset > 0 && /[a-zA-Z\-]/.test(text[startOffset - 1])) {
      startOffset--
    }
    newTextInsertion = `<${item.label}></${item.label}>`
    newCursorPos = startOffset + item.label.length + 2
    
  } else if (item.type === 'attribute') {
     while (startOffset > 0 && /[a-zA-Z\-]/.test(text[startOffset - 1])) {
      startOffset--
    }
    const needsSpace = startOffset > 0 && text[startOffset - 1] !== ' ' && text[startOffset - 1] !== '<'
    const prefix = needsSpace ? ' ' : ''
    newTextInsertion = `${prefix}${item.label}=""`
    newCursorPos = startOffset + (needsSpace ? 1 : 0) + item.label.length + 2

  } else if (item.type === 'property') {
     while (startOffset > 0 && /[a-zA-Z\-]/.test(text[startOffset - 1])) {
      startOffset--
    }
    newTextInsertion = `${item.label}: ;`
    newCursorPos = startOffset + item.label.length + 2 

  } else if (item.type === 'keyword' || item.type === 'method') {
     while (startOffset > 0 && /[a-zA-Z.]/.test(text[startOffset - 1])) {
      startOffset--
    }
    newTextInsertion = item.label
    newCursorPos = startOffset + item.label.length
  }

  const prefixText = text.slice(0, startOffset)
  const suffixText = text.slice(offset)
  textNode.textContent = prefixText + newTextInsertion + suffixText

  selection.removeAllRanges()
  const newRange = document.createRange()
  const safePos = Math.min(newCursorPos, (prefixText + newTextInsertion).length)
  newRange.setStart(textNode, safePos)
  newRange.collapse(true)
  selection.addRange(newRange)

  htmlCode.value = codeEditor.value.innerHTML
  
  // Эмитим обновление модели
  emit('update:modelValue', htmlCode.value)
  
  showSuggestions.value = false
  updateCursorAndSuggestions()
}

// --- Обработчики событий ---
const handleInput = () => {
  if (codeEditor.value) {
    htmlCode.value = codeEditor.value.innerHTML
    emit('update:modelValue', htmlCode.value)
  }
  updateCursorAndSuggestions()
}

const handleKeydown = (e: KeyboardEvent) => {
  // Ctrl+S для сохранения
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    emit('save', htmlCode.value)
  }

  if (e.key === 'Tab' && showSuggestions.value && suggestions.value.length > 0) {
    e.preventDefault()
    applySuggestion(suggestions.value[0])
  }
  if (e.key === 'Escape') showSuggestions.value = false
}

const handleClick = updateCursorAndSuggestions
const handleKeyup = updateCursorAndSuggestions

// --- Вычисляемые свойства ---
const fileName = computed(() => {
  switch(currentLanguage.value) {
    case 'css': return 'style.css'
    case 'javascript': return 'script.js'
    default: return 'index.html'
  }
})

const placeholderText = computed(() => {
   if (currentLanguage.value === 'html') return '<!-- Пиши ! для структуры -->'
   if (currentLanguage.value === 'css') return '/* Пиши .class { ... } */'
   return '// Пиши console.log(...)'
})

// Следим за изменением modelValue извне, чтобы обновить редактор
watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined && newVal !== htmlCode.value && codeEditor.value) {
     // Только если изменение пришло не от нас самих
     // Но так как мы эмитим update:modelValue, может возникнуть цикл.
     // Обычно используют флаг isInternalChange, но для простоты оставим так.
     // В реальном проекте лучше сравнивать ссылки или использовать flush: 'post'
     if (document.activeElement !== codeEditor.value) {
        htmlCode.value = newVal
        codeEditor.value.innerHTML = newVal
     }
  }
})

</script>

<template>
  <!-- РЕДАКТОР -->
  <div 
    ref="editorContainer"
    class="bg-[#1e1e1e] w-full h-full border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative group ring-1 ring-white/5"
  >
    <!-- Каретка -->
    <div 
      class="absolute w-0.5 h-5 bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)] pointer-events-none transition-all duration-75 ease-out z-30"
      :style="{ left: `${cursorCoords.x}px`, top: `${cursorCoords.y + 2}px` }"
    ></div>

    <!-- Подсказки -->
    <div 
      v-if="showSuggestions"
      class="absolute bg-[#252526] border border-zinc-600 text-zinc-200 min-w-[200px] rounded shadow-2xl text-sm font-mono z-40 flex flex-col animate-in fade-in slide-in-from-top-1 duration-100"
      :style="{ left: `${cursorCoords.x + 5}px`, top: `${cursorCoords.y + 20}px` }"
    >
      <div 
        v-for="(item, index) in suggestions" 
        :key="item.label"
        @mousedown.prevent="applySuggestion(item)"
        class="px-3 py-1.5 hover:bg-[#37373d] cursor-pointer flex items-center justify-between group/item"
        :class="{ 'bg-[#37373d]': index === 0 }"
      >
        <div class="flex items-center gap-2">
          <span v-if="item.type === 'tag'" class="w-4 h-4 flex items-center justify-center bg-blue-500/20 text-blue-400 text-[10px] rounded border border-blue-500/30">T</span>
          <span v-else-if="item.type === 'attribute'" class="w-4 h-4 flex items-center justify-center bg-purple-500/20 text-purple-400 text-[10px] rounded border border-purple-500/30">A</span>
          <span v-else-if="item.type === 'value'" class="w-4 h-4 flex items-center justify-center bg-green-500/20 text-green-400 text-[10px] rounded border border-green-500/30">V</span>
          <span v-else-if="item.type === 'class'" class="w-4 h-4 flex items-center justify-center bg-yellow-500/20 text-yellow-400 text-[10px] rounded border border-yellow-500/30">.</span>
          <span v-else-if="item.type === 'snippet'" class="w-4 h-4 flex items-center justify-center bg-red-500/20 text-red-400 text-[10px] rounded border border-red-500/30">S</span>
          <span v-else-if="item.type === 'property'" class="w-4 h-4 flex items-center justify-center bg-cyan-500/20 text-cyan-400 text-[10px] rounded border border-cyan-500/30">P</span>
          <span v-else-if="item.type === 'keyword'" class="w-4 h-4 flex items-center justify-center bg-orange-500/20 text-orange-400 text-[10px] rounded border border-orange-500/30">K</span>
          <span v-else-if="item.type === 'method'" class="w-4 h-4 flex items-center justify-center bg-pink-500/20 text-pink-400 text-[10px] rounded border border-pink-500/30">M</span>
          
          <span class="font-bold" 
            :class="{
              'text-blue-300': item.type === 'tag',
              'text-purple-300': item.type === 'attribute',
              'text-green-300': item.type === 'value',
              'text-yellow-300': item.type === 'class',
              'text-red-300': item.type === 'snippet',
              'text-cyan-300': item.type === 'property',
              'text-orange-300': item.type === 'keyword',
              'text-pink-300': item.type === 'method'
            }">
            {{ item.label }}
          </span>
        </div>
        <span class="text-[10px] text-zinc-500 opacity-0 group-hover/item:opacity-100 transition-opacity">Tab</span>
      </div>
      
      <div v-if="suggestions[0]?.description" class="px-3 py-2 bg-black/20 border-t border-zinc-700 text-xs text-zinc-400 italic">
        {{ suggestions[0].description }}
      </div>
    </div>

    <!-- Шапка -->
    <div class="px-4 py-2 bg-[#2d2d2d] border-b border-black/20 flex items-center justify-between select-none shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
        <span class="text-xs font-medium text-zinc-300">{{ fileName }}</span>
      </div>
      
      <!-- Переключатель языка -->
      <div class="flex bg-[#1e1e1e] rounded-lg p-1 border border-zinc-700">
        <button 
          @click="switchLanguage('html')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors', currentLanguage === 'html' ? 'bg-amber-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200']"
        >HTML</button>
        <button 
          @click="switchLanguage('css')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors', currentLanguage === 'css' ? 'bg-cyan-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200']"
        >CSS</button>
        <button 
          @click="switchLanguage('javascript')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors', currentLanguage === 'javascript' ? 'bg-yellow-500 text-black font-bold' : 'text-zinc-400 hover:text-zinc-200']"
        >JS</button>
      </div>
    </div>
    
    <!-- Поле ввода -->
    <div 
      ref="codeEditor"
      contenteditable="true"
      @input="handleInput"
      @click="handleClick"
      @keyup="handleKeyup"
      @keydown="handleKeydown"
      class="w-full h-full bg-[#1e1e1e] p-4 font-mono text-sm text-[#d4d4d4] outline-none overflow-auto whitespace-pre-wrap break-words z-10 relative empty:before:content-[attr(placeholder)] empty:before:text-zinc-600 leading-6"
      :placeholder="placeholderText"
      spellcheck="false"
    ></div>
  </div>
</template>