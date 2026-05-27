<!-- components/coder/inputCode.vue -->
<script setup lang="ts">
import * as monaco from 'monaco-editor'
import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

// Импортируем воркеры как модули Vite
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import type { Language } from '@/types/coder'

const props = defineProps<{
  modelValue?:      string
  initialLanguage?: Language
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'save', code: string):               void
  (e: 'ready'):                            void
}>()

const MONACO_LANG: Record<Language, string> = {
  html: 'html', 
  css: 'css', 
  javascript: 'javascript',
}

const FILE_NAMES: Record<Language, string> = {
  html: 'index.html', 
  css: 'style.css', 
  javascript: 'script.js',
}

const containerEl = ref<HTMLElement | null>(null)
const lang        = ref<Language>(props.initialLanguage ?? 'html')
const editor      = shallowRef<monaco.editor.IStandaloneCodeEditor | null>(null)

// Настройка MonacoEnvironment ГЛОБАЛЬНО один раз
if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker(_: unknown, label: string) {
      if (label === 'json') {
        return new JsonWorker();
      }
      if (label === 'css' || label === 'scss' || label === 'less') {
        return new CssWorker();
      }
      if (label === 'html' || label === 'handlebars' || label === 'razor') {
        return new HtmlWorker();
      }
      if (label === 'typescript' || label === 'javascript') {
        return new TsWorker();
      }
      return new EditorWorker();
    },
  };
}

onMounted(async () => {
  if (!containerEl.value) return
  await nextTick()

  editor.value = monaco.editor.create(containerEl.value, {
    value:    props.modelValue ?? '',
    language: MONACO_LANG[lang.value],
    theme:    'vs-dark',

    // ── НАСТРОЙКИ ПОДСКАЗОК ───────────────────────────────────
    suggest: {
      showKeywords: true,
      showSnippets: true,
      showClasses: true,
      showFunctions: true,
      showVariables: true,
      showModules: true,
      showProperties: true,
      showWords: true,
      showIcons: true,
      showColors: true,
    },
    suggestOnTriggerCharacters: true,
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true,
    },
    quickSuggestionsDelay: 100,
    acceptSuggestionOnEnter: 'on',
    acceptSuggestionOnCommitCharacter: true,
    tabCompletion: 'on',
    wordBasedSuggestions: 'allDocuments',
    parameterHints: { enabled: true },
    inlineSuggest: { enabled: true },

    // ── Форматирование ───────────────────────────────────────
    formatOnType:  true,
    formatOnPaste: true,
    autoIndent:    'full',
    autoClosingBrackets: 'always',
    autoClosingQuotes:   'always',
    autoSurround:        'languageDefined',

    // ── Вид ──────────────────────────────────────────────────
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

    // ── Минимализм ───────────────────────────────────────────
    minimap:            { enabled: false },
    scrollbar:          { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
    overviewRulerLanes:  0,
    lineNumbers:        'on',
    glyphMargin:        false,
    folding:            true,
    wordWrap:           'off',
  })

  editor.value.onDidChangeModelContent(() => {
    emit('update:modelValue', editor.value!.getValue())
  })

  editor.value.addCommand(
    monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
    () => emit('save', editor.value!.getValue()),
  )

  emit('ready')
})

onBeforeUnmount(() => {
  editor.value?.dispose()
})

watch(() => props.modelValue, (newVal) => {
  if (!editor.value || newVal === undefined) return
  if (newVal !== editor.value.getValue()) {
    const pos = editor.value.getPosition()
    editor.value.setValue(newVal)
    if (pos) editor.value.setPosition(pos)
  }
})

watch(() => props.initialLanguage, (newLang) => {
  if (!newLang || !editor.value) return
  lang.value = newLang
  const model = editor.value.getModel()
  if (model) {
    monaco.editor.setModelLanguage(model, MONACO_LANG[newLang])
  }
})
</script>

<template>
  <div class="w-full h-full bg-[#1e1e1e] flex flex-col overflow-hidden rounded-xl border border-zinc-700 ring-1 ring-white/5">
    <div class="px-4 py-2 bg-[#2d2d2d] border-b border-black/30 flex items-center gap-2 select-none shrink-0">
      <span class="w-2.5 h-2.5 rounded-full bg-amber-500/40 border border-amber-500/60" />
      <span class="text-xs font-medium text-zinc-400">{{ FILE_NAMES[lang] }}</span>
    </div>
    <div ref="containerEl" class="flex-1 overflow-hidden" />
  </div>
</template>