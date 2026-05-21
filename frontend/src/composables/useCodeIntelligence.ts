// src/composables/useCodeIntelligence.ts
import { ref } from 'vue'

export type Language = 'html' | 'css' | 'javascript'

export interface CompletionItem {
  label: string
  type: 'tag' | 'attribute' | 'value' | 'class' | 'snippet' | 'property' | 'method' | 'keyword'
  description?: string
  insertText?: string
}

// --- HTML ---
const HTML_TAGS: CompletionItem[] = [
  { label: 'div', type: 'tag', description: 'Блочный контейнер' },
  { label: 'span', type: 'tag', description: 'Строчный контейнер' },
  { label: 'a', type: 'tag', description: 'Ссылка' },
  { label: 'img', type: 'tag', description: 'Изображение' },
  { label: 'input', type: 'tag', description: 'Поле ввода' },
  { label: 'button', type: 'tag', description: 'Кнопка' },
  { label: 'h1', type: 'tag', description: 'Заголовок H1' },
  { label: 'p', type: 'tag', description: 'Параграф' },
  { label: 'ul', type: 'tag', description: 'Список UL' },
  { label: 'li', type: 'tag', description: 'Элемент списка LI' },
  { label: 'style', type: 'tag', description: 'Вставка CSS' },
  { label: 'script', type: 'tag', description: 'Вставка JS' },
]

const GLOBAL_ATTRIBUTES: CompletionItem[] = [
  { label: 'class', type: 'attribute', description: 'CSS классы' },
  { label: 'id', type: 'attribute', description: 'ID элемента' },
  { label: 'style', type: 'attribute', description: 'Инлайн стили' },
  { label: 'src', type: 'attribute', description: 'Источник (src)' },
  { label: 'href', type: 'attribute', description: 'Ссылка (href)' },
]

const ATTR_VALUES: Record<string, CompletionItem[]> = {
  type: [
    { label: 'text', type: 'value', description: 'Текстовое поле' },
    { label: 'password', type: 'value', description: 'Пароль' },
    { label: 'email', type: 'value', description: 'Email адрес' },
    { label: 'number', type: 'value', description: 'Число' },
    { label: 'submit', type: 'value', description: 'Кнопка отправки' },
    { label: 'button', type: 'value', description: 'Обычная кнопка' },
    { label: 'checkbox', type: 'value', description: 'Чекбокс' },
    { label: 'radio', type: 'value', description: 'Радио кнопка' },
  ],
  target: [
    { label: '_blank', type: 'value', description: 'Новая вкладка' },
    { label: '_self', type: 'value', description: 'Текущая вкладка' },
  ]
}

const HTML_SNIPPETS: CompletionItem[] = [
  { 
    label: '!', 
    type: 'snippet', 
    description: 'HTML5 Boilerplate',
    insertText: `<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>` 
  },
]

// --- CSS ---
const CSS_PROPERTIES: CompletionItem[] = [
  { label: 'color', type: 'property', description: 'Цвет текста' },
  { label: 'background-color', type: 'property', description: 'Цвет фона' },
  { label: 'font-size', type: 'property', description: 'Размер шрифта' },
  { label: 'margin', type: 'property', description: 'Внешний отступ' },
  { label: 'padding', type: 'property', description: 'Внутренний отступ' },
  { label: 'display', type: 'property', description: 'Тип отображения' },
  { label: 'flex', type: 'property', description: 'Flexbox контейнер' },
  { label: 'grid', type: 'property', description: 'Grid контейнер' },
  { label: 'width', type: 'property', description: 'Ширина' },
  { label: 'height', type: 'property', description: 'Высота' },
  { label: 'border', type: 'property', description: 'Граница' },
  { label: 'border-radius', type: 'property', description: 'Скругление углов' },
  { label: 'box-shadow', type: 'property', description: 'Тень блока' },
  { label: 'transition', type: 'property', description: 'Анимация перехода' },
  { label: 'transform', type: 'property', description: 'Трансформация' },
]

