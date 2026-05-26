<!-- components/coder/CodeEditor.vue -->
<!-- Тонкий компонент: шаблон + обработчики событий.              -->
<!-- Логика подсветки и подсказок — в useEditorState.             -->

<script setup lang="ts">
import { useEditorState } from '@/composables/useEditorState'
import type { CompletionItem, Language } from '@/types/coder'
import { computed, onMounted, ref, watch } from 'vue'
import AutocompletePopup from './AutocompletePopup.vue'

// ─── Emits ────────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'changeLanguage', lang: Language):   void
  (e: 'save', code: string):               void
}>()

// ─── Props ────────────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue?:      string
  initialLanguage?: Language
  previewHtml?:     string
}>()

// ─── Дефолтный код по языку ───────────────────────────────────────────────────
const DEFAULT_CODE: Record<Language, string> = {
  html:       '<div class="container">\n  <h1 class="title">Hello Developer</h1>\n  <p class="description">Пиши "!" для структуры...</p>\n</div>',
  css:        '.container {\n  display: flex;\n  justify-content: center;\n}\n\n.title {\n  color: blue;\n}',
  javascript: 'console.log("Hello World");\n\nconst button = document.getElementById("myButton");\nbutton.addEventListener("click", () => {\n  alert("Clicked!");\n});',
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const editorContainer = ref<HTMLElement | null>(null)
const codeEditor      = ref<HTMLElement | null>(null)

// ─── Состояние ────────────────────────────────────────────────────────────────
const {
  code, lang,
  suggestions, showSuggestions, activeIndex, cursorCoords,
  applyHighlight, setCode,
  updateSuggestions, closeSuggestions, moveSuggestion, applySuggestion,
} = useEditorState(
  props.modelValue ?? DEFAULT_CODE[props.initialLanguage ?? 'html'],
  props.initialLanguage ?? 'html',
)

// ─── Жизненный цикл ───────────────────────────────────────────────────────────
onMounted(() => {
  if (codeEditor.value) {
    codeEditor.value.innerText = code.value
    applyHighlight(codeEditor.value, true)
  }
})

// ─── Смена языка ──────────────────────────────────────────────────────────────
function switchLanguage(newLang: Language): void {
  lang.value = newLang
  if (!props.modelValue && codeEditor.value) {
    setCode(codeEditor.value, DEFAULT_CODE[newLang])
    emit('update:modelValue', DEFAULT_CODE[newLang])
  }
  closeSuggestions()
  emit('changeLanguage', newLang)
}

// ─── Input ────────────────────────────────────────────────────────────────────
function handleInput(): void {
  if (!codeEditor.value) return
  applyHighlight(codeEditor.value)
  emit('update:modelValue', code.value)
  scheduleUpdateSuggestions()
}

// Перехватываем paste — вставляем только plain text, без HTML/стилей браузера
function handlePaste(e: ClipboardEvent): void {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') ?? ''
  if (!text) return
  insertText(text)
}

// ─── Keyboard ─────────────────────────────────────────────────────────────────
function handleKeydown(e: KeyboardEvent): void {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    emit('save', code.value)
    return
  }

  if (showSuggestions.value && suggestions.value.length > 0) {
    if (e.key === 'ArrowDown') { e.preventDefault(); moveSuggestion(1);  return }
    if (e.key === 'ArrowUp')   { e.preventDefault(); moveSuggestion(-1); return }
    if (e.key === 'Escape')    { e.preventDefault(); closeSuggestions(); return }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      const item = suggestions.value[activeIndex.value]
      if (item && codeEditor.value) applySuggestion(item, codeEditor.value)
      return
    }
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    insertNewline()
    return
  }

  if (e.key === 'Tab') {
    e.preventDefault()
    insertText('  ')
    return
  }
}

// ─── Enter: \n + auto-indent ──────────────────────────────────────────────────
function insertNewline(): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !codeEditor.value) return

  const range    = sel.getRangeAt(0)
  const fullText = codeEditor.value.innerText

  // Позиция курсора в plain-text
  const caretPos = (() => {
    const r = range.cloneRange()
    r.selectNodeContents(codeEditor.value!)
    r.setEnd(range.startContainer, range.startOffset)
    return r.toString().length
  })()

  // Отступ текущей строки
  const lineStart = fullText.lastIndexOf('\n', caretPos - 1) + 1
  const indent    = fullText.slice(lineStart, caretPos).match(/^(\s*)/)?.[1] ?? ''

  insertText('\n' + indent)
}

// ─── Вставка текста через Range ───────────────────────────────────────────────
function insertText(str: string): void {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range = sel.getRangeAt(0)
  range.deleteContents()

  const node = document.createTextNode(str)
  range.insertNode(node)
  range.setStartAfter(node)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)

  if (codeEditor.value) {
    applyHighlight(codeEditor.value)
    emit('update:modelValue', code.value)
    scheduleUpdateSuggestions()
  }
}

