
export type Language = 'html' | 'css' | 'javascript'

// Суб-язык внутри HTML документа
export type SubLang = 'html' | 'css-inline' | 'css-block' | 'js-block'

export interface CompletionItem {
  label: string
  type: 'tag' | 'attribute' | 'value' | 'class' | 'snippet' | 'property' | 'method' | 'keyword'
  description?: string
  insertText?: string
}