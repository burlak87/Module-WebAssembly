// Функция загрузки WASM модуля
function loadWasmModule(jsPath, wasmPath) {
	return new Promise((resolve, reject) => {
		// Создаем конфигурацию для модуля
		const moduleConfig = {
			locateFile: function (path) {
				if (path.endsWith('.wasm')) {
					return wasmPath
				}
				return path
			},
			onRuntimeInitialized: function () {
				resolve(this)
			},
		}

		// Временно сохраняем конфигурацию
		window.Module = moduleConfig

		// Загружаем скрипт
		const script = document.createElement('script')
		script.src = jsPath
		script.onload = function () {
			// Модуль должен автоматически инициализироваться
			console.log(`✅ ${jsPath} loaded`)
		}
		script.onerror = function (err) {
			console.error(`❌ Failed to load ${jsPath}:`, err)
			reject(err)
		}
		document.head.appendChild(script)
	})
}