// ─── Обновление подсказок (rAF — ждём пока Selection обновится) ──────────────
let rafId = 0
function scheduleUpdateSuggestions(): void {
  cancelAnimationFrame(rafId)
  rafId = requestAnimationFrame(() => {
    if (codeEditor.value && editorContainer.value) {
      updateSuggestions(codeEditor.value, editorContainer.value, props.previewHtml ?? '')
    }
  })
}

function handleClickOrKeyup(): void { scheduleUpdateSuggestions() }

// ─── Popup handlers ───────────────────────────────────────────────────────────
function onPopupSelect(item: CompletionItem): void {
  if (codeEditor.value) applySuggestion(item, codeEditor.value)
}

function onPopupHover(index: number): void {
  activeIndex.value = index
}

// ─── v-model извне ────────────────────────────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined && newVal !== code.value && codeEditor.value) {
    if (document.activeElement !== codeEditor.value) {
      setCode(codeEditor.value, newVal)
    }
  }
})

// ─── Computed ─────────────────────────────────────────────────────────────────
const fileName = computed<string>(() =>
  ({ css: 'style.css', javascript: 'script.js', html: 'index.html' } satisfies Record<Language, string>)[lang.value]
)

const placeholderText = computed<string>(() =>
  ({
    html:       '<!-- Пиши ! для boilerplate -->',
    css:        '/* Пиши prop: value; */',
    javascript: '// Пиши log, func, arrow...',
  } satisfies Record<Language, string>)[lang.value]
)
</script>

<template>
  <div
    ref="editorContainer"
    class="bg-[#1e1e1e] w-full h-full border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-white/5"
  >
    <!-- ─── Попап автодополнения ─── -->
    <AutocompletePopup
      v-if="showSuggestions"
      :items="suggestions"
      :active-index="activeIndex"
      :x="cursorCoords.x"
      :y="cursorCoords.y"
      @select="onPopupSelect"
      @hover="onPopupHover"
    />

    <!-- ─── Хедер ─── -->
    <div class="px-4 py-2 bg-[#2d2d2d] border-b border-black/20 flex items-center justify-between select-none shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
        <span class="text-xs font-medium text-zinc-300">{{ fileName }}</span>
      </div>
      <div class="flex bg-[#1e1e1e] rounded-lg p-1 border border-zinc-700">
        <button
          @click="switchLanguage('html')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium',
            lang === 'html' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200']"
        >HTML</button>
        <button
          @click="switchLanguage('css')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium',
            lang === 'css' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-zinc-200']"
        >CSS</button>
        <button
          @click="switchLanguage('javascript')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium',
            lang === 'javascript' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-zinc-200']"
        >JS</button>
      </div>
    </div>

    <!-- ─── Редактор ─── -->
    <div
      ref="codeEditor"
      contenteditable="true"
      spellcheck="false"
      :data-placeholder="placeholderText"
      class="editor-field"
      @input="handleInput"
      @paste="handlePaste"
      @click="handleClickOrKeyup"
      @keyup="handleClickOrKeyup"
      @keydown="handleKeydown"
    ></div>
  </div>
</template>

<style scoped>
.editor-field {
  width: 100%;
  height: 100%;
  padding: 1rem;
  outline: none;
  overflow: auto;
  white-space: pre;
  word-wrap: normal;
  tab-size: 2;
  background: #1e1e1e;
  color: #d4d4d4;
  font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', ui-monospace, 'Courier New', monospace;
  font-size: 0.875rem;
  line-height: 1.5rem;
  caret-color: #f59e0b;
}

.editor-field:empty::before {
  content: attr(data-placeholder);
  color: #52525b;
  pointer-events: none;
}

/* ── Prism: VS Code Dark+ ── */
:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.doctype),
:deep(.token.cdata)              { color: #6a9955; font-style: italic; }
:deep(.token.punctuation)        { color: #d4d4d4; }
:deep(.token.tag),
:deep(.token.tag .punctuation)   { color: #569cd6; }
:deep(.token.attr-name)          { color: #9cdcfe; }
:deep(.token.attr-value),
:deep(.token.string)             { color: #ce9178; }
:deep(.token.keyword),
:deep(.token.boolean),
:deep(.token.null)               { color: #569cd6; }
:deep(.token.number)             { color: #b5cea8; }
:deep(.token.function)           { color: #dcdcaa; }
:deep(.token.class-name)         { color: #4ec9b0; }
:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url)                { color: #d4d4d4; }
:deep(.token.property)           { color: #9cdcfe; }
:deep(.token.selector),
:deep(.token.important),
:deep(.token.atrule)             { color: #d7ba7d; }
:deep(.token.regex)              { color: #d16969; }
:deep(.token.doctype .token.doctype-tag) { color: #569cd6; }
:deep(.token.doctype .token.name)        { color: #9cdcfe; }
</style>