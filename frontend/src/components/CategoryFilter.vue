<template>
  <div class="flex flex-wrap gap-2 mb-6">
    <button 
      @click="$emit('select', null)"
      :class="selectedCategory === null ? 'bg-amber-500 text-zinc-900 border-amber-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'"
      class="px-4 py-1.5 rounded-full text-xs font-bold border transition-all"
    >
      Все
    </button>
    
    <button 
      v-for="cat in categories" 
      :key="cat"
      @click="$emit('select', cat)"
      :class="selectedCategory === cat ? 'bg-amber-500 text-zinc-900 border-amber-500' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:border-zinc-500'"
      class="px-4 py-1.5 rounded-full text-xs font-bold border transition-all"
    >
      {{ cat }}
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  tests: {
    type: Array,
    default: () => []
  },
  selectedCategory: {
    type: [String, null],
    default: null
  }
})

defineEmits(['select'])

// Автоматически собираем уникальные категории из тестов
const categories = computed(() => {
  const cats = new Set(props.tests.map(t => t.category).filter(Boolean))
  return Array.from(cats).sort()
})
</script>