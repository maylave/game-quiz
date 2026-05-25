<script setup lang="ts">
import { useCodeIntelligence, type CompletionItem, type Language } from '@/composables/useCodeIntelligence'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import { computed, onMounted, ref, watch } from 'vue'

// ─── Emits ───────────────────────────────────────────────────────────────────
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'changeLanguage', lang: Language): void
  (e: 'save', code: string): void
}>()

// ─── Props ───────────────────────────────────────────────────────────────────
const props = defineProps<{
  modelValue?: string
  initialLanguage?: Language
}>()

// ─── State ───────────────────────────────────────────────────────────────────
const currentLanguage = ref<Language>(props.initialLanguage || 'html')

const defaultCodes: Record<Language, string> = {
  html: '<div class="container">\n  <h1 class="title">Hello Developer</h1>\n  <p class="description">Пиши "!" для структуры...</p>\n</div>',
  css: '.container {\n  display: flex;\n  justify-content: center;\n}\n\n.title {\n  color: blue;\n}',
  javascript: 'console.log("Hello World");\n\nconst button = document.getElementById("myButton");\nbutton.addEventListener("click", () => {\n  alert("Clicked!");\n});'
}

const htmlCode = ref(props.modelValue ?? defaultCodes[currentLanguage.value])

const editorContainer = ref<HTMLElement | null>(null)
const codeEditor      = ref<HTMLElement | null>(null)

// ─── Autocomplete state (локальные refs, не из composable) ───────────────────
const suggestions     = ref<CompletionItem[]>([])
const showSuggestions = ref(false)
const activeIndex     = ref(0)
const cursorCoords    = ref({ x: 0, y: 0 })

// ─── Intelligence ─────────────────────────────────────────────────────────────
let intel = useCodeIntelligence(htmlCode.value, currentLanguage.value)

// ─── Prism language map ───────────────────────────────────────────────────────
const prismLang = computed((): string =>
  ({ html: 'markup', css: 'css', javascript: 'javascript' } as Record<Language, string>)[currentLanguage.value]
)

// ─── Сохранение/восстановление позиции курсора в contenteditable ──────────────
//
//  Стандартная техника: перед заменой innerHTML сохраняем offset символа
//  от начала текстового содержимого, после — восстанавливаем.
//
function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset)
  return range.toString().length
}

function setCaretOffset(el: HTMLElement, offset: number) {
  const sel = window.getSelection()
  if (!sel) return
  const range = document.createRange()
  let remaining = offset
  let found = false

  function walk(node: Node) {
    if (found) return
    if (node.nodeType === Node.TEXT_NODE) {
      const len = (node.textContent ?? '').length
      if (remaining <= len) {
        range.setStart(node, remaining)
        range.collapse(true)
        found = true
      } else {
        remaining -= len
      }
    } else {
      for (const child of Array.from(node.childNodes)) {
        walk(child)
        if (found) return
      }
    }
  }

  walk(el)
  if (!found) {
    // Курсор в конец
    range.selectNodeContents(el)
    range.collapse(false)
  }
  sel.removeAllRanges()
  sel.addRange(range)
}

// ─── Подсветка: заменяем innerHTML с сохранением курсора ─────────────────────
function applyHighlight() {
  const el = codeEditor.value
  if (!el) return

  // Получаем plain text из contenteditable
  const text = el.innerText

  // Сохраняем позицию курсора ДО изменения DOM
  const caretPos = getCaretOffset(el)

  // Подсвечиваем через Prism
  let highlighted: string
  try {
    const grammar = Prism.languages[prismLang.value]
    highlighted = grammar
      ? Prism.highlight(text, grammar, prismLang.value)
      : escapeHtml(text)
  } catch {
    highlighted = escapeHtml(text)
  }

  // Заменяем содержимое
  el.innerHTML = highlighted

  // Восстанавливаем курсор
  setCaretOffset(el, caretPos)

  // Сохраняем plain text как значение
  htmlCode.value = text
  emit('update:modelValue', text)
}

