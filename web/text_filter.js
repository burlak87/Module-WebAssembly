class TextFilter {
	constructor() {
		this.module = null
		this.isInitialized = false
	}

	async init(customBadWords = null) {
		try {
			this.module = await import('./text_filter.js')
			await this.module.default()

			// Инициализация через cwrap
			this.init_text_filter = this.module.cwrap('init_text_filter', null, [])
			this.load_bad_words = this.module.cwrap('load_bad_words', null, [
				'string',
			])
			this.check_text = this.module.cwrap('check_text', 'number', ['string'])
			this.add_bad_word = this.module.cwrap('add_bad_word', null, ['string'])
			this.remove_bad_word = this.module.cwrap('remove_bad_word', null, [
				'string',
			])
			this.clear_bad_words = this.module.cwrap('clear_bad_words', null, [])
			this.get_bad_words_count = this.module.cwrap(
				'get_bad_words_count',
				'number',
				[]
			)

			this.init_text_filter()

			if (customBadWords && Array.isArray(customBadWords)) {
				this.loadBadWords(customBadWords)
			}

			this.isInitialized = true
			console.log('Text Filter initialized')
		} catch (error) {
			console.error('Failed to initialize Text Filter:', error)
			throw error
		}
	}

	loadBadWords(words) {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')
		const wordsString = words.join(',')
		this.load_bad_words(wordsString)
	}

	checkText(text) {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')

		const result = this.check_text(text)
		if (result === 1) {
			return {
				allowed: false,
				reason: 'Сообщение содержит запрещенные слова',
			}
		}

		return { allowed: true, reason: '' }
	}

	addBadWord(word) {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')
		this.add_bad_word(word)
	}

	removeBadWord(word) {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')
		this.remove_bad_word(word)
	}

	getBadWordsCount() {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')
		return this.get_bad_words_count()
	}

	clearBadWords() {
		if (!this.isInitialized) throw new Error('Text Filter not initialized')
		this.clear_bad_words()
	}

	validateMessage(message) {
		const result = this.checkText(message)
		if (!result.allowed) {
			throw new Error(result.reason)
		}
		return true
	}
}

export default TextFilter
