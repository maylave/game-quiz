// src/composables/useEditorCore.ts
import { escapeHtml, getCaretOffset, setCaretOffset } from '@/utils/caret'
import Prism from 'prismjs'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-javascript'
import { ref, watch, type Ref } from 'vue'
import type { Language } from './useCodeIntelligence'

const PRISM_LANG_MAP: Record<Language, string> = {
	html: 'markup',
	css: 'css',
	javascript: 'javascript'
}

export function useEditorCore(
	code: Ref<string>,
	language: Ref<Language>,
	emitUpdate: (val: string) => void
) {
	const editorRef = ref<HTMLElement | null>(null)

	const applyHighlight = () => {
		const el = editorRef.value
		if (!el) return

		const text = el.innerText
		const caretPos = getCaretOffset(el)

		let highlighted: string
		try {
			const grammar = Prism.languages[PRISM_LANG_MAP[language.value]]
			highlighted = grammar
				? Prism.highlight(text, grammar, PRISM_LANG_MAP[language.value])
				: escapeHtml(text)
		} catch {
			highlighted = escapeHtml(text)
		}

		// Предотвращаем лишние перерисовки если контент не изменился
		if (el.innerHTML !== highlighted) {
			el.innerHTML = highlighted
			setCaretOffset(el, caretPos)
		}

		if (code.value !== text) {
			code.value = text
			emitUpdate(text)
		}
	}

	const setInitialContent = (content: string) => {
		if (editorRef.value) {
			editorRef.value.innerText = content
			applyHighlight()
		}
	}

	// Синхронизация внешнего modelValue с внутренним состоянием DOM
	watch(code, newVal => {
		if (editorRef.value && document.activeElement !== editorRef.value) {
			setInitialContent(newVal)
		}
	})

	return {
		editorRef,
		applyHighlight,
		setInitialContent
	}
}
