// Глобальные переменные
let textFilter = null
let moderator = null
let stats = {
	textChecks: 0,
	imageChecks: 0,
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async function () {
	console.log('🚀 Инициализация приложения...')

	try {
		// Импортируем классы
		const TextFilterModule = await import('./text_filter.js')
		const ContentModeratorModule = await import('./moderator.js')

		// Инициализация фильтра текста
		textFilter = new TextFilterModule.default()
		await textFilter.init(['мат', 'спам', 'оскорбление'])
		console.log('✅ Text Filter ready')

		// Инициализация модератора
		moderator = new ContentModeratorModule.default()
		await moderator.init()
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

// Функции для работы с текстом
function checkText() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	const text = document.getElementById('textInput').value.trim()
	if (!text) {
		showResult('textResult', 'Введите текст для проверки', 'error')
		return
	}

	try {
		const result = textFilter.checkText(text)
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
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	const text = document.getElementById('textInput').value.trim()
	if (!text) {
		showResult('textResult', 'Введите текст для отправки', 'error')
		return
	}

	try {
		textFilter.validateMessage(text)
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

// Функции для работы с изображениями
async function handleImageUpload(file) {
	if (!file) return
	if (!moderator) {
		showNotification('Модератор изображений не инициализирован', 'error')
		return
	}

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
		const probability = await moderator.analyzeImageFile(file, sensitivity)

		stats.imageChecks++
		updateStats()

		const riskLevel = moderator.getRiskLevel(probability)
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

		// Показываем статистику
		const nsfwScore = document.getElementById('nsfwScore')
		const skinTone = document.getElementById('skinTone')
		const saturation = document.getElementById('saturation')
		const imageStats = document.getElementById('imageStats')

		if (nsfwScore) nsfwScore.textContent = probability + '%'
		if (skinTone)
			skinTone.textContent = '~' + Math.round(probability * 0.6) + '%'
		if (saturation)
			saturation.textContent = '~' + Math.round(probability * 0.4) + '%'
		if (imageStats) imageStats.style.display = 'grid'
	} catch (error) {
		console.error('Image analysis error:', error)
		if (resultDiv) {
			resultDiv.className = 'result error'
			resultDiv.innerHTML =
				'❌ Ошибка при анализе изображения: ' + error.message
		}
	}
}

// Функции админки
function loadBadWords() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	const wordsText = document.getElementById('badWordsInput').value.trim()
	if (!wordsText) {
		showNotification('Введите слова для загрузки', 'error')
		return
	}

	try {
		const words = wordsText
			.split(',')
			.map(word => word.trim())
			.filter(word => word)
		textFilter.loadBadWords(words)
		updateWordList()
		showNotification(`Загружено ${words.length} слов`, 'success')
	} catch (error) {
		showNotification(`Ошибка при загрузке слов: ${error.message}`, 'error')
	}
}

function addDefaultWords() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

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
		'drugs',
		'violence',
		'hate',
		'scam',
		'развод',
		'обсценная',
		'непристойность',
		'порнография',
	]

	textFilter.loadBadWords(defaultWords)
	const badWordsInput = document.getElementById('badWordsInput')
	if (badWordsInput) badWordsInput.value = defaultWords.join(', ')
	updateWordList()
	showNotification(
		`Добавлено ${defaultWords.length} стандартных слов`,
		'success'
	)
}

function clearBadWords() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	if (
		confirm('Вы уверены, что хотите очистить весь список запрещенных слов?')
	) {
		textFilter.clearBadWords()
		const badWordsInput = document.getElementById('badWordsInput')
		if (badWordsInput) badWordsInput.value = ''
		updateWordList()
		showNotification('Список запрещенных слов очищен', 'success')
	}
}

function addSingleWord() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	const word = document.getElementById('singleWordInput').value.trim()
	if (!word) {
		showNotification('Введите слово', 'error')
		return
	}

	try {
		textFilter.addBadWord(word)
		document.getElementById('singleWordInput').value = ''
		updateWordList()
		showNotification(`Слово "${word}" добавлено`, 'success')
	} catch (error) {
		showNotification(`Ошибка при добавлении слова: ${error.message}`, 'error')
	}
}

function updateWordList() {
	if (!textFilter) return

	const count = textFilter.getBadWordsCount()
	const wordsCount = document.getElementById('wordsCount')
	if (wordsCount) wordsCount.textContent = count

	const wordList = document.getElementById('currentWords')
	if (wordList) {
		wordList.innerHTML = `<strong>Загружено ${count} запрещенных слов</strong>`
	}

	updateStats()
}

