// Простые функции для работы с фильтром текста
let textFilterModule = null
let textFilterInitialized = false

// Инициализация фильтра текста
async function initTextFilter(customBadWords = null) {
	if (textFilterInitialized) return

	try {
		// Загружаем WASM модуль
		textFilterModule = await loadWasmModule(
			'text_filter.js',
			'text_filter.wasm'
		)

		// Инициализируем функции
		window.init_text_filter = textFilterModule.cwrap(
			'init_text_filter',
			null,
			[]
		)
		window.load_bad_words = textFilterModule.cwrap('load_bad_words', null, [
			'string',
		])
		window.check_text = textFilterModule.cwrap('check_text', 'number', [
			'string',
		])
		window.add_bad_word = textFilterModule.cwrap('add_bad_word', null, [
			'string',
		])
		window.clear_bad_words = textFilterModule.cwrap('clear_bad_words', null, [])
		window.get_bad_words_count = textFilterModule.cwrap(
			'get_bad_words_count',
			'number',
			[]
		)

		// Инициализируем фильтр
		window.init_text_filter()

		// Загружаем кастомные слова если есть
		if (customBadWords && Array.isArray(customBadWords)) {
			loadBadWords(customBadWords)
		}

		textFilterInitialized = true
		console.log('✅ Text Filter initialized')
	} catch (error) {
		console.error('❌ Failed to initialize Text Filter:', error)
		throw error
	}
}

// Загрузка списка запрещенных слов
function loadBadWords(words) {
	if (!textFilterInitialized) throw new Error('Text Filter not initialized')
	const wordsString = words.join(',')
	window.load_bad_words(wordsString)
}

// Проверка текста
function checkText(text) {
	if (!textFilterInitialized) throw new Error('Text Filter not initialized')

	const result = window.check_text(text)
	if (result === 1) {
		return {
			allowed: false,
			reason: 'Сообщение содержит запрещенные слова',
		}
	}

	return { allowed: true, reason: '' }
}

// Добавление слова в черный список
function addBadWord(word) {
	if (!textFilterInitialized) throw new Error('Text Filter not initialized')
	window.add_bad_word(word)
}

// Очистка черного списка
function clearBadWords() {
	if (!textFilterInitialized) throw new Error('Text Filter not initialized')
	window.clear_bad_words()
}

// Получение количества запрещенных слов
function getBadWordsCount() {
	if (!textFilterInitialized) throw new Error('Text Filter not initialized')
	return window.get_bad_words_count()
}

// Проверка сообщения с выбрасыванием ошибки
function validateMessage(message) {
	const result = checkText(message)
	if (!result.allowed) {
		throw new Error(result.reason)
	}
	return true
}
