/// <reference types="vite/client" />
declare module '*.vue' {
	import type { DefineComponent } from 'vue'
	const component: DefineComponent<{}, {}, any>
	export default component
}
// src/types/prism.d.ts

declare module 'prismjs' {
	const Prism: any
	export default Prism
}

declare module 'prismjs/components/*' {
	const component: any
	export default component
}

declare module 'prismjs/themes/*' {
	const theme: string
	export default theme
}