// Вспомогательные функции
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
	// Создаем временное уведомление
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
        transition: all 0.3s;
    `

	if (type === 'success') {
		notification.style.background = 'var(--success)'
	} else if (type === 'error') {
		notification.style.background = 'var(--danger)'
	} else {
		notification.style.background = 'var(--primary)'
	}

	notification.textContent = message
	document.body.appendChild(notification)

	setTimeout(() => {
		notification.remove()
	}, 3000)
}

function updateStats() {
	if (!textFilter) return

	const wordsCount = document.getElementById('wordsCount')
	const checksCount = document.getElementById('checksCount')
	const imagesCount = document.getElementById('imagesCount')

	if (wordsCount) wordsCount.textContent = textFilter.getBadWordsCount()
	if (checksCount) checksCount.textContent = stats.textChecks
	if (imagesCount) imagesCount.textContent = stats.imageChecks
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

// Демо-функции
function loadDemoScenario() {
	const scenario = document.getElementById('demoScenario').value
	const demoContent = document.getElementById('demoContent')
	const demoText = document.getElementById('demoText')
	const demoImageContainer = document.getElementById('demoImageContainer')

	if (!scenario) {
		if (demoContent) demoContent.style.display = 'none'
		return
	}

	if (demoContent) demoContent.style.display = 'block'
	if (demoImageContainer) demoImageContainer.style.display = 'none'

	switch (scenario) {
		case 'clean':
			if (demoText)
				demoText.value =
					'Это совершенно нормальное сообщение без каких-либо проблем. Оно содержит только допустимый контент для всех возрастов.'
			break
		case 'bad_words':
			if (demoText)
				demoText.value =
					'Это сообщение содержит мат и оскорбление. Также здесь есть спам и мошенничество.'
			break
		case 'similar':
			if (demoText)
				demoText.value =
					'Проверим замену символов: м4т, 0скорбление, сп4м. Также тест на ненависть.'
			break
		case 'nsfw':
			if (demoText)
				demoText.value =
					'Проверка текста вместе с изображением. Этот текст сам по себе безопасен.'
			if (demoImageContainer) demoImageContainer.style.display = 'block'
			break
	}
}

function runDemo() {
	if (!textFilter) {
		showNotification('Фильтр текста не инициализирован', 'error')
		return
	}

	const scenario = document.getElementById('demoScenario').value
	const resultDiv = document.getElementById('demoResult')

	if (!scenario) {
		showResult('demoResult', 'Выберите сценарий для демонстрации', 'error')
		return
	}

	if (resultDiv) {
		resultDiv.style.display = 'block'
		resultDiv.className = 'result info'
		resultDiv.innerHTML = '⏳ Запуск демонстрации...'
	}

	try {
		let message = '<strong>Результаты демонстрации:</strong><br><br>'

		// Проверка текста
		const demoText = document.getElementById('demoText')
		if (demoText) {
			const text = demoText.value
			const textResult = textFilter.checkText(text)
			stats.textChecks++

			message += `📝 <strong>Проверка текста:</strong> `
			if (textResult.allowed) {
				message += `✅ Разрешено<br>`
			} else {
				message += `❌ Заблокировано: ${textResult.reason}<br>`
			}
		}

		// Проверка изображения если есть
		if (scenario === 'nsfw') {
			message += `<br>🖼️ <strong>Проверка изображения:</strong> `
			message += `🔍 Функция анализа изображения активирована<br>`
		}

		const demoScenario = document.getElementById('demoScenario')
		if (demoScenario) {
			message += `<br>🎯 <strong>Сценарий:</strong> ${
				demoScenario.options[demoScenario.selectedIndex].text
			}`
		}

		if (resultDiv) {
			resultDiv.innerHTML = message
			resultDiv.className = 'result success'
		}

		updateStats()
	} catch (error) {
		if (resultDiv) {
			resultDiv.className = 'result error'
			resultDiv.innerHTML = `❌ Ошибка при выполнении демо: ${error.message}`
		}
	}
}

// Экспортируем функции для глобального использования
window.checkText = checkText
window.checkAndSend = checkAndSend
window.clearText = clearText
window.switchTab = switchTab
window.loadBadWords = loadBadWords
window.addDefaultWords = addDefaultWords
window.clearBadWords = clearBadWords
window.addSingleWord = addSingleWord
window.saveSettings = saveSettings
window.loadDemoScenario = loadDemoScenario
window.runDemo = runDemo