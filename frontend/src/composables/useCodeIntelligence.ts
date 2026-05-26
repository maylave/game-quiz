// composables/useCodeIntelligence.ts
import type { CompletionItem, Language, SubLang } from '@/types/coder'

import { CSS_PROPERTIES, CSS_SNIPPETS, CSS_VALUES } from '@/list/css'
import { ATTR_VALUES, GLOBAL_ATTRIBUTES, HTML_TAGS } from '@/list/html'
import { JS_KEYWORDS, JS_METHODS, JS_SNIPPETS } from '@/list/javaScript'

// ─── HTML сниппеты (специфичны для этого composable) ─────────────────────────

const HTML_SNIPPETS: CompletionItem[] = [
  {
    label: '!',
    type: 'snippet',
    description: 'HTML5 Boilerplate',
    insertText: '<!DOCTYPE html>\n<html lang="ru">\n<head>\n  <meta charset="UTF-8">\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n  <title>Document</title>\n</head>\n<body>\n  \n</body>\n</html>',
  },
  {
    label: 'table:3',
    type: 'snippet',
    description: 'Таблица с 3 колонками',
    insertText: '<table>\n  <thead>\n    <tr>\n      <th>Заголовок 1</th><th>Заголовок 2</th><th>Заголовок 3</th>\n    </tr>\n  </thead>\n  <tbody>\n    <tr>\n      <td></td><td></td><td></td>\n    </tr>\n  </tbody>\n</table>',
  },
  {
    label: 'form:login',
    type: 'snippet',
    description: 'Форма входа',
    insertText: '<form action="#" method="post">\n  <label for="email">Email</label>\n  <input id="email" type="email" name="email" required>\n  <label for="pass">Пароль</label>\n  <input id="pass" type="password" name="password" required>\n  <button type="submit">Войти</button>\n</form>',
  },
]

// ─── Определение суб-языка внутри HTML ───────────────────────────────────────

export function detectSubLang(fullTextBeforeCursor: string): SubLang {
  const lastStyleOpen  = fullTextBeforeCursor.lastIndexOf('<style')
  const lastScriptOpen = fullTextBeforeCursor.lastIndexOf('<script')

  if (lastStyleOpen === -1 && lastScriptOpen === -1) return 'html'

  const isStyleLast   = lastStyleOpen > lastScriptOpen
  const openTagIndex  = isStyleLast ? lastStyleOpen : lastScriptOpen
  const closeTagIndex = fullTextBeforeCursor.lastIndexOf(isStyleLast ? '</style' : '</script')
  const candidate: SubLang = isStyleLast ? 'css-block' : 'js-block'

  // Закрывающий тег идёт после открывающего — мы снаружи блока
  if (closeTagIndex > openTagIndex) return 'html'

  // Ещё не прошли '>' открывающего тега — курсор в атрибутах тега
  const afterOpen  = fullTextBeforeCursor.slice(openTagIndex)
  const bracketPos = afterOpen.indexOf('>')
  if (bracketPos === -1 || fullTextBeforeCursor.length <= openTagIndex + bracketPos) return 'html'

  // Инлайн style="..." имеет приоритет над блоками
  if (/style="[^"]*$/.test(fullTextBeforeCursor)) return 'css-inline'

  return candidate
}

// ─── Контекст курсора ─────────────────────────────────────────────────────────

type Context =
  | { kind: 'html' }
  | { kind: 'css' }
  | { kind: 'js' }
  | { kind: 'css-inline'; cssText: string } // содержимое после style="

function resolveContext(lang: Language, fullText: string): Context {
  if (lang === 'css')        return { kind: 'css' }
  if (lang === 'javascript') return { kind: 'js' }

  const sub = detectSubLang(fullText)
  if (sub === 'css-block')  return { kind: 'css' }
  if (sub === 'js-block')   return { kind: 'js' }
  if (sub === 'css-inline') {
    // cssText — всё после последнего style=" до курсора
    const idx = fullText.lastIndexOf('style="')
    return { kind: 'css-inline', cssText: idx >= 0 ? fullText.slice(idx + 7) : fullText }
  }

  return { kind: 'html' }
}

// ─── Единая публичная функция ─────────────────────────────────────────────────

