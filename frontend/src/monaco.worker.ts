// src/monaco.worker.ts
// Устанавливаем MonacoEnvironment на window ГЛАВНОГО потока —
// до того как monaco.editor.create() запросит воркеры.

window.MonacoEnvironment = {
  getWorker(_: unknown, label: string): Worker {
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/html/html.worker', import.meta.url),
        { type: 'module' },
      )
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/css/css.worker', import.meta.url),
        { type: 'module' },
      )Q
    }
    if (label === 'javascript' || label === 'typescript') {
      return new Worker(
        new URL('monaco-editor/esm/vs/language/typescript/ts.worker', import.meta.url),
        { type: 'module' },
      )
    }
    return new Worker(
      new URL('monaco-editor/esm/vs/editor/editor.worker', import.meta.url),
      { type: 'module' },
    )
  },
}