<script setup lang="ts">
import CodeEditor from '@/components/coder/inputCode.vue'
import Header from '@/components/Header.vue'
import type { Language } from '@/types/coder'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

// ─── Код каждого языка хранится отдельно ──────────────────────────────────────
const codes = {
  html:       ref('<h1 class="title">Hello!</h1>\n<p class="desc">Начни писать код...</p>\n<button class="btn" onclick="handleClick()">Нажми меня</button>'),
  css:        ref('body {\n  font-family: sans-serif;\n  \n  min-height: 100vh;\n  margin: 0;\n  background: #0f172a;\n  color: #e2e8f0;\n}\n.title { font-size: 2rem; font-weight: 700; color: #38bdf8; }\n.desc  { color: #94a3b8; margin: 0.5rem 0 1.5rem; }\n.btn   {\n  padding: 0.5rem 1.5rem;\n  background: #38bdf8;\n  color: #0f172a;\n  border: none;\n  border-radius: 0.5rem;\n  font-size: 1rem;\n  cursor: pointer;\n  transition: opacity .2s;\n}\n.btn:hover { opacity: 0.8; }'),
  javascript: ref('function handleClick() {\n  const title = document.querySelector(".title")\n  title.style.color = `hsl(${Math.random() * 360}, 80%, 60%)`\n  console.log("Цвет изменён!")\n}'),
}

const currentLang  = ref<Language>('html')
const previewFrame = ref<HTMLIFrameElement | null>(null)
const frameReady   = ref(false)
const editorReady  = ref(false)

const TABS: { lang: Language; label: string; active: string; dot: string }[] = [
  { lang: 'html',       label: 'HTML', active: 'bg-orange-500 text-black',  dot: 'bg-orange-400' },
  { lang: 'css',        label: 'CSS',  active: 'bg-cyan-500 text-black',    dot: 'bg-cyan-400'   },
  { lang: 'javascript', label: 'JS',   active: 'bg-yellow-400 text-black',  dot: 'bg-yellow-400' },
]

// ─── Превью ───────────────────────────────────────────────────────────────────

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

    <div class="flex-1 flex overflow-hidden p-3 gap-3 min-h-0">

      <!-- ─── Левая панель: табы + редактор ─── -->
      <div class="flex-1 flex flex-col min-w-0 gap-2">

        <!-- Табы языков -->
        <div class="flex items-center gap-1 bg-zinc-800/80 rounded-lg p-1 w-fit">
          <button
            v-for="tab in TABS"
            :key="tab.lang"
            @click="currentLang = tab.lang"
            :class="[
              'flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all duration-150',
              currentLang === tab.lang
                ? tab.active + ' shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700',
            ]"
          >
            <span
              :class="['w-1.5 h-1.5 rounded-full', currentLang === tab.lang ? 'bg-current opacity-60' : tab.dot + ' opacity-40']"
            />
            {{ tab.label }}
          </button>
        </div>

        <!-- Редактор — один экземпляр, меняем model-value и язык -->
        <div class="flex-1 min-h-0">
          <CodeEditor
            :model-value="codes[currentLang].value"
            :initial-language="currentLang"
            @update:model-value="codes[currentLang].value = $event"
            @ready="onEditorReady"
          />
        </div>
      </div>

      <!-- ─── Правая панель: превью ─── -->
      <div class="flex-1 flex flex-col min-w-0 gap-2">

        <!-- Заголовок превью -->
        <div class="flex items-center gap-2 px-1 h-8">
          <div class="w-2 h-2 rounded-full bg-blue-400" />
          <span class="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Live Preview</span>
        </div>

        <!-- iframe -->
        <div class="flex-1 min-h-0 bg-white rounded-xl overflow-hidden border border-zinc-700 ring-1 ring-white/5">
          <iframe
            ref="previewFrame"
            src="/preview-frame.html"
            class="w-full h-full border-none"
            sandbox="allow-scripts allow-same-origin"
            title="Preview"
            @load="onFrameLoad"
          />
        </div>
      </div>

    </div>
  </div>
</template>