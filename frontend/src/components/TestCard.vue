<template>
  <div class="bg-zinc-800 border border-zinc-700 rounded-xl p-5 flex flex-col gap-4 hover:border-amber-500/50 transition group relative overflow-hidden shadow-lg hover:shadow-amber-500/10 h-full">
    <!-- Background Icon -->
    <div class="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
       <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor" class="text-zinc-100"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
    </div>

    <div>
      <div class="flex justify-between items-start mb-2">
        <span v-if="test.category" class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-700">
          {{ test.category }}
        </span>
      </div>
      <h3 class="font-bold text-lg text-zinc-100 leading-tight">{{ test.title }}</h3>
      <p class="text-xs text-zinc-500 mt-2 line-clamp-2 min-h-[2.5em]">{{ test.description || 'Описание отсутствует' }}</p>
    </div>
    
    <div class="flex items-center gap-3 text-xs text-zinc-400 font-mono mt-auto pt-2">
      <span class="flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        {{ test.questions?.length || 0 }} вопр.
      </span>
      <span v-if="test.shuffle" class="text-amber-500/80 flex items-center gap-1 bg-zinc-900/50 px-2 py-1 rounded">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/></svg>
        Random
      </span>
    </div>

    <button @click="$emit('start', test)" 
      class="mt-2 w-full py-2.5 rounded-lg bg-zinc-700 hover:bg-amber-500 hover:text-zinc-900 text-zinc-200 text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:translate-y-[-2px]">
      <span>Начать</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
    </button>
  </div>
</template>

<script setup>
defineProps({
  test: {
    type: Object,
    required: true
  }
})

defineEmits(['start'])
</script>