const CSS_VALUES: Record<string, CompletionItem[]> = {
  display: [
    { label: 'block', type: 'value' },
    { label: 'inline', type: 'value' },
    { label: 'inline-block', type: 'value' },
    { label: 'flex', type: 'value' },
    { label: 'grid', type: 'value' },
    { label: 'none', type: 'value' },
  ],
  position: [
    { label: 'static', type: 'value' },
    { label: 'relative', type: 'value' },
    { label: 'absolute', type: 'value' },
    { label: 'fixed', type: 'value' },
    { label: 'sticky', type: 'value' },
  ]
}

const CSS_SNIPPETS: CompletionItem[] = [
  {
    label: 'flex-center',
    type: 'snippet',
    description: 'Flexbox centering',
    insertText: 'display: flex;\njustify-content: center;\nalign-items: center;'
  },
  {
    label: 'reset',
    type: 'snippet',
    description: 'CSS Reset basic',
    insertText: '* {\n  margin: 0;\n  padding: 0;\n  box-sizing: border-box;\n}'
  }
]

// --- JavaScript ---
const JS_KEYWORDS: CompletionItem[] = [
  { label: 'const', type: 'keyword', description: 'Объявление константы' },
  { label: 'let', type: 'keyword', description: 'Объявление переменной' },
  { label: 'var', type: 'keyword', description: 'Объявление переменной (устарело)' },
  { label: 'function', type: 'keyword', description: 'Объявление функции' },
  { label: 'if', type: 'keyword', description: 'Условие if' },
  { label: 'else', type: 'keyword', description: 'Иначе' },
  { label: 'for', type: 'keyword', description: 'Цикл for' },
  { label: 'while', type: 'keyword', description: 'Цикл while' },
  { label: 'return', type: 'keyword', description: 'Возврат значения' },
  { label: 'console.log', type: 'method', description: 'Вывод в консоль' },
  { label: 'document.getElementById', type: 'method', description: 'Получить элемент по ID' },
  { label: 'addEventListener', type: 'method', description: 'Добавить обработчик события' },
]

const JS_SNIPPETS: CompletionItem[] = [
  {
    label: 'log',
    type: 'snippet',
    description: 'Console log',
    insertText: 'console.log($1);'
  },
  {
    label: 'func',
    type: 'snippet',
    description: 'Function declaration',
    insertText: 'function $1($2) {\n  $3\n}'
  },
  {
    label: 'arrow',
    type: 'snippet',
    description: 'Arrow function',
    insertText: 'const $1 = ($2) => {\n  $3\n};'
  }
]

// --- ЛОГИКА ---

