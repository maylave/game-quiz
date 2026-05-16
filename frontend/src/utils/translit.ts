// @/utils/translit.ts

export const generateLoginFromName = (name: string): string => {
	if (!name) return ''

	const translitMap: Record<string, string> = {
		а: 'a',
		б: 'b',
		в: 'v',
		г: 'g',
		д: 'd',
		е: 'e',
		ё: 'yo',
		ж: 'zh',
		з: 'z',
		и: 'i',
		й: 'y',
		к: 'k',
		л: 'l',
		м: 'm',
		н: 'n',
		о: 'o',
		п: 'p',
		р: 'r',
		с: 's',
		т: 't',
		у: 'u',
		ф: 'f',
		х: 'kh',
		ц: 'ts',
		ч: 'ch',
		ш: 'sh',
		щ: 'sch',
		ъ: '',
		ы: 'y',
		ь: '',
		э: 'e',
		ю: 'yu',
		я: 'ya',
		' ': '_'
	}

	// 1. Транслитерация
	let result = name
		.toLowerCase()
		.split('')
		.map(char => translitMap[char] || char)
		.join('')

	result = result.replace(/[^a-z0-9_]/g, '')

	const randomNum = Math.floor(Math.random() * 1000)

	return `${result}_${randomNum}`
}
