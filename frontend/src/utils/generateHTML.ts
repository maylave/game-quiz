// utils/generateHTML.ts
// Собирает HTML для iframe-превью в зависимости от языка.

import type { Language } from '@/types/coder'

// ─── CSS: демо-разметка для отображения стилей ────────────────────────────────

const CSS_DEMO_BODY = `
  <div class="container">
    <h1 class="title">CSS Preview</h1>
    <p class="description">Демо-элементы для отображения стилей.</p>
    <button class="demo-btn">Button</button>
    <ul class="demo-list">
      <li class="demo-item">Элемент списка 1</li>
      <li class="demo-item">Элемент списка 2</li>
    </ul>
    <a href="#" class="demo-link">Ссылка</a>
  </div>`

// ─── JS: перехват console для вывода в iframe ─────────────────────────────────

const JS_CONSOLE_SHIM = `
  const out = document.getElementById('output')
  const line = (text, cls = 'log-line') => {
    const el = document.createElement('div')
    el.className = cls
    el.textContent = text
    out.appendChild(el)
  }
  const fmt = a => {
    try { return typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a) }
    catch { return String(a) }
  }
  console.log   = (...a) => line('> '  + a.map(fmt).join(' '))
  console.warn  = (...a) => line('⚠ '  + a.join(' '), 'log-line log-warn')
  console.error = (...a) => line('✖ '  + a.join(' '), 'log-line log-error')`

// ─── Базовый шаблон ───────────────────────────────────────────────────────────

function base(head: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${head}
</head>
<body>
  ${body}
</body>
</html>`
}

// ─── Публичная функция ────────────────────────────────────────────────────────

export function generateHTML(code: string, lang: Language): string {
  switch (lang) {

    case 'html':
      return base('', code)

    case 'css':
      return base(
        `<style>
    * { cursor: none !important; }
    body { font-family: sans-serif; padding: 16px; }
    ${code}
  </style>`,
        CSS_DEMO_BODY,
      )

    case 'javascript':
      return base(
        `<style>
    * { cursor: none !important; }
    body { font-family: monospace; padding: 16px; background: #1e1e1e; color: #d4d4d4; }
    #output { white-space: pre-wrap; line-height: 1.6; }
    .log-line  { padding: 2px 0; }
    .log-error { color: #f48771; }
    .log-warn  { color: #cca700; }
  </style>`,
        `<div id="output"></div>
  <script>
    ${JS_CONSOLE_SHIM}
    try { ${code} } catch (e) { line('✖ ' + e.message, 'log-line log-error') }
  <\/script>`,
      )
  }
}