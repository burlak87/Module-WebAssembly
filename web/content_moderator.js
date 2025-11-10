class ContentModerator {
	constructor() {
		this.module = null
		this.isInitialized = false
	}

	async init() {
		try {
			this.module = await import('./content_moderator.js')
			await this.module.default()

			this.init_moderator = this.module.cwrap('init_moderator', null, [])
			this.analyze_image = this.module.cwrap('analyze_image', 'number', [
				'number',
				'number',
				'number',
			])
			this.analyze_image_with_sensitivity = this.module.cwrap(
				'analyze_image_with_sensitivity',
				'number',
				['number', 'number', 'number', 'number']
			)

			this.init_moderator()
			this.isInitialized = true
			console.log('Content Moderator initialized')
		} catch (error) {
			console.error('Failed to initialize Content Moderator:', error)
		}
	}

	async analyzeImageFile(file, sensitivity = 50) {
		if (!this.isInitialized) throw new Error('Moderator not initialized')

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
					const buffer = this.module._malloc(data.length)
					this.module.HEAPU8.set(data, buffer)

					const result = this.analyze_image_with_sensitivity(
						buffer,
						canvas.width,
						canvas.height,
						sensitivity
					)

					this.module._free(buffer)
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

	getRiskLevel(probability) {
		if (probability < 20) return 'safe'
		if (probability < 50) return 'low'
		if (probability < 75) return 'medium'
		return 'high'
	}
}

export default ContentModerator
