<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import type { Language } from '@/types/coder'

const props = defineProps<{
  modelValue?:      string
  initialLanguage?: Language
  mode?:            'free' | 'course'
  lockedLines?:     number[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', code: string):               void
  (e: 'ready'):                            void
}>()

const MONACO_LANG: Record<Language, string> = {
  html: 'html', css: 'css', javascript: 'javascript',
}

const FILE_NAMES: Record<Language, string> = {
  html: 'index.html', css: 'style.css', javascript: 'script.js',
}

const containerEl   = ref<HTMLElement | null>(null)
const lang          = ref<Language>(props.initialLanguage ?? 'html')
const editor        = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)
const decorationIds = ref<string[]>([])

// ─── Воркеры (один раз) ───────────────────────────────────────────────────────
if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker(_: unknown, label: string) {
      if (label === 'json')                                    return new JsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
      if (label === 'typescript' || label === 'javascript')   return new TsWorker()
      return new EditorWorker()
    },
  }
}

// ─── Заблокированные строки ───────────────────────────────────────────────────

function applyLockedLines() {
  if (!editor.value) return
  const model = editor.value.getModel()
  if (!model) return

  const decorations: monaco.editor.IModelDeltaDecoration[] = []

  if (props.mode === 'course' && props.lockedLines?.length) {
    props.lockedLines.forEach(lineNumber => {
      decorations.push({
        range: new monaco.Range(lineNumber, 1, lineNumber, 1),
        options: {
          isWholeLine: true,
          className: 'locked-line-dark-bg',
          stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
        },
      })
    })
  }

  decorationIds.value = editor.value.deltaDecorations(decorationIds.value, decorations)
}

let isRevertingChange = false

function handleContentChange() {
  if (props.mode !== 'course' || !props.lockedLines?.length || isRevertingChange) return
  const cursor = editor.value?.getPosition()
  if (!cursor) return
  if (props.lockedLines.includes(cursor.lineNumber)) {
    isRevertingChange = true
    editor.value!.trigger('keyboard', 'undo', {})
    isRevertingChange = false
  }
}

// ─── Resize: Monaco не следит за контейнером сам ─────────────────────────────
// Splitpanes меняет размер панели → диспатчит window resize →
// мы вызываем editor.layout() чтобы Monaco пересчитал и занял всё пространство

let resizeObserver: ResizeObserver | null = null

function setupResizeObserver() {
  if (!containerEl.value) return
  // ResizeObserver точнее чем window resize — срабатывает именно на контейнер
  resizeObserver = new ResizeObserver(() => {
    editor.value?.layout()
  })
  resizeObserver.observe(containerEl.value)
}

// ─── Монтирование ─────────────────────────────────────────────────────────────

onMounted(async () => {
  if (!containerEl.value) return
  await nextTick()

  editor.value = monaco.editor.create(containerEl.value, {
    value:    props.modelValue ?? '',
    language: MONACO_LANG[lang.value],
    theme:    'vs-dark',

    // Подсказки
    suggest: {
      showKeywords: true, showSnippets: true, showClasses: true,
      showFunctions: true, showVariables: true, showModules: true,
      showProperties: true, showWords: true, showIcons: true, showColors: true,
    },
    suggestOnTriggerCharacters:        true,
    quickSuggestions:                  { other: true, comments: false, strings: true },
    quickSuggestionsDelay:             100,
    acceptSuggestionOnEnter:           'on',
    acceptSuggestionOnCommitCharacter: true,
    tabCompletion:                     'on',
    wordBasedSuggestions:              'allDocuments',
    parameterHints:                    { enabled: true },
    inlineSuggest:                     { enabled: true },

    // Форматирование
    formatOnType:        true,
    formatOnPaste:       true,
    autoIndent:          'full',
    autoClosingBrackets: 'always',
    autoClosingQuotes:   'always',
    autoSurround:        'languageDefined',

    // Вид
    fontSize:                  14,
    fontFamily:                "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
    fontLigatures:              true,
    lineHeight:                 24,
    letterSpacing:              0.3,
    padding:                    { top: 16, bottom: 16 },
    cursorBlinking:             'smooth',
    cursorSmoothCaretAnimation: 'on',
    smoothScrolling:            true,
    roundedSelection:           true,
    renderLineHighlight:        'line',
    bracketPairColorization:    { enabled: true },
    guides:                     { bracketPairs: true, indentation: true },

    // Минимализм
    minimap:            { enabled: false },
    scrollbar:          { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    overviewRulerLanes:  0,
    lineNumbers:        'on',
    glyphMargin:        false,
    folding:            true,
    wordWrap:           'off',
  })

  applyLockedLines()
  setupResizeObserver()

  editor.value.onDidChangeModelContent(() => {
    handleContentChange()
    emit('update:modelValue', editor.value!.getValue())
  })

  editor.value.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
    () => emit('save', editor.value!.getValue()),
  )

  emit('ready')
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  editor.value?.dispose()
})

// ─── Watchers ─────────────────────────────────────────────────────────────────

watch(() => props.modelValue, (newVal) => {
  if (!editor.value || newVal === undefined) return
  if (newVal !== editor.value.getValue()) {
    const pos = editor.value.getPosition()
    editor.value.setValue(newVal)
    if (pos) editor.value.setPosition(pos)
    applyLockedLines()
  }
})

watch(() => props.initialLanguage, (newLang) => {
  if (!newLang || !editor.value) return
  lang.value = newLang
  const model = editor.value.getModel()
  if (model) {
    monaco.editor.setModelLanguage(model, MONACO_LANG[newLang])
    applyLockedLines()
  }
})

watch(() => [props.lockedLines, props.mode], () => {
  applyLockedLines()
}, { deep: true })
</script>

<template>
  <div class="w-full h-full bg-[#1e1e1e] flex flex-col overflow-hidden rounded-xl border border-zinc-700 ring-1 ring-white/5">
    <div class="px-4 py-2 bg-[#2d2d2d] border-b border-black/30 flex items-center gap-2 select-none shrink-0">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/60" />
      <span class="text-xs font-medium text-zinc-400">{{ FILE_NAMES[lang] }}</span>
      <span v-if="props.mode === 'course'" class="ml-auto text-[10px] uppercase font-bold text-green-400 tracking-widest">
        Course Mode
      </span>
    </div>
    <div ref="containerEl" class="flex-1 overflow-hidden w-full" />
  </div>
</template>

<style scoped>
:deep(.locked-line-dark-bg) {
  background-color: rgba(0, 0, 0, 0.25) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
</style>