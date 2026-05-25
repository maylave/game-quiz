<!-- src/components/CodeSuggestions.vue -->
<script setup lang="ts">
import type { CompletionItem } from '@/composables/useCodeIntelligence'
import { computed } from 'vue'

const props = defineProps<{
  visible: boolean
  items: CompletionItem[]
  activeIndex: number
  coords: { x: number; y: number }
}>()

const emit = defineEmits<{
  select: [item: CompletionItem]
  hover: [index: number]
}>()

const TYPE_META: Record<string, { icon: string; color: string; bg: string; label: string }> = {
  tag:       { icon: '◈', color: '#569cd6', bg: 'rgba(86,156,214,.15)',  label: 'Element' },
  attribute: { icon: '⚙', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Attribute' },
  value:     { icon: '≡', color: '#4ec9b0', bg: 'rgba(78,201,176,.15)',  label: 'Value' },
  class:     { icon: '.', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Class' },
  snippet:   { icon: '⚡', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Snippet' },
  property:  { icon: '▣', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Property' },
  keyword:   { icon: 'K', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Keyword' },
  method:    { icon: 'ƒ', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Method' },
}

const getMeta = (type: string) => TYPE_META[type] ?? { icon: '○', color: '#858585', bg: 'rgba(133,133,133,.1)', label: type }
const activeItem = computed(() => props.items[props.activeIndex])
</script>

<template>
  <div v-if="visible && items.length" class="vsc-popup absolute z-50"
       :style="{ left: coords.x + 'px', top: (coords.y + 22) + 'px' }">
    <ul class="vsc-list" role="listbox">
      <li v-for="(item, i) in items" :key="item.label + i" role="option"
          class="vsc-item" :class="{ 'vsc-item-active': i === activeIndex }"
          @mousedown.prevent="emit('select', item)"
          @mousemove="emit('hover', i)">
        <span class="vsc-icon" 
              :style="{ color: getMeta(item.type).color, background: getMeta(item.type).bg, borderColor: getMeta(item.type).color + '55' }">
          {{ getMeta(item.type).icon }}
        </span>
        <span class="vsc-label">{{ item.label }}</span>
        <span class="vsc-kind" :style="{ color: getMeta(item.type).color + 'aa' }">{{ getMeta(item.type).label }}</span>
      </li>
    </ul>

    <div v-if="activeItem?.description" class="vsc-detail">
      <p class="vsc-detail-type" :style="{ color: getMeta(activeItem.type).color }">{{ getMeta(activeItem.type).label }}</p>
      <p class="vsc-detail-desc">{{ activeItem.description }}</p>
      <p class="vsc-detail-keys">
        <kbd>↑↓</kbd> выбор · <kbd>↵</kbd> <kbd>Tab</kbd> вставить · <kbd>Esc</kbd> закрыть
      </p>
    </div>
  </div>
</template>

<!-- Глобальные стили для попапа остаются без изменений -->
<style>
/* ... (твои существующие стили .vsc-popup, .vsc-list и т.д.) ... */
</style>