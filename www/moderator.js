// Простые функции для работы с модератором изображений
let moderatorModule = null
let moderatorInitialized = false

// Инициализация модератора
async function initModerator() {
	if (moderatorInitialized) return

	try {
		// Загружаем WASM модуль
		moderatorModule = await loadWasmModule(
			'content_moderator.js',
			'content_moderator.wasm'
		)

		// Инициализируем функции
		window.init_moderator = moderatorModule.cwrap('init_moderator', null, [])
		window.analyze_image_with_sensitivity = moderatorModule.cwrap(
			'analyze_image_with_sensitivity',
			'number',
			['number', 'number', 'number', 'number']
		)

		// Инициализируем модератор
		window.init_moderator()

		moderatorInitialized = true
		console.log('✅ Content Moderator initialized')
	} catch (error) {
		console.error('❌ Failed to initialize Content Moderator:', error)
		throw error
	}
}

// Анализ файла изображения
async function analyzeImageFile(file, sensitivity = 50) {
	if (!moderatorInitialized) throw new Error('Moderator not initialized')

	return new Promise((resolve, reject) => {
		const img = new Image()
		const url = URL.createObjectURL(file)

		img.onload = () => {
			try {
				const canvas = document.createElement('canvas')
				canvas.width = img.width
				canvas.height = img.height

				const ctx = canvas.getContext('2d')
				ctx.drawImage(img, 0, 0)

				const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
				const data = imageData.data

				// Выделяем память и копируем данные
				const buffer = moderatorModule._malloc(data.length)
				moderatorModule.HEAPU8.set(data, buffer)

				const result = window.analyze_image_with_sensitivity(
					buffer,
					canvas.width,
					canvas.height,
					sensitivity
				)

				moderatorModule._free(buffer)
				URL.revokeObjectURL(url)
				resolve(result)
			} catch (error) {
				URL.revokeObjectURL(url)
				reject(error)
			}
		}

		img.onerror = () => {
			URL.revokeObjectURL(url)
			reject(new Error('Failed to load image'))
		}

		img.src = url
	})
}

// Получение уровня риска
function getRiskLevel(probability) {
	if (probability < 20) return 'safe'
	if (probability < 50) return 'low'
	if (probability < 75) return 'medium'
	return 'high'
}