function escapeHtml(t: string) {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Переключение языка ───────────────────────────────────────────────────────
const switchLanguage = (lang: Language) => {
  currentLanguage.value = lang
  if (!props.modelValue) {
    htmlCode.value = defaultCodes[lang]
    if (codeEditor.value) {
      codeEditor.value.innerText = htmlCode.value
      applyHighlight()
    }
  }
  emit('changeLanguage', lang)
  intel = useCodeIntelligence(htmlCode.value, lang)
  showSuggestions.value = false
}

onMounted(() => {
  if (codeEditor.value) {
    codeEditor.value.innerText = htmlCode.value
    applyHighlight()
  }
})

// ─── Обновление позиции курсора и подсказок ───────────────────────────────────
//  Используем window.getSelection() — это работает точно в contenteditable,
//  никаких mirror-div не нужно.
const updateCursorAndSuggestions = () => {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0 || !codeEditor.value || !editorContainer.value) {
    showSuggestions.value = false
    return
  }

  const range      = sel.getRangeAt(0)
  const rect       = range.getBoundingClientRect()
  const container  = editorContainer.value.getBoundingClientRect()

  cursorCoords.value = {
    x: rect.left - container.left,
    y: rect.top  - container.top,
  }

  const textNode = range.startContainer
  if (textNode.nodeType !== Node.TEXT_NODE) {
    showSuggestions.value = false
    return
  }

  const fullText   = textNode.textContent ?? ''
  const textBefore = fullText.slice(0, range.startOffset)
  const currentTag = intel.getCurrentTagName(textBefore) ?? ''
  const found      = intel.findCompletions(textBefore, currentTag)

  if (found.length > 0) {
    suggestions.value     = found
    activeIndex.value     = 0
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

// ─── Применение подсказки ─────────────────────────────────────────────────────
const applySuggestion = (item: CompletionItem) => {
  if (!codeEditor.value) return
  codeEditor.value.focus()

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return

  const range    = sel.getRangeAt(0)
  const textNode = range.startContainer
  if (textNode.nodeType !== Node.TEXT_NODE) return

  const text   = textNode.textContent ?? ''
  const offset = range.startOffset

  let startOffset      = offset
  let newTextInsertion = ''
  let newCursorPos     = 0
  const ch = (i: number) => text.charAt(i)

  if (item.type === 'snippet') {
    const kStart = offset - item.label.length
    if (kStart >= 0 && text.slice(kStart, offset) === item.label) startOffset = kStart
    newTextInsertion = item.insertText ?? ''
    newCursorPos     = startOffset + newTextInsertion.length

  } else if (item.type === 'class') {
    while (startOffset > 0 && !/[\s"]/.test(ch(startOffset - 1))) startOffset--
    newTextInsertion = item.label
    newCursorPos     = startOffset + item.label.length

  } else if (item.type === 'value') {
    while (startOffset > 0 && ch(startOffset - 1) !== '"' && ch(startOffset - 1) !== ':') startOffset--
    newTextInsertion = item.label
    newCursorPos     = startOffset + item.label.length

  } else if (item.type === 'tag') {
    while (startOffset > 0 && /[a-zA-Z\-]/.test(ch(startOffset - 1))) startOffset--
    newTextInsertion = `<${item.label}></${item.label}>`
    newCursorPos     = startOffset + item.label.length + 2

  } else if (item.type === 'attribute') {
    while (startOffset > 0 && /[a-zA-Z\-]/.test(ch(startOffset - 1))) startOffset--
    const sp         = startOffset > 0 && ch(startOffset - 1) !== ' ' && ch(startOffset - 1) !== '<' ? ' ' : ''
    newTextInsertion = `${sp}${item.label}=""`
    newCursorPos     = startOffset + sp.length + item.label.length + 2

  } else if (item.type === 'property') {
    while (startOffset > 0 && /[a-zA-Z\-]/.test(ch(startOffset - 1))) startOffset--
    newTextInsertion = `${item.label}: ;`
    newCursorPos     = startOffset + item.label.length + 2

  } else if (item.type === 'keyword' || item.type === 'method') {
    while (startOffset > 0 && /[a-zA-Z.]/.test(ch(startOffset - 1))) startOffset--
    newTextInsertion = item.label
    newCursorPos     = startOffset + item.label.length
  }

  // Вставляем текст в DOM-узел напрямую (без innerHTML — сохраняем узел)
  const prefixText = text.slice(0, startOffset)
  const suffixText = text.slice(offset)
  textNode.textContent = prefixText + newTextInsertion + suffixText

  // Восстанавливаем курсор
  sel.removeAllRanges()
  const newRange = document.createRange()
  const safePos  = Math.min(newCursorPos, (prefixText + newTextInsertion).length)
  newRange.setStart(textNode, safePos)
  newRange.collapse(true)
  sel.addRange(newRange)

  // Применяем подсветку ПОСЛЕ вставки (с сохранением нового положения курсора)
  applyHighlight()

  showSuggestions.value = false
  updateCursorAndSuggestions()
}

// ─── Обработчики событий ──────────────────────────────────────────────────────
const handleInput = () => {
  applyHighlight()
  updateCursorAndSuggestions()
}

const handleKeydown = (e: KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    emit('save', htmlCode.value)
    return
  }

  if (showSuggestions.value && suggestions.value.length > 0) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value + 1) % suggestions.value.length
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      activeIndex.value = (activeIndex.value - 1 + suggestions.value.length) % suggestions.value.length
      return
    }
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault()
      const active = suggestions.value[activeIndex.value]
      if (active) applySuggestion(active)
      return
    }
    if (e.key === 'Escape') {
      showSuggestions.value = false
      return
    }
  }
}

