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
		await textFilter.init()
		console.log('✅ Text Filter initialized')

		// Инициализация модератора
		moderator = new ContentModeratorModule.default()
		await moderator.init()
		console.log('✅ Content Moderator initialized')

		// Загрузка сохраненных настроек
		loadSettings()

		// Обновление статистики
		updateStats()

		// Настройка обработчиков событий
		setupEventListeners()

		console.log('🎉 Приложение успешно инициализировано!')
	} catch (error) {
		console.error('❌ Ошибка инициализации:', error)
		showNotification('Ошибка инициализации приложения', 'error')
	}
})

function setupEventListeners() {
	// Обработчик загрузки изображений
	document
		.getElementById('imageInput')
		.addEventListener('change', function (e) {
			handleImageUpload(e.target.files[0])
		})

	// Обработчик перетаскивания изображений
	const uploadArea = document.querySelector('.upload-area')
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

	// Обработчик чувствительности
	document
		.getElementById('sensitivity')
		.addEventListener('input', function (e) {
			document.getElementById('sensitivityValue').textContent =
				e.target.value + '%'
		})
}

// Функции для работы с текстом
function checkText() {
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
	document.getElementById('textResult').style.display = 'none'
}

// Функции для работы с изображениями
async function handleImageUpload(file) {
	if (!file) return

	const preview = document.getElementById('imagePreview')
	const resultDiv = document.getElementById('imageResult')

	// Показываем превью
	const url = URL.createObjectURL(file)
	preview.src = url
	preview.style.display = 'block'

	resultDiv.style.display = 'block'
	resultDiv.className = 'result info'
	resultDiv.innerHTML = '⏳ Анализируем изображение...'

	try {
		const sensitivity = parseInt(document.getElementById('sensitivity').value)
		const probability = await moderator.analyzeImageFile(file, sensitivity)

		stats.imageChecks++
		updateStats()

		const riskLevel = moderator.getRiskLevel(probability)
		const threshold = parseInt(
			document.getElementById('autoBlockThreshold').value
		)

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
			resultDiv.className = 'result error'
		} else {
			message += `<br><br>✅ <strong>Изображение разрешено</strong>`
			resultDiv.className = 'result success'
		}

		resultDiv.innerHTML = message

		// Показываем статистику
		document.getElementById('nsfwScore').textContent = probability + '%'
		document.getElementById('skinTone').textContent =
			'~' + Math.round(probability * 0.6) + '%'
		document.getElementById('saturation').textContent =
			'~' + Math.round(probability * 0.4) + '%'
		document.getElementById('imageStats').style.display = 'grid'
	} catch (error) {
		console.error('Image analysis error:', error)
		resultDiv.className = 'result error'
		resultDiv.innerHTML = '❌ Ошибка при анализе изображения'
	}
}

// Функции админки
function loadBadWords() {
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
	document.getElementById('badWordsInput').value = defaultWords.join(', ')
	updateWordList()
	showNotification(
		`Добавлено ${defaultWords.length} стандартных слов`,
		'success'
	)
}

function clearBadWords() {
	if (
		confirm('Вы уверены, что хотите очистить весь список запрещенных слов?')
	) {
		textFilter.clearBadWords()
		document.getElementById('badWordsInput').value = ''
		updateWordList()
		showNotification('Список запрещенных слов очищен', 'success')
	}
}

function addSingleWord() {
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
	const count = textFilter.getBadWordsCount()
	document.getElementById('wordsCount').textContent = count

	// В реальном приложении здесь можно отображать список слов
	const wordList = document.getElementById('currentWords')
	wordList.innerHTML = `<strong>Загружено ${count} запрещенных слов</strong>`

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
	document.getElementById(tabName).classList.add('active')
	event.target.classList.add('active')
}

function showResult(elementId, message, type) {
	const element = document.getElementById(elementId)
	element.innerHTML = message
	element.className = `result ${type}`
	element.style.display = 'block'
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
	document.getElementById('wordsCount').textContent =
		textFilter.getBadWordsCount()
	document.getElementById('checksCount').textContent = stats.textChecks
	document.getElementById('imagesCount').textContent = stats.imageChecks
}

function loadSettings() {
	const settings = JSON.parse(localStorage.getItem('filterSettings') || '{}')
	if (settings.sensitivity) {
		document.getElementById('sensitivity').value = settings.sensitivity
		document.getElementById('sensitivityValue').textContent =
			settings.sensitivity + '%'
	}
	if (settings.autoBlockThreshold) {
		document.getElementById('autoBlockThreshold').value =
			settings.autoBlockThreshold
	}
}

function saveSettings() {
	const settings = {
		sensitivity: parseInt(document.getElementById('sensitivity').value),
		autoBlockThreshold: parseInt(
			document.getElementById('autoBlockThreshold').value
		),
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
		demoContent.style.display = 'none'
		return
	}

	demoContent.style.display = 'block'
	demoImageContainer.style.display = 'none'

	switch (scenario) {
		case 'clean':
			demoText.value =
				'Это совершенно нормальное сообщение без каких-либо проблем. Оно содержит только допустимый контент для всех возрастов.'
			break
		case 'bad_words':
			demoText.value =
				'Это сообщение содержит мат и оскорбление. Также здесь есть спам и мошенничество.'
			break
		case 'similar':
			demoText.value =
				'Проверим замену символов: м4т, 0скорбление, сп4м. Также тест на ненависть.'
			break
		case 'nsfw':
			demoText.value =
				'Проверка текста вместе с изображением. Этот текст сам по себе безопасен.'
			demoImageContainer.style.display = 'block'
			// Здесь можно добавить демо-изображение
			break
	}
}

function runDemo() {
	const scenario = document.getElementById('demoScenario').value
	const resultDiv = document.getElementById('demoResult')

	if (!scenario) {
		showResult('demoResult', 'Выберите сценарий для демонстрации', 'error')
		return
	}

	resultDiv.style.display = 'block'
	resultDiv.className = 'result info'
	resultDiv.innerHTML = '⏳ Запуск демонстрации...'

	try {
		let message = '<strong>Результаты демонстрации:</strong><br><br>'

		// Проверка текста
		const text = document.getElementById('demoText').value
		const textResult = textFilter.checkText(text)
		stats.textChecks++

		message += `📝 <strong>Проверка текста:</strong> `
		if (textResult.allowed) {
			message += `✅ Разрешено<br>`
		} else {
			message += `❌ Заблокировано: ${textResult.reason}<br>`
		}

		// Проверка изображения если есть
		if (scenario === 'nsfw') {
			message += `<br>🖼️ <strong>Проверка изображения:</strong> `
			// Здесь можно добавить анализ демо-изображения
			message += `🔍 Функция анализа изображения активирована<br>`
		}

		message += `<br>🎯 <strong>Сценарий:</strong> ${
			document.getElementById('demoScenario').options[
				document.getElementById('demoScenario').selectedIndex
			].text
		}`

		resultDiv.innerHTML = message
		resultDiv.className = 'result success'

		updateStats()
	} catch (error) {
		resultDiv.className = 'result error'
		resultDiv.innerHTML = `❌ Ошибка при выполнении демо: ${error.message}`
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