export function findCompletions(
  textBefore: string,      // текст текущей text-ноды до курсора
  fullTextBefore: string,  // весь текст редактора до курсора
  lang: Language,
  previewHtml = '',
): CompletionItem[] {
  const ctx = resolveContext(lang, fullTextBefore)

  switch (ctx.kind) {
    case 'css':        return searchCss(fullTextBefore)
    case 'js':         return searchJs(fullTextBefore)
    case 'css-inline': return searchCss(ctx.cssText)
    case 'html':       return searchHtml(fullTextBefore, previewHtml)
  }
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

function searchHtml(t: string, previewHtml: string): CompletionItem[] {
  // Сниппеты: ! / html:5 / table:3 / form:login
  const snipWord = t.match(/(?:^|[\s>])([!a-zA-Z:0-9]+)$/)?.[1] ?? ''
  if (snipWord) {
    const found = HTML_SNIPPETS.filter(s => s.label.startsWith(snipWord))
    if (found.length) return found
  }

  // Значения атрибутов (включая class="...")
  const attrValMatch = t.match(/\b([\w-]+)="([^"]*)$/)
  if (attrValMatch) {
    const key  = attrValMatch[1]!.toLowerCase()
    const word = attrValMatch[2]!

    if (key === 'class') {
      const last = word.split(' ').at(-1) ?? ''
      return extractClasses(previewHtml)
        .filter(c => c.startsWith(last))
        .map(c => ({ label: c, type: 'class' as const, description: 'Из Preview' }))
    }

    const vals = ATTR_VALUES[key]
    return vals ? vals.filter(v => v.label.startsWith(word)) : []
  }

  // Атрибуты внутри открытого тега
  const attrMatch = t.match(/<[a-zA-Z][\w]*(?:\s[^>]*)?\s([\w-]*)$/)
  if (attrMatch) {
    const word = attrMatch[1]!.toLowerCase()
    return GLOBAL_ATTRIBUTES.filter(a => a.label.startsWith(word)).slice(0, 8)
  }

  // Теги после <
  const tagMatch = t.match(/<\/?([a-zA-Z]*)$/)
  if (tagMatch) {
    const word = tagMatch[1]!.toLowerCase()
    return HTML_TAGS.filter(tag => tag.label.startsWith(word)).slice(0, 8)
  }

  return []
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

function searchCss(t: string): CompletionItem[] {
  // Значения: display: fle
  const valMatch = t.match(/([\w-]+)\s*:\s*([\w-]*)$/)
  if (valMatch) {
    const prop = valMatch[1]!.toLowerCase()
    const word = valMatch[2]!.toLowerCase()
    const vals = CSS_VALUES[prop]
    return vals ? vals.filter(v => v.label.startsWith(word)) : []
  }

  // Свойства / сниппеты: после { ; \n или в начале
  const propMatch = t.match(/(?:^|\{|;|\n)\s*([\w-]*)$/)
  if (propMatch) {
    const word = propMatch[1]!.toLowerCase()
    if (!word) return CSS_PROPERTIES.slice(0, 8)
    const snips = CSS_SNIPPETS.filter(s => s.label.startsWith(word))
    if (snips.length) return snips
    return CSS_PROPERTIES.filter(p => p.label.startsWith(word)).slice(0, 10)
  }

  return []
}

// ─── JavaScript ───────────────────────────────────────────────────────────────

function searchJs(t: string): CompletionItem[] {
  const word = (t.match(/([\w$][\w$.]*)$/)?.[1] ?? '').toLowerCase()
  if (!word) return []

  const snips = JS_SNIPPETS.filter(s => s.label.toLowerCase().startsWith(word))
  if (snips.length) return snips

  const methods = JS_METHODS.filter(m => m.label.toLowerCase().startsWith(word)).slice(0, 10)
  if (methods.length) return methods

  return JS_KEYWORDS.filter(k => k.label.toLowerCase().startsWith(word)).slice(0, 8)
}

// ─── Утилиты ──────────────────────────────────────────────────────────────────

function extractClasses(html: string): string[] {
  const re = /class=["']([^"']*)["']/g
  const set = new Set<string>()
  let m: RegExpExecArray | null
  while ((m = re.exec(html))) m[1]!.split(/\s+/).forEach(c => c && set.add(c))
  return [...set]
}

export function getCurrentTagName(textBefore: string, lang: Language): string {
  if (lang !== 'html') return ''
  const m = textBefore.match(/<([a-zA-Z][a-zA-Z0-9]*)(?:\s[^>]*)?$/)
  return m ? m[1]!.toLowerCase() : ''
}