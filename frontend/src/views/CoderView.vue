<!-- src/views/CoderView.vue -->
<script setup lang="ts">
import CodeEditor from '@/components/coder/inputCode.vue'
import Header from '@/components/Header.vue'
import type { Language } from '@/types/coder'
import { Pane, Splitpanes } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ─── Режимы ───────────────────────────────────────────────────────────────────
type Mode = 'free' | 'course'
const currentMode = ref<Mode>('free')
const isVisible = ref(true)
interface LessonTask {
  title:       string
  description: string
  initialCode: Record<Language, string>
  lockedLines: Record<Language, number[]>
}

const currentLesson = ref<LessonTask | null>(null)

const demoLesson: LessonTask = {
  title:       'Урок 1: Твоя первая кнопка',
  description: 'Напиши текст кнопки "Click Me". Не удаляй существующие теги.',
  initialCode: {
    html:       '<div class="container">\n  <h1>Привет!</h1>\n  <button class="btn">\n    <!-- Напиши текст кнопки здесь -->\n  </button>\n</div>',
    css:        '.container {\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  margin-top: 50px;\n}\n.btn {\n  padding: 10px 20px;\n  background: #38bdf8;\n  border: none;\n  border-radius: 5px;\n  cursor: pointer;\n}',
    javascript: '// JS пока не нужен\nconsole.log("Урок начался!");',
  },
  lockedLines: { html: [1, 2, 4, 6, 7], css: [], javascript: [] },
}

const toggleLesson = () =>
{
  isVisible.value= !isVisible.value
}

// ─── Код редакторов ───────────────────────────────────────────────────────────
const codes = {
  html:       ref(''),
  css:        ref(''),
  javascript: ref(''),
}

function resetToFreeCode() {
  currentLesson.value    = null
  codes.html.value       = '<h1 class="title">Hello!</h1>\n<p class="desc">Начни писать код...</p>\n<button class="btn" onclick="handleClick()">Нажми меня</button>'
  codes.css.value        = 'body {\n  font-family: sans-serif;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  min-height: 100vh;\n  margin: 0;\n  background: #0f172a;\n  color: #e2e8f0;\n}\n.title { font-size: 2rem; font-weight: 700; color: #38bdf8; }\n.desc  { color: #94a3b8; margin: 0.5rem 0 1.5rem; }\n.btn   {\n  padding: 0.5rem 1.5rem;\n  background: #38bdf8;\n  color: #0f172a;\n  border: none;\n  border-radius: 0.5rem;\n  font-size: 1rem;\n  cursor: pointer;\n}'
  codes.javascript.value = 'function handleClick() {\n  const title = document.querySelector(".title")\n  title.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`\n}'
}

function loadLesson(lesson: LessonTask) {
  currentLesson.value    = lesson
  codes.html.value       = lesson.initialCode.html
  codes.css.value        = lesson.initialCode.css
  codes.javascript.value = lesson.initialCode.javascript
}

function toggleMode() {
  if (currentMode.value === 'free') {
    currentMode.value = 'course'
    loadLesson(demoLesson)
  } else {
    currentMode.value = 'free'
    resetToFreeCode()
  }
}

resetToFreeCode()

// ─── Табы языков ──────────────────────────────────────────────────────────────
const currentLang = ref<Language>('html')

const TABS: { lang: Language; label: string; active: string; dot: string }[] = [
  { lang: 'html',       label: 'HTML', active: 'bg-orange-500 text-black', dot: 'bg-orange-400' },
  { lang: 'css',        label: 'CSS',  active: 'bg-cyan-500 text-black',   dot: 'bg-cyan-400'   },
  { lang: 'javascript', label: 'JS',   active: 'bg-yellow-400 text-black', dot: 'bg-yellow-400' },
]

// ─── Layout ───────────────────────────────────────────────────────────────────
// horizontal = панели сверху вниз, !horizontal = слева направо
const isHorizontal = ref(false)
const showEditor   = ref(true)
const showPreview  = ref(true)
const editorSize   = ref(50)
const previewSize  = ref(50)

