<!-- components/coder/AutocompletePopup.vue -->
<!-- Попап автодополнения в стиле VS Code.                          -->
<!-- Ничего не знает о редакторе — только отображение и события.   -->

<script setup lang="ts">
import { computed } from 'vue'
import type { CompletionItem } from '@/types/coder'

// ─── Props & Emits ────────────────────────────────────────────────────────────

const props = defineProps<{
  items:       CompletionItem[]
  activeIndex: number
  x:           number
  y:           number
}>()

const emit = defineEmits<{
  (e: 'select',    item: CompletionItem): void
  (e: 'hover',     index: number):        void
}>()

// ─── Метаданные иконок / цветов ───────────────────────────────────────────────

interface TypeMeta { icon: string; color: string; bg: string; label: string }

const TYPE_META: Record<string, TypeMeta> = {
  tag:       { icon: '◈', color: '#569cd6', bg: 'rgba(86,156,214,.15)',  label: 'Element'   },
  attribute: { icon: '⚙', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Attribute' },
  value:     { icon: '≡', color: '#4ec9b0', bg: 'rgba(78,201,176,.15)',  label: 'Value'     },
  class:     { icon: '.', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Class'     },
  snippet:   { icon: '⚡', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Snippet'   },
  property:  { icon: '▣', color: '#9cdcfe', bg: 'rgba(156,220,254,.15)', label: 'Property'  },
  keyword:   { icon: 'K', color: '#c586c0', bg: 'rgba(197,134,192,.15)', label: 'Keyword'   },
  method:    { icon: 'ƒ', color: '#dcdcaa', bg: 'rgba(220,220,170,.15)', label: 'Method'    },
}

const tm = (type: string): TypeMeta =>
  TYPE_META[type] ?? { icon: '○', color: '#858585', bg: 'rgba(133,133,133,.1)', label: type }

const activeItem = computed(() => props.items[props.activeIndex] as CompletionItem | undefined)
</script>

<template>
  <Transition name="vsc-fade">
    <div
      v-if="items.length"
      class="vsc-popup"
      :style="{ left: x + 'px', top: (y + 22) + 'px' }"
      @mousedown.prevent
    >
      <!-- ── Список ── -->
      <ul class="vsc-list" role="listbox" aria-label="Подсказки">
        <li
          v-for="(item, i) in items"
          :key="item.label + i"
          role="option"
          :aria-selected="i === activeIndex"
          class="vsc-item"
          :class="{ 'vsc-item-active': i === activeIndex }"
          @mousedown.prevent="emit('select', item)"
          @mousemove="emit('hover', i)"
        >
          <span
            class="vsc-icon"
            :style="{
              color:       tm(item.type).color,
              background:  tm(item.type).bg,
              borderColor: tm(item.type).color + '55',
            }"
          >{{ tm(item.type).icon }}</span>
          <span class="vsc-label">{{ item.label }}</span>
          <span class="vsc-kind" :style="{ color: tm(item.type).color + 'aa' }">
            {{ tm(item.type).label }}
          </span>
        </li>
      </ul>

      <!-- ── Панель описания ── -->
      <div v-if="activeItem?.description" class="vsc-detail">
        <p class="vsc-detail-type" :style="{ color: tm(activeItem.type).color }">
          {{ tm(activeItem.type).label }}
        </p>
        <p class="vsc-detail-desc">{{ activeItem.description }}</p>
        <p class="vsc-detail-keys">
          <kbd>↑↓</kbd> выбор &nbsp;·&nbsp;
          <kbd>↵</kbd> <kbd>Tab</kbd> вставить &nbsp;·&nbsp;
          <kbd>Esc</kbd> закрыть
        </p>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.vsc-popup {
  position: absolute;
  z-index: 50;
  display: flex;
  flex-direction: row;
  box-shadow: 0 8px 40px rgba(0,0,0,.8), 0 2px 8px rgba(0,0,0,.5);
  font-family: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;
  font-size: 13px;
  pointer-events: all;
}

/* ── Список ── */
.vsc-list {
  list-style: none;
  margin: 0;
  padding: 2px 0;
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
.vsc-list::-webkit-scrollbar       { width: 5px; }
.vsc-list::-webkit-scrollbar-thumb { background: #424242; border-radius: 3px; }

.vsc-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 1px 8px 1px 4px;
  cursor: pointer;
  height: 22px;
  white-space: nowrap;
  overflow: hidden;
  color: #cccccc;
  user-select: none;
}
.vsc-item:hover             { background: #2a2d2e; }
.vsc-item-active            { background: #094771 !important; }
.vsc-item-active .vsc-label { color: #fff; }

.vsc-icon {
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid;
  font-size: 11px;
  font-weight: 800;
  line-height: 1;
}
.vsc-label { flex: 1; overflow: hidden; text-overflow: ellipsis; font-size: 13px; color: #cccccc; }
.vsc-kind  { font-size: 11px; flex-shrink: 0; color: #888; }

/* ── Панель описания ── */
.vsc-detail {
  background: #1e1e1e;
  border: 1px solid #454545;
  border-left: none;
  border-radius: 0 4px 4px 0;
  width: 220px;
  max-height: 220px;
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: hidden;
}
.vsc-detail-type {
  margin: 0;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  font-family: system-ui, sans-serif;
}
.vsc-detail-desc {
  margin: 0;
  font-size: 12px;
  color: #cccccc;
  line-height: 1.55;
  font-family: system-ui, sans-serif;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 5;
  line-clamp: 5;
  -webkit-box-orient: vertical;
}
.vsc-detail-keys {
  margin: auto 0 0;
  font-size: 10px;
  color: #666;
  font-family: system-ui, sans-serif;
}
.vsc-detail-keys kbd {
  background: #3a3a3a;
  border: 1px solid #555;
  border-radius: 2px;
  padding: 0 3px;
  font-size: 9px;
  color: #aaa;
}

/* ── Анимация ── */
.vsc-fade-enter-active,
.vsc-fade-leave-active { transition: opacity 80ms ease, transform 80ms ease; }
.vsc-fade-enter-from,
.vsc-fade-leave-to     { opacity: 0; transform: translateY(-3px); }
</style>
