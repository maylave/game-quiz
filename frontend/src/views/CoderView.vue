<script setup lang="ts">
import InputCode from '@/components/coder/inputCode.vue'
import Header from '@/components/Header.vue'
import type { Language } from '@/composables/useCodeIntelligence'; // Импортируем тип, если он экспортирован
import { computed, ref } from 'vue'

const myCode = ref('<h1>Hello</h1>')
const currentLang = ref<Language>('html') 

const handleLangChange = (lang: Language) => {
  console.log('Язык изменен на:', lang)
  currentLang.value = lang
}

const handleSave = (code: string) => {
  console.log('Сохраняем код:', code)
  // Тут логика сохранения
}

// Логика отображения превью в зависимости от языка
const previewContent = computed(() => {
  if (currentLang.value === 'html') {
    return myCode.value
  } else if (currentLang.value === 'css') {
    // Для CSS создаем простую HTML-структуру и применяем стили
    return `
      <style>${myCode.value}</style>
      <div class="demo-box">
        <h1>CSS Preview</h1>
        <p>This is a demo element to show your styles.</p>
        <button class="demo-btn">Button</button>
      </div>
    `
  } else if (currentLang.value === 'javascript') {
    // Для JS просто показываем сообщение, так как выполнение JS в v-html ограничено
    return `
      <div style="padding: 20px; color: #666;">
        <p>JavaScript execution in preview is limited for security.</p>
        <p>Open browser console (F12) to see output.</p>
        <script>
          try {
            ${myCode.value}
          } catch (e) {
            console.error("Preview Error:", e);
          }
        <\/script>
      </div>
    `
  }
  return myCode.value
})
</script>

<template>
  <div class="min-h-screen bg-zinc-900 font-sans text-zinc-100 selection:bg-amber-500/30 flex flex-col overflow-hidden">
    <div class="fixed inset-0 opacity-20 pointer-events-none z-0"
      style="background-image: radial-gradient(circle, #52525b 1px, transparent 1px); background-size: 28px 28px;"></div>

    <Header />

    <main class="flex-1 flex items-center justify-center p-6 z-10 relative">
      <div class="flex gap-5 w-full max-w-7xl h-[650px]">
        
        <!-- Редактор -->
        <div class="w-1/2 h-full">
          <InputCode 
            v-model="myCode" 
            :initial-language="'html'"
            @change-language="handleLangChange"
            @save="handleSave"
          />
        </div>
        
        <!-- PREVIEW -->
        <div class="bg-white w-1/2 border border-zinc-700 rounded-xl shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/5">
           <div class="px-4 py-2 bg-gray-100 border-b border-gray-200 flex items-center gap-2">
            <div class="w-2 h-2 rounded-full bg-blue-500"></div>
            <span class="text-xs font-bold text-gray-600 uppercase tracking-wide">Live Preview ({{ currentLang.toUpperCase() }})</span>
          </div>
          <!-- Используем computed свойство previewContent -->
          <div class="p-6 text-gray-800 overflow-auto h-full bg-white" v-html="previewContent"></div>
        </div>

      </div>
    </main>
  </div>
</template>