function toggleLayout() {
  isHorizontal.value = !isHorizontal.value
}

function togglePanel(panel: 'editor' | 'preview') {
  if (panel === 'editor') {
    showEditor.value = !showEditor.value
  } else {
    showPreview.value = !showPreview.value
  }
  // Пересчитываем размеры
  if (showEditor.value && showPreview.value) {
    editorSize.value = 50; previewSize.value = 50
  } else if (showEditor.value) {
    editorSize.value = 100; previewSize.value = 0
  } else {
    editorSize.value = 0; previewSize.value = 100
  }
}

function onSplitResize(e: { size: number }[]) {
  editorSize.value  = e[0]?.size ?? 50
  previewSize.value = e[1]?.size ?? 50
}

// ─── Превью ───────────────────────────────────────────────────────────────────
const previewFrame = ref<HTMLIFrameElement | null>(null)
const frameReady   = ref(false)
const editorReady  = ref(false)

function renderPreview(): void {
  const frame = previewFrame.value
  if (!frame?.contentWindow || !frameReady.value) return
  frame.contentWindow.postMessage({
    type: 'preview-update',
    html: codes.html.value,
    css:  codes.css.value,
    js:   codes.javascript.value,
  }, '*')
}

function tryRender(): void {
  if (frameReady.value && editorReady.value) renderPreview()
}

function onWindowMessage(e: MessageEvent): void {
  if (e.data?.type === 'frame-ready' || e.data?.type === 'pong') {
    frameReady.value = true
    tryRender()
  }
}

onMounted(()       => window.addEventListener('message', onWindowMessage))
onBeforeUnmount(() => window.removeEventListener('message', onWindowMessage))

function onEditorReady(): void { editorReady.value = true; tryRender() }
function onFrameLoad(): void   { previewFrame.value?.contentWindow?.postMessage({ type: 'ping' }, '*') }

let previewTimer = 0
watch([codes.html, codes.css, codes.javascript], () => {
  clearTimeout(previewTimer)
  previewTimer = window.setTimeout(renderPreview, 400)
})
</script>

