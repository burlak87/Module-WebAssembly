// Глобальные переменные для WASM модулей
let textFilterModule = null
let contentModeratorModule = null

// Функция загрузки WASM модуля
function loadWasmModule(jsPath, wasmPath) {
	return new Promise((resolve, reject) => {
		console.log(`🔄 Загрузка ${jsPath}...`)

		// Создаем новый script элемент
		const script = document.createElement('script')
		script.src = jsPath

		// Создаем конфигурацию модуля ДО загрузки скрипта
		const moduleConfig = {
			locateFile: function (path) {
				if (path.endsWith('.wasm')) {
					return wasmPath
				}
				return path
			},
			onRuntimeInitialized: function () {
				console.log(`✅ ${jsPath} initialized`)
				resolve(this)
			},
			onAbort: function (reason) {
				console.error(`❌ ${jsPath} aborted:`, reason)
				reject(new Error(`WASM module aborted: ${reason}`))
			},
		}

		// Устанавливаем глобальную конфигурацию
		window.Module = moduleConfig

		script.onload = function () {
			console.log(`✅ ${jsPath} script loaded`)
			// Модуль должен инициализироваться автоматически через onRuntimeInitialized
		}

		script.onerror = function (err) {
			console.error(`❌ Failed to load ${jsPath}:`, err)
			reject(new Error(`Failed to load ${jsPath}`))
		}

		document.head.appendChild(script)
	})
}
