// composables/useEditorState.ts

import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import { ref } from 'vue'
import { findCompletions, type CompletionItem, type Language } from './useCodeIntelligence'

const PRISM_LANG: Record<Language, string> = {
  html: 'markup',
  css: 'css',
  javascript: 'javascript',
}

function escapeHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// ─── Курсор ───────────────────────────────────────────────────────────────────

function getCaretOffset(el: HTMLElement): number {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return 0
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset)
  return range.toString().length
}

function setCaretOffset(el: HTMLElement, offset: number): void {
  const sel = window.getSelection()
  if (!sel) return

  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
  let remaining = offset
  let node: Text | null = null

  while (walker.nextNode()) {
    const t = walker.currentNode as Text
    if (remaining <= t.length) { node = t; break }
    remaining -= t.length
  }

  const range = document.createRange()
  if (node) {
    range.setStart(node, remaining)
  } else {
    range.selectNodeContents(el)
    range.collapse(false)
  }
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

// Весь plain-text редактора до позиции курсора (для findCompletions)
function getFullTextBeforeCaret(el: HTMLElement): string {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return ''
  const range = sel.getRangeAt(0).cloneRange()
  range.selectNodeContents(el)
  range.setEnd(sel.getRangeAt(0).startContainer, sel.getRangeAt(0).startOffset)
  return range.toString()
}

// Text-нода и offset под курсором (для applySuggestion)
function getCaretInTextNode(): { node: Text; offset: number } | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null

  const range = sel.getRangeAt(0)
  if (range.startContainer.nodeType === Node.TEXT_NODE) {
    return { node: range.startContainer as Text, offset: range.startOffset }
  }

  // Курсор на элементе (после innerHTML замены) — берём последнюю text-ноду слева
  const child = range.startContainer.childNodes[range.startOffset - 1] ?? range.startContainer.firstChild
  if (!child) return null
  const walker = document.createTreeWalker(child, NodeFilter.SHOW_TEXT)
  let last: Text | null = null
  while (walker.nextNode()) last = walker.currentNode as Text
  if (!last) return null
  return { node: last, offset: last.length }
}

// ─── Composable ───────────────────────────────────────────────────────────────