<template>
  <div class="h-screen bg-zinc-900 font-sans text-zinc-100 flex flex-col overflow-hidden">
    <Header />

    <!-- ─── Тулбар ─── -->
    <div class="px-3 py-2 bg-zinc-900/60 border-b border-gray-600/30 flex justify-end items-center gap-2 shrink-0 animate-glow-shadow">

      <!-- Режим обучения -->

      <!-- Переключение layout: горизонт / вертикаль -->
      <div class="flex items-center gap-1 bg-zinc-700/60 rounded-lg p-1">
        <!-- Вертикальный (слева направо) -->
        <button
          @click="isHorizontal = false"
          :class="[
            'p-1.5 rounded-md transition-all',
            !isHorizontal ? 'bg-zinc-500 text-white' : 'text-zinc-500 hover:text-zinc-300',
          ]"
          title="Панели слева направо"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <rect x="1" y="2" width="6" height="12" rx="1" opacity="0.9"/>
            <rect x="9" y="2" width="6" height="12" rx="1" opacity="0.9"/>
          </svg>
        </button>
        <!-- Горизонтальный (сверху вниз) -->
        <button
          @click="isHorizontal = true"
          :class="[
            'p-1.5 rounded-md transition-all',
            isHorizontal ? 'bg-zinc-500 text-white' : 'text-zinc-500 hover:text-zinc-300',
          ]"
          title="Панели сверху вниз"
        >
          <svg class="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
            <rect x="2" y="1" width="12" height="6" rx="1" opacity="0.9"/>
            <rect x="2" y="9" width="12" height="6" rx="1" opacity="0.9"/>
          </svg>
        </button>
      </div>

      <div class="w-px h-4 bg-zinc-700" />

      <!-- Показать/скрыть панели -->
      <div class="flex items-center gap-1 bg-zinc-700/60 rounded-lg p-1">
        <button
          @click="togglePanel('editor')"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
            showEditor ? 'bg-zinc-500 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
          ]"
          title="Показать/скрыть редактор"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"/>
          </svg>
          Код
        </button>

        <button
          @click="togglePanel('preview')"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
            showPreview ? 'bg-zinc-500 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
          ]"
          title="Показать/скрыть превью"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
          </svg>
          Preview
        </button>
          <div class="w-px h-4 bg-zinc-700" />
         <button
        @click="toggleMode"
        
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
          currentMode === 'course'
           ? 'bg-blue-500/50 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300',
        ]"
      >
        <!-- <span>{{ currentMode === 'course' ? '🎓' : '✍️' }}</span> -->
        {{ currentMode === 'course' ? 'Обучение' : 'Свободно' }}
      </button>
      </div>
    </div>

    <!-- ─── Splitpanes ─── -->
    <Splitpanes
      :horizontal="isHorizontal"
      class="flex-1 min-h-0"
      @resize="onSplitResize"
    >
      <!-- ─── Панель редактора ─── -->
      <Pane
        v-if="showEditor"
        :size="editorSize"
        :min-size="15"
        class="flex flex-col gap-2 min-w-0 min-h-0"
        :style="{ padding: '12px' }"
      >
        <!-- Табы языков -->
         <div class="flex justify-end"> <div class="flex items-center  gap-1 bg-zinc-800 rounded-lg p-1 w-fit shrink-0  ">
          <button
            v-for="tab in TABS"
            :key="tab.lang"
            @click="currentLang = tab.lang"
            :class="[
              'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all',
              currentLang === tab.lang
                ? tab.active
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700',
            ]"
          >
            <span :class="[
              'w-1.5 h-1.5 rounded-full',
              currentLang === tab.lang ? 'bg-current opacity-70' : tab.dot + ' opacity-40',
            ]" />
            {{ tab.label }}
          </button>
        </div></div>
       

        <!-- Редактор -->
        <div class="flex-1 min-h-0 relative">
          <CodeEditor
            :model-value="codes[currentLang].value"
            :initial-language="currentLang"
            :mode="currentMode"
            :locked-lines="currentLesson?.lockedLines[currentLang] ?? []"
            @update:model-value="codes[currentLang].value = $event"
            @ready="onEditorReady"
          />

          <!-- Бейдж режима курса -->
          
        </div>
      </Pane>

      <!-- ─── Панель превью ─── -->
    <Pane
  v-if="showPreview"
  :size="previewSize"
  :min-size="15"
  class="flex flex-col gap-3 min-w-0 min-h-0" 
  :style="{ padding: '12px' }"
>
  

  <div 
    class="flex justify-between p-2  rounded-lg border border-zinc-700/50 bg-zinc-800/30 backdrop-blur-sm transition-all hover:border-zinc-600
    "
  :class="currentMode === 'course' ? 'justify-between' : 'justify-end  items-center'"
    
  >
    <div v-if="currentMode === 'course'" class="blur-2xl w-full h-full bg-blue-400/20 absolute rounded-3xl border-3xl "  ></div>



  <button 
    v-if="currentMode === 'course'"
    @click="toggleLesson"
    class="absolute left-1/2 -translate-x-1/2 z-20 flex items-center justify-center px-3 py-1.5 rounded-b-xl border-x border-b border-blue-700/10 bg-blue-800/15 text-zinc-400 hover:text-zinc-200 hover:bg-blue-700/50 transition-all shadow-md backdrop-blur-md"
    :class="!isVisible ? 'bottom-6 rotate-180' : '-bottom-1'" 
    title="Свернуть/Развернуть задание"
  >

    <svg class="" width="13" height="7" viewBox="0 0 13 7" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M0.853553 0.146447C0.658291 -0.0488155 0.341709 -0.0488155 0.146447 0.146447C-0.0488155 0.341709 -0.0488155 0.658291 0.146447 0.853553L0.5 0.5L0.853553 0.146447ZM0.5 0.5L0.146447 0.853553L6.14645 6.85355L6.5 6.5L6.85355 6.14645L0.853553 0.146447L0.5 0.5Z" fill="white"/>
