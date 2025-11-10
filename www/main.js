// Глобальные переменные
let stats = {
	textChecks: 0,
	imageChecks: 0,
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function () {
	console.log('🚀 Инициализация приложения...')

	try {
		// Инициализация фильтра текста
		await initTextFilter(['мат', 'спам', 'оскорбление'])
		console.log('✅ Text Filter ready')

		// Инициализация модератора
		await initModerator()
		console.log('✅ Content Moderator ready')

		// Загрузка сохраненных настроек
		loadSettings()

		// Обновление статистики
		updateStats()

		// Настройка обработчиков событий
		setupEventListeners()

		console.log('🎉 Приложение успешно инициализировано!')
	} catch (error) {
		console.error('❌ Ошибка инициализации:', error)
		showNotification('Ошибка инициализации: ' + error.message, 'error')
	}
})

function setupEventListeners() {
	// Обработчик загрузки изображений
	const imageInput = document.getElementById('imageInput')
	if (imageInput) {
		imageInput.addEventListener('change', function (e) {
			handleImageUpload(e.target.files[0])
		})
	}

	// Обработчик перетаскивания изображений
	const uploadArea = document.querySelector('.upload-area')
	if (uploadArea) {
		uploadArea.addEventListener('dragover', function (e) {
			e.preventDefault()
			uploadArea.style.borderColor = 'var(--primary)'
			uploadArea.style.background = '#f0f8ff'
		})

		uploadArea.addEventListener('dragleave', function () {
			uploadArea.style.borderColor = '#ccc'
			uploadArea.style.background = ''
		})

		uploadArea.addEventListener('drop', function (e) {
			e.preventDefault()
			uploadArea.style.borderColor = '#ccc'
			uploadArea.style.background = ''
			const file = e.dataTransfer.files[0]
			if (file && file.type.startsWith('image/')) {
				handleImageUpload(file)
			}
		})
	}

	// Обработчик чувствительности
	const sensitivity = document.getElementById('sensitivity')
	if (sensitivity) {
		sensitivity.addEventListener('input', function (e) {
			document.getElementById('sensitivityValue').textContent =
				e.target.value + '%'
		})
	}
}

function checkText() {
	try {
		const text = document.getElementById('textInput').value.trim()
		if (!text) {
			showResult('textResult', 'Введите текст для проверки', 'error')
			return
		}

		const result = checkText(text)
		stats.textChecks++
		updateStats()

		if (result.allowed) {
			showResult(
				'textResult',
				'✅ Текст прошел проверку! Запрещенных слов не обнаружено.',
				'success'
			)
		} else {
			showResult('textResult', `❌ ${result.reason}`, 'error')
		}
	} catch (error) {
		showResult(
			'textResult',
			`Ошибка при проверке текста: ${error.message}`,
			'error'
		)
	}
}

function checkAndSend() {
	try {
		const text = document.getElementById('textInput').value.trim()
		if (!text) {
			showResult('textResult', 'Введите текст для отправки', 'error')
			return
		}

		validateMessage(text)
		stats.textChecks++
		updateStats()

		showResult(
			'textResult',
			'✅ Сообщение успешно отправлено! Текст прошел проверку.',
			'success'
		)
		document.getElementById('textInput').value = ''
	} catch (error) {
		showResult(
			'textResult',
			`❌ Не удалось отправить сообщение: ${error.message}`,
			'error'
		)
	}
}

function clearText() {
	document.getElementById('textInput').value = ''
	const resultDiv = document.getElementById('textResult')
	if (resultDiv) resultDiv.style.display = 'none'
}

async function handleImageUpload(file) {
	if (!file) return

	const preview = document.getElementById('imagePreview')
	const resultDiv = document.getElementById('imageResult')

	// Показываем превью
	const url = URL.createObjectURL(file)
	if (preview) {
		preview.src = url
		preview.style.display = 'block'
	}

	if (resultDiv) {
		resultDiv.style.display = 'block'
		resultDiv.className = 'result info'
		resultDiv.innerHTML = '⏳ Анализируем изображение...'
	}

	try {
		const sensitivity = document.getElementById('sensitivity')
			? parseInt(document.getElementById('sensitivity').value)
			: 50
		const probability = await analyzeImageFile(file, sensitivity)

		stats.imageChecks++
		updateStats()

		const riskLevel = getRiskLevel(probability)
		const threshold = document.getElementById('autoBlockThreshold')
			? parseInt(document.getElementById('autoBlockThreshold').value)
			: 50

		let riskClass, riskText
		switch (riskLevel) {
			case 'safe':
				riskClass = 'risk-safe'
				riskText = 'БЕЗОПАСНО'
				break
			case 'low':
				riskClass = 'risk-low'
				riskText = 'НИЗКИЙ'
				break
			case 'medium':
				riskClass = 'risk-medium'
				riskText = 'СРЕДНИЙ'
				break
			case 'high':
				riskClass = 'risk-high'
				riskText = 'ВЫСОКИЙ'
				break
		}

		let message = `
            <strong>Результат анализа:</strong><br>
            <span class="risk-level ${riskClass}">${riskText} РИСК</span><br>
            Вероятность NSFW: <strong>${probability}%</strong><br>
            Чувствительность: ${sensitivity}%
        `

		if (probability >= threshold) {
			message += `<br><br>🚫 <strong>Изображение заблокировано</strong> (порог: ${threshold}%)`
			if (resultDiv) resultDiv.className = 'result error'
		} else {
			message += `<br><br>✅ <strong>Изображение разрешено</strong>`
			if (resultDiv) resultDiv.className = 'result success'
		}

		if (resultDiv) resultDiv.innerHTML = message
	} catch (error) {
		console.error('Image analysis error:', error)
		if (resultDiv) {
			resultDiv.className = 'result error'
			resultDiv.innerHTML =
				'❌ Ошибка при анализе изображения: ' + error.message
		}
	}
}

