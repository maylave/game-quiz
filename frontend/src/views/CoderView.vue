<script setup lang="ts">
import InputCode from '@/components/coder/inputCode.vue'
import Header from '@/components/Header.vue'
import type { Language } from '@/types/coder'
import { ref, watch } from 'vue'

const myCode      = ref('<h1>Hello</h1>')
const currentLang = ref<Language>('html')
const previewFrame = ref<HTMLIFrameElement | null>(null)

const handleLangChange = (lang: Language) => { currentLang.value = lang }
const handleSave       = (code: string)   => { console.log('Сохраняем:', code) }

// ─── Сборка HTML для iframe ───────────────────────────────────────────────────

function buildPreviewHtml(code: string, lang: Language): string {
  if (lang === 'html') return code

  if (lang === 'css') return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { cursor: none !important; }
  body { font-family: sans-serif; padding: 16px; }
  ${code}
</style></head>
<body>
  <div class="container">
    <h1 class="title">CSS Preview</h1>
    <p class="description">Демо-элементы для отображения стилей.</p>
    <button class="demo-btn">Button</button>
    <ul class="demo-list">
      <li class="demo-item">Элемент списка 1</li>
      <li class="demo-item">Элемент списка 2</li>
    </ul>
    <a href="#" class="demo-link">Ссылка</a>
  </div>
</body></html>`

  // javascript
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<style>
  * { cursor: none !important; }
  body { font-family: monospace; padding: 16px; background: #1e1e1e; color: #d4d4d4; }
  #output { white-space: pre-wrap; line-height: 1.6; }
  .log-line  { padding: 2px 0; }
  .log-error { color: #f48771; }
  .log-warn  { color: #cca700; }
</style></head>
<body>
  <div id="output"></div>
  <script>
    const out = document.getElementById('output');
    const line = (text, cls = 'log-line') => {
      const el = document.createElement('div');
      el.className = cls;
      el.textContent = text;
      out.appendChild(el);
    };
    const fmt = a => { try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a) } catch { return String(a) } };
    console.log   = (...a) => line('> '  + a.map(fmt).join(' '));
    console.warn  = (...a) => line('⚠ '  + a.join(' '), 'log-line log-warn');
    console.error = (...a) => line('✖ '  + a.join(' '), 'log-line log-error');
    try { ${code} } catch(e) { line('✖ ' + e.message, 'log-line log-error'); }
  <\/script>
</body></html>`
}

// ─── Debounce: превью обновляется через 400мс после последнего символа ────────

let previewTimer = 0

function schedulePreview(code: string, lang: Language): void {
  clearTimeout(previewTimer)
  previewTimer = window.setTimeout(() => {
    const frame = previewFrame.value
    if (frame) frame.srcdoc = buildPreviewHtml(code, lang)
  }, 400)
}

// При смене языка — обновляем сразу (пользователь ждёт переключения)
watch(currentLang, lang => {
  clearTimeout(previewTimer)
  const frame = previewFrame.value
  if (frame) frame.srcdoc = buildPreviewHtml(myCode.value, lang)
})

// При вводе — debounce 400мс
watch(myCode, code => schedulePreview(code, currentLang.value))

// Первый рендер после монтирования iframe
const onFrameLoad = () => {
  if (previewFrame.value)
    previewFrame.value.srcdoc = buildPreviewHtml(myCode.value, currentLang.value)
}
</script>

<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30 flex flex-col overflow-hidden">
    <div
      class="fixed inset-0 opacity-20 pointer-events-none z-0"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"
    />

    <Header />

    <main class="p-6 z-10 relative">
      <div class="py-3 px-4 w-full bg-gray-700 flex border rounded-xl my-4 items-center gap-2">
        <span class="text-lg text-blue-200 font-bold">Задание 1</span>
        <span>Задание 1</span>
      </div>

      <div class="flex gap-5 w-full h-160">

        <!-- Редактор -->
        <div class="w-full h-full">
          <InputCode
            v-model="myCode"
            :language="currentLang"
            @change-language="handleLangChange"
            @save="handleSave"
          />
        </div>

        <!-- Preview -->
        <div class="bg-white w-full border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
          <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2 shrink-0">
            <div class="w-2 h-2 rounded-full bg-blue-500" />
            <span class="text-xs font-bold text-gray-600 uppercase tracking-wide">
              Live Preview ({{ currentLang.toUpperCase() }})
            </span>
          </div>

          <iframe
            ref="previewFrame"
            class="w-full flex-1 border-none cursor-none"
            sandbox="allow-scripts"
            title="Preview"
            @load="onFrameLoad"
          />
        </div>

      </div>
    </main>
  </div>
</template>