<path d="M11.4394 0.146447C11.6346 -0.0488155 11.9512 -0.0488155 12.1465 0.146447C12.3417 0.341709 12.3417 0.658291 12.1465 0.853553L11.7929 0.5L11.4394 0.146447ZM11.7929 0.5L12.1465 0.853553L6.14646 6.85355L5.79291 6.5L5.43935 6.14645L11.4394 0.146447L11.7929 0.5Z" fill="white"/>
</svg>

  </button>
    <!-- Информация об уроке -->
    <div class="flex flex-col gap-1 min-w-0 pr-4" :class="isVisible ? 'max-h-20 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'"
      v-if="currentMode === 'course' && currentLesson ">
      <div class="flex items-center gap-2">
        <!-- Маленькая иконка или индикатор типа "Задание" -->
        <span class="flex items-center justify-center w-5 h-5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-bold">
          ТЗ
        </span>
        <span class="text-xs font-semibold text-zinc-200 truncate" :title="currentLesson.title">
          {{ currentLesson.title }}
        </span>
      </div>
      <span class="text-[11px] text-zinc-500 truncate leading-tight" :title="currentLesson.description">
        {{ currentLesson.description }}
      </span>
    </div>

    <!-- Статус Live Preview -->
    <div class="flex items-center gap-2 pl-2 border-l border-zinc-700/50">
      <div class="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)] animate-pulse" />
      <span class="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Live</span>
    </div>
  </div>

  <!-- iframe -->
  <div class="flex-1 min-h-0 bg-white rounded-xl overflow-hidden border border-zinc-700 shadow-lg relative group">
    <!-- Опционально: оверлей при загрузке или тултип -->
    <iframe
      ref="previewFrame"
      src="/preview-frame.html"
      class="w-full h-full border-none"
      sandbox="allow-scripts allow-same-origin"
      title="Preview"
      @load="onFrameLoad"
    />
  </div>
</Pane>

    </Splitpanes>
  </div>
</template>

<style scoped>
  @keyframes glow-shadow {
    0%, 100%{
      box-shadow: 0 0 5px rgba(12, 32, 48, 0.3);
      
    }
    50%{
        box-shadow: 0 0 10px rgba(53, 116, 168, 0.3);
   
    }
  }
  .animate-glow-shadow{
    animation: glow-shadow 10s infinite ease-in-out;
  }
/* ─── Разделитель вертикальный (панели слева направо) ─── */
.splitpanes--vertical > .splitpanes__splitter {
  width: 5px !important;
  background: #3f3f46 !important;
  cursor: col-resize;
  transition: background 0.15s;
  position: relative;
}
.splitpanes--vertical > .splitpanes__splitter:hover {
  background: #71717a !important;
}
.splitpanes--vertical > .splitpanes__splitter::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 2px;
  height: 40px;
  border-radius: 2px;
  background: #a1a1aa;
  opacity: 0;
  transition: opacity 0.15s;
}
.splitpanes--vertical > .splitpanes__splitter:hover::after {
  opacity: 1;
}

/* ─── Разделитель горизонтальный (панели сверху вниз) ─── */
.splitpanes--horizontal > .splitpanes__splitter {
  height: 5px !important;
  background: #3f3f46 !important;
  cursor: row-resize;
  transition: background 0.15s;
  position: relative;
}
.splitpanes--horizontal > .splitpanes__splitter:hover {
  background: #71717a !important;
}
.splitpanes--horizontal > .splitpanes__splitter::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  height: 2px;
  width: 40px;
  border-radius: 2px;
  background: #a1a1aa;
  opacity: 0;
  transition: opacity 0.15s;
}
.splitpanes--horizontal > .splitpanes__splitter:hover::after {
  opacity: 1;
}
</style>