export function useCodeIntelligence(previewHtml: string, currentLanguage: Language = 'html') {
  const suggestions = ref<CompletionItem[]>([])
  const showSuggestions = ref(false)
  const cursorCoords = ref({ x: 0, y: 0 })

  const extractClassesFromPreview = (html: string): string[] => {
    const regex = /class=["']([^"']*)["']/g
    const classes = new Set<string>()
    let match
    while ((match = regex.exec(html)) !== null) {
      match[1].split(/\s+/).forEach(c => {
        if (c) classes.add(c)
      })
    }
    return Array.from(classes)
  }

  const findCompletions = (textBeforeCursor: string, currentTagName: string | null): CompletionItem[] => {
    let results: CompletionItem[] = []

    // --- HTML CONTEXT ---
    if (currentLanguage === 'html') {
      // Сниппеты
      const snippetMatch = textBeforeCursor.match(/(?:^|\s)(!|html:5)$/)
      if (snippetMatch) {
         return HTML_SNIPPETS.filter(s => s.label.startsWith(snippetMatch[1]))
      }

      // Значения атрибутов
      const valueMatch = textBeforeCursor.match(/(\w+)="([^"]*)$/)
      if (valueMatch) {
        const attrName = valueMatch[1].toLowerCase()
        const typedVal = valueMatch[2] ?? ""
        
        if (ATTR_VALUES[attrName]) {
          return ATTR_VALUES[attrName].filter(v => v.label.startsWith(typedVal))
        }
        return []
      }

      // CSS классы
      const classMatch = textBeforeCursor.match(/class="([^"]*)$/)
      if (classMatch) {
        const typedClass = classMatch[1].split(' ').pop() ?? ""
        const availableClasses = extractClassesFromPreview(previewHtml)
        const matchedClasses = availableClasses.filter(c => c.startsWith(typedClass))
        
        return matchedClasses.map(c => ({
          label: c,
          type: 'class',
          description: 'Found in Preview'
        }))
      }

      // Теги и атрибуты
      const wordMatch = textBeforeCursor.match(/(?:^|\s|<)([a-zA-Z\-]*)$/)
      if (!wordMatch || !wordMatch[1]) return []

      const typed = wordMatch[1].toLowerCase()
      const isAttrContext = textBeforeCursor.trim().endsWith(' ') || (currentTagName && textBeforeCursor.includes(' '))
      
      if (isAttrContext && currentTagName) {
         results = GLOBAL_ATTRIBUTES.filter(a => a.label.startsWith(typed))
      } else {
         results = HTML_TAGS.filter(t => t.label.startsWith(typed))
      }
    }

    // --- CSS CONTEXT ---
    else if (currentLanguage === 'css') {
      // Сниппеты
      const snippetMatch = textBeforeCursor.match(/(?:^|\s)([a-zA-Z\-]+)$/)
       if (snippetMatch) {
         const typedSnippet = snippetMatch[1]
         const foundSnippets = CSS_SNIPPETS.filter(s => s.label.startsWith(typedSnippet))
         if (foundSnippets.length > 0) return foundSnippets
       }

      // Свойства CSS
      const propMatch = textBeforeCursor.match(/(?:^|\s|;|\{)([a-zA-Z\-]*)$/)
      if (propMatch && propMatch[1]) {
        const typed = propMatch[1].toLowerCase()
        return CSS_PROPERTIES.filter(p => p.label.startsWith(typed))
      }

      // Значения CSS (после :)
      const valueMatch = textBeforeCursor.match(/:\s*([a-zA-Z\-]*)$/)
      if (valueMatch) {
        // Нужно определить, для какого свойства мы подбираем значение
        // Это сложно без полного парсера, сделаем упрощенно: проверим последние несколько строк
        const lines = textBeforeCursor.split('\n')
        const lastLine = lines[lines.length - 1]
        const propNameMatch = lastLine.match(/([a-zA-Z\-]+)\s*:/)
        
        if (propNameMatch) {
          const propName = propNameMatch[1]?.toLowerCase()
          const typedVal = valueMatch[1]?.toLowerCase()
          if (CSS_VALUES[propName]) {
            return CSS_VALUES[propName].filter(v => v.label.startsWith(typedVal))
          }
        }
      }
    }

    // --- JAVASCRIPT CONTEXT ---
    else if (currentLanguage === 'javascript') {
      // Сниппеты
      const snippetMatch = textBeforeCursor.match(/(?:^|\s)([a-zA-Z]+)$/)
       if (snippetMatch) {
         const typedSnippet = snippetMatch[1]
         const foundSnippets = JS_SNIPPETS.filter(s => s.label.startsWith(typedSnippet))
         if (foundSnippets.length > 0) return foundSnippets
       }

      // Ключевые слова и методы
      const wordMatch = textBeforeCursor.match(/(?:^|\s|\.|;|\(|\{)([a-zA-Z.]*)$/)
      if (wordMatch && wordMatch[1]) {
        const typed = wordMatch[1].toLowerCase()
        return JS_KEYWORDS.filter(k => k.label.toLowerCase().startsWith(typed))
      }
    }

    return results.slice(0, 6)
  }

  const getCurrentTagName = (textBeforeCursor: string): string | null => {
    // Работает только для HTML
    if (currentLanguage !== 'html') return null
    const match = textBeforeCursor.match(/<([a-zA-Z][a-zA-Z0-9]*)[^>]*$/)
    return match ? match[1].toLowerCase() : null
  }

  return {
    suggestions,
    showSuggestions,
    cursorCoords,
    findCompletions,
    getCurrentTagName
  }
}