const handleClick  = updateCursorAndSuggestions
const handleKeyup  = updateCursorAndSuggestions

// ─── Computed ─────────────────────────────────────────────────────────────────
const fileName = computed(() =>
  ({ css: 'style.css', javascript: 'script.js', html: 'index.html' } as Record<Language, string>)[currentLanguage.value]
)

const placeholderText = computed(() =>
  ({ html: '<!-- Пиши ! для структуры -->', css: '/* Пиши .class { ... } */', javascript: '// Пиши console.log(...)' } as Record<Language, string>)[currentLanguage.value]
)

// Метаданные типов для попапа
const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  tag:       { icon: '◈', color: '#569cd6', bg: 'rgba(86,156,214,.15)',  label: 'Element'   },
  attribute: { icon: '⚙', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Attribute' },
  value:     { icon: '≡', color: '#4ec9b0', bg: 'rgba(78,201,176,.15)',  label: 'Value'     },
  class:     { icon: '.', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Class'     },
  snippet:   { icon: '⚡', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Snippet'   },
  property:  { icon: '▣', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Property'  },
  keyword:   { icon: 'K', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Keyword'   },
  method:    { icon: 'ƒ', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Method'    },
}
const tm = (type: string) => TYPE_META[type] ?? { icon: '○', color: '#858585', bg: 'rgba(133,133,133,.1)', label: type }

const activeItem = computed(() => suggestions.value[activeIndex.value] as CompletionItem | undefined)

// ─── Watcher ──────────────────────────────────────────────────────────────────
watch(() => props.modelValue, (newVal) => {
  if (newVal !== undefined && newVal !== htmlCode.value && codeEditor.value) {
    if (document.activeElement !== codeEditor.value) {
      htmlCode.value = newVal
      codeEditor.value.innerText = newVal
      applyHighlight()
    }
  }
})
</script>

<template>
  <div
    ref="editorContainer"
    class="bg-[#1e1e1e] w-full h-full border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden relative ring-1 ring-white/5"
  >
    <!-- ─── VS Code autocomplete popup ─── -->
    <div
      v-if="showSuggestions && suggestions.length"
      class="vsc-popup absolute z-50"
      :style="{ left: cursorCoords.x + 'px', top: (cursorCoords.y + 22) + 'px' }"
    >
      <!-- Список -->
      <ul class="vsc-list" role="listbox">
        <li
          v-for="(item, i) in suggestions"
          :key="item.label + i"
          role="option"
          class="vsc-item"
          :class="{ 'vsc-item-active': i === activeIndex }"
          @mousedown.prevent="applySuggestion(item)"
          @mousemove="activeIndex = i"
        >
          <span
            class="vsc-icon"
            :style="{ color: tm(item.type).color, background: tm(item.type).bg, borderColor: tm(item.type).color + '55' }"
          >{{ tm(item.type).icon }}</span>
          <span class="vsc-label">{{ item.label }}</span>
          <span class="vsc-kind" :style="{ color: tm(item.type).color + 'aa' }">{{ tm(item.type).label }}</span>
        </li>
      </ul>

      <!-- Панель описания активного элемента -->
      <div v-if="activeItem?.description" class="vsc-detail">
        <p class="vsc-detail-type" :style="{ color: tm(activeItem.type).color }">{{ tm(activeItem.type).label }}</p>
        <p class="vsc-detail-desc">{{ activeItem.description }}</p>
        <p class="vsc-detail-keys">
          <kbd>↑↓</kbd> выбор &nbsp;·&nbsp; <kbd>↵</kbd> <kbd>Tab</kbd> вставить &nbsp;·&nbsp; <kbd>Esc</kbd> закрыть
        </p>
      </div>
    </div>

    <!-- ─── Header ─── -->
    <div class="px-4 py-2 bg-[#2d2d2d] border-b border-black/20 flex items-center justify-between select-none shrink-0">
      <div class="flex items-center gap-2">
        <span class="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></span>
        <span class="text-xs font-medium text-zinc-300">{{ fileName }}</span>
      </div>
      <div class="flex bg-[#1e1e1e] rounded-lg p-1 border border-zinc-700">
        <button @click="switchLanguage('html')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium', currentLanguage === 'html' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-zinc-200']">HTML</button>
        <button @click="switchLanguage('css')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium', currentLanguage === 'css' ? 'bg-cyan-500 text-black' : 'text-zinc-400 hover:text-zinc-200']">CSS</button>
        <button @click="switchLanguage('javascript')"
          :class="['px-3 py-1 text-xs rounded-md transition-colors font-medium', currentLanguage === 'javascript' ? 'bg-yellow-500 text-black' : 'text-zinc-400 hover:text-zinc-200']">JS</button>
      </div>
    </div>

    <!-- ─── contenteditable editor ─── -->
    <div
      ref="codeEditor"
      contenteditable="true"
      @input="handleInput"
      @click="handleClick"
      @keyup="handleKeyup"
      @keydown="handleKeydown"
      :data-placeholder="placeholderText"
      spellcheck="false"
      class="editor-field"
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
  position: relative;
  z-index: 10;
  caret-color: #f59e0b;
}

/* Placeholder через data-атрибут */
.editor-field:empty::before {
  content: attr(data-placeholder);
  color: #52525b;
  pointer-events: none;
}

/* ─── Prism токены (VS Code Dark+) ─── */
:deep(.token.comment),
:deep(.token.prolog),
:deep(.token.doctype),
:deep(.token.cdata)       { color: #6a9955; font-style: italic; }
:deep(.token.punctuation) { color: #d4d4d4; }
:deep(.token.tag),
:deep(.token.tag .punctuation) { color: #569cd6; }
:deep(.token.attr-name)   { color: #9cdcfe; }
:deep(.token.attr-value),
:deep(.token.string)      { color: #ce9178; }
:deep(.token.keyword),
:deep(.token.boolean),
:deep(.token.null)        { color: #569cd6; }
:deep(.token.number)      { color: #b5cea8; }
:deep(.token.function)    { color: #dcdcaa; }
:deep(.token.class-name)  { color: #4ec9b0; }
:deep(.token.operator),
:deep(.token.entity),
:deep(.token.url)         { color: #d4d4d4; }
:deep(.token.property)    { color: #9cdcfe; }
:deep(.token.selector),
:deep(.token.important),
:deep(.token.atrule)      { color: #d7ba7d; }
:deep(.token.regex)       { color: #d16969; }
:deep(.token.doctype .token.doctype-tag) { color: #569cd6; }
:deep(.token.doctype .token.name)        { color: #9cdcfe; }
</style>

<style>
/* ─── VS Code popup (глобально — чтобы не было конфликтов с scoped) ─── */
.vsc-popup {
  display: flex;
  flex-direction: row;
  box-shadow: 0 8px 40px rgba(0,0,0,.8), 0 2px 8px rgba(0,0,0,.5);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  animation: vscFadeIn 80ms ease-out;
  pointer-events: all;
}
@keyframes vscFadeIn {
  from { opacity: 0; transform: translateY(-3px); }
  to   { opacity: 1; transform: translateY(0); }
}

.vsc-list {
  list-style: none; margin: 0; padding: 2px 0;
  background: #252526;
  border: 1px solid #454545;
  border-radius: 4px 0 0 4px;
  width: 260px;
  max-height: 220px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #424242 transparent;
}
.vsc-list::-webkit-scrollbar { width: 5px; }
.vsc-list::-webkit-scrollbar-thumb { background: #424242; border-radius: 3px; }

.vsc-item {
  display: flex; align-items: center; gap: 5px;
  padding: 1px 8px 1px 4px; cursor: pointer;
  height: 22px; white-space: nowrap; overflow: hidden;
  color: #cccccc; user-select: none;
}
.vsc-item:hover  { background: #2a2d2e; }
.vsc-item-active { background: #094771 !important; }
.vsc-item-active .vsc-label { color: #fff; }

.vsc-icon {
  flex-shrink: 0;
  display: inline-flex; align-items: center; justify-content: center;
  width: 18px; height: 18px; border-radius: 3px; border: 1px solid;
  font-size: 11px; font-weight: 800; line-height: 1;
}
.vsc-label { flex: 1; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: #cccccc; }
.vsc-kind  { font-size: 11px; flex-shrink: 0; color: #888; }

.vsc-detail {
  background: #1e1e1e;
  border: 1px solid #454545; border-left: none;
  border-radius: 0 4px 4px 0;
  width: 220px; max-height: 220px;
  padding: 8px 10px;
  display: flex; flex-direction: column; gap: 6px; overflow: hidden;
}
.vsc-detail-type {
  margin: 0; font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: .08em;
  font-family: system-ui, sans-serif;
}
.vsc-detail-desc {
  margin: 0; font-size: 12px; color: #cccccc;
  line-height: 1.55; font-family: system-ui, sans-serif;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
}
.vsc-detail-keys {
  margin: auto 0 0; font-size: 10px; color: #666; font-family: system-ui, sans-serif;
}
.vsc-detail-keys kbd {
  background: #3a3a3a; border: 1px solid #555; border-radius: 2px;
  padding: 0 3px; font-size: 9px; color: #aaa;
}
</style>