export function useEditorState(initialCode: string, initialLang: Language) {
  const code            = ref(initialCode)
  const lang            = ref<Language>(initialLang)
  const suggestions     = ref<CompletionItem[]>([])
  const showSuggestions = ref(false)
  const activeIndex     = ref(0)
  const cursorCoords    = ref({ x: 0, y: 0 })

  // ── Подсветка ────────────────────────────────────────────────────────────
  // Правило: innerHTML меняем ТОЛЬКО если результат подсветки изменился.
  // Это устраняет мигание — курсор и DOM не трогаются без причины.
  // immediate=true: вставка подсказки, смена языка (нужно сразу).
  // immediate=false (default): ввод с клавиатуры — debounce 200мс.

  let highlightTimer = 0
  let lastHighlighted = ''   // кэш последнего innerHTML

  function applyHighlight(el: HTMLElement, immediate = false): void {
    // Текст сохраняем сразу — превью не ждёт debounce
    code.value = el.innerText

    const run = () => {
      const text = el.innerText

      let highlighted: string
      try {
        const grammar = Prism.languages[PRISM_LANG[lang.value]]
        highlighted   = grammar ? Prism.highlight(text, grammar, PRISM_LANG[lang.value]) : escapeHtml(text)
      } catch {
        highlighted = escapeHtml(text)
      }

      // Главный трюк: не трогаем DOM если HTML не изменился
      if (highlighted === lastHighlighted) return
      lastHighlighted = highlighted

      const caretPos = getCaretOffset(el)
      el.innerHTML   = highlighted
      setCaretOffset(el, caretPos)
    }

    clearTimeout(highlightTimer)
    if (immediate) {
      run()
    } else {
      highlightTimer = window.setTimeout(run, 200)
    }
  }

  function setCode(el: HTMLElement, newCode: string): void {
    el.innerText = newCode
    code.value   = newCode
    applyHighlight(el, true) // при внешней установке — сразу, без мерцания
  }

  // ── Подсказки ─────────────────────────────────────────────────────────────

  function updateSuggestions(editorEl: HTMLElement, containerEl: HTMLElement, previewHtml = ''): void {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) { showSuggestions.value = false; return }

    const range         = sel.getRangeAt(0)
    const rect          = range.getBoundingClientRect()
    const containerRect = containerEl.getBoundingClientRect()
    cursorCoords.value  = { x: rect.left - containerRect.left, y: rect.top - containerRect.top }

    const fullText = getFullTextBeforeCaret(editorEl)
    const found    = findCompletions('', fullText, lang.value, previewHtml)

    if (found.length > 0) {
      suggestions.value     = found
      activeIndex.value     = 0
      showSuggestions.value = true
    } else {
      showSuggestions.value = false
    }
  }

  function closeSuggestions(): void { showSuggestions.value = false }

  function moveSuggestion(delta: 1 | -1): void {
    const len = suggestions.value.length
    activeIndex.value = (activeIndex.value + delta + len) % len
  }

  // ── Применение подсказки ──────────────────────────────────────────────────

  function applySuggestion(item: CompletionItem, editorEl: HTMLElement): void {
    editorEl.focus()

    const caret = getCaretInTextNode()
    if (!caret) return

    const { node: textNode, offset: caretOffset } = caret
    const text = textNode.textContent ?? ''
    const ch   = (i: number) => text.charAt(i)

    let startOffset = caretOffset
    let insertion   = ''
    let cursorAfter = 0

    switch (item.type) {
      case 'snippet': {
        const kStart = caretOffset - item.label.length
        if (kStart >= 0 && text.slice(kStart, caretOffset) === item.label) startOffset = kStart
        insertion   = item.insertText ?? ''
        cursorAfter = startOffset + insertion.length
        break
      }
      case 'class': {
        while (startOffset > 0 && !/[\s"]/.test(ch(startOffset - 1))) startOffset--
        insertion   = item.label
        cursorAfter = startOffset + item.label.length
        break
      }
      case 'value': {
        while (startOffset > 0 && ch(startOffset - 1) !== '"' && ch(startOffset - 1) !== ':' && ch(startOffset - 1) !== ' ') startOffset--
        insertion   = item.label
        cursorAfter = startOffset + item.label.length
        break
      }
      case 'tag': {
        while (startOffset > 0 && /[a-zA-Z-]/.test(ch(startOffset - 1))) startOffset--
        if (startOffset > 0 && ch(startOffset - 1) === '<') startOffset--
        insertion   = `<${item.label}></${item.label}>`
        cursorAfter = startOffset + item.label.length + 2
        break
      }
      case 'attribute': {
        while (startOffset > 0 && /[a-zA-Z-]/.test(ch(startOffset - 1))) startOffset--
        const sp    = startOffset > 0 && ch(startOffset - 1) !== ' ' && ch(startOffset - 1) !== '<' ? ' ' : ''
        insertion   = `${sp}${item.label}=""`
        cursorAfter = startOffset + sp.length + item.label.length + 2
        break
      }
      case 'property': {
        while (startOffset > 0 && /[a-zA-Z-]/.test(ch(startOffset - 1))) startOffset--
        insertion   = `${item.label}: ;`
        cursorAfter = startOffset + item.label.length + 2
        break
      }
      case 'keyword':
      case 'method': {
        while (startOffset > 0 && /[a-zA-Z_$.]/.test(ch(startOffset - 1))) startOffset--
        insertion   = item.label
        cursorAfter = startOffset + item.label.length
        break
      }
    }

    const before = text.slice(0, startOffset)
    const after  = text.slice(caretOffset)
    textNode.textContent = before + insertion + after

    const sel = window.getSelection()!
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.setStart(textNode, Math.min(cursorAfter, (before + insertion).length))
    newRange.collapse(true)
    sel.addRange(newRange)

    applyHighlight(editorEl, true) // после вставки — сразу
    showSuggestions.value = false
  }

  return {
    code, lang,
    suggestions, showSuggestions, activeIndex, cursorCoords,
    applyHighlight, setCode,
    updateSuggestions, closeSuggestions, moveSuggestion, applySuggestion,
  }
}