function loadBadWordsFromInput() {
	try {
		const wordsText = document.getElementById('badWordsInput').value.trim()
		if (!wordsText) {
			showNotification('Введите слова для загрузки', 'error')
			return
		}

		const words = wordsText
			.split(',')
			.map(word => word.trim())
			.filter(word => word)
		loadBadWords(words)
		updateWordList()
		showNotification(`Загружено ${words.length} слов`, 'success')
	} catch (error) {
		showNotification(`Ошибка при загрузке слов: ${error.message}`, 'error')
	}
}

function addDefaultWords() {
	try {
		const defaultWords = [
			'мат',
			'ругательство',
			'оскорбление',
			'ненависть',
			'пропаганда',
			'экстремизм',
			'насилие',
			'угроза',
			'спам',
			'мошенничество',
			'обман',
			'fake',
		]

		loadBadWords(defaultWords)
		const badWordsInput = document.getElementById('badWordsInput')
		if (badWordsInput) badWordsInput.value = defaultWords.join(', ')
		updateWordList()
		showNotification(
			`Добавлено ${defaultWords.length} стандартных слов`,
			'success'
		)
	} catch (error) {
		showNotification(`Ошибка: ${error.message}`, 'error')
	}
}

function clearAllBadWords() {
	try {
		if (
			confirm('Вы уверены, что хотите очистить весь список запрещенных слов?')
		) {
			clearBadWords()
			const badWordsInput = document.getElementById('badWordsInput')
			if (badWordsInput) badWordsInput.value = ''
			updateWordList()
			showNotification('Список запрещенных слов очищен', 'success')
		}
	} catch (error) {
		showNotification(`Ошибка: ${error.message}`, 'error')
	}
}

function addSingleWord() {
	try {
		const word = document.getElementById('singleWordInput').value.trim()
		if (!word) {
			showNotification('Введите слово', 'error')
			return
		}

		addBadWord(word)
		document.getElementById('singleWordInput').value = ''
		updateWordList()
		showNotification(`Слово "${word}" добавлено`, 'success')
	} catch (error) {
		showNotification(`Ошибка: ${error.message}`, 'error')
	}
}

function updateWordList() {
	try {
		const count = getBadWordsCount()
		const wordsCount = document.getElementById('wordsCount')
		if (wordsCount) wordsCount.textContent = count

		const wordList = document.getElementById('currentWords')
		if (wordList) {
			wordList.innerHTML = `<strong>Загружено ${count} запрещенных слов</strong>`
		}

		updateStats()
	} catch (error) {
		console.error('Error updating word list:', error)
	}
}

function switchTab(tabName) {
	// Скрыть все вкладки
	document.querySelectorAll('.tab-content').forEach(tab => {
		tab.classList.remove('active')
	})
	document.querySelectorAll('.tab').forEach(tab => {
		tab.classList.remove('active')
	})

	// Показать выбранную вкладку
	const targetTab = document.getElementById(tabName)
	if (targetTab) targetTab.classList.add('active')

	// Активировать кнопку
	event.target.classList.add('active')
}

function showResult(elementId, message, type) {
	const element = document.getElementById(elementId)
	if (element) {
		element.innerHTML = message
		element.className = `result ${type}`
		element.style.display = 'block'
	}
}

function showNotification(message, type) {
	const notification = document.createElement('div')
	notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
    `

	if (type === 'success') {
		notification.style.background = '#28a745'
	} else if (type === 'error') {
		notification.style.background = '#dc3545'
	} else {
		notification.style.background = '#007bff'
	}

	notification.textContent = message
	document.body.appendChild(notification)

	setTimeout(() => {
		notification.remove()
	}, 3000)
}

function updateStats() {
	try {
		const count = getBadWordsCount()
		const wordsCount = document.getElementById('wordsCount')
		const checksCount = document.getElementById('checksCount')
		const imagesCount = document.getElementById('imagesCount')

		if (wordsCount) wordsCount.textContent = count
		if (checksCount) checksCount.textContent = stats.textChecks
		if (imagesCount) imagesCount.textContent = stats.imageChecks
	} catch (error) {
		console.error('Error updating stats:', error)
	}
}

function loadSettings() {
	const settings = JSON.parse(localStorage.getItem('filterSettings') || '{}')
	const sensitivity = document.getElementById('sensitivity')
	const sensitivityValue = document.getElementById('sensitivityValue')
	const autoBlockThreshold = document.getElementById('autoBlockThreshold')

	if (settings.sensitivity && sensitivity && sensitivityValue) {
		sensitivity.value = settings.sensitivity
		sensitivityValue.textContent = settings.sensitivity + '%'
	}
	if (settings.autoBlockThreshold && autoBlockThreshold) {
		autoBlockThreshold.value = settings.autoBlockThreshold
	}
}

function saveSettings() {
	const settings = {
		sensitivity: document.getElementById('sensitivity')
			? parseInt(document.getElementById('sensitivity').value)
			: 50,
		autoBlockThreshold: document.getElementById('autoBlockThreshold')
			? parseInt(document.getElementById('autoBlockThreshold').value)
			: 50,
	}

	localStorage.setItem('filterSettings', JSON.stringify(settings))
	showNotification('Настройки сохранены', 'success')
}

// Экспортируем функции для глобального использования
window.checkText = checkText
window.checkAndSend = checkAndSend
window.clearText = clearText
window.switchTab = switchTab
window.loadBadWords = loadBadWordsFromInput
window.addDefaultWords = addDefaultWords
window.clearBadWords = clearAllBadWords
window.addSingleWord = addSingleWord
window.saveSettings = saveSettings