// Глобальные переменные
var stats = {
  textChecks: 0,
  imageChecks: 0,
};

var textFilterInitialized = false;

// Инициализация приложения
async function initApp() {
  console.log("🚀 Инициализация приложения...");

  try {
    showNotification("Загрузка фильтра текста...", "info");

    // Ждем загрузки WASM модуля
    await new Promise((resolve, reject) => {
      const checkModule = () => {
        if (window.Module && window.Module.asm) {
          resolve();
        } else {
          setTimeout(checkModule, 100);
        }
      };
      checkModule();

      // Таймаут на случай ошибки
      setTimeout(() => {
        reject(new Error("WASM модуль не загрузился"));
      }, 5000);
    });

    console.log("✅ WASM модуль загружен");

    // Инициализируем функции
    window.init_text_filter = window.Module.cwrap("init_text_filter", null, []);
    window.check_text = window.Module.cwrap("check_text", "number", ["string"]);
    window.add_bad_word = window.Module.cwrap("add_bad_word", null, ["string"]);
    window.load_bad_words = window.Module.cwrap("load_bad_words", null, [
      "string",
    ]);
    window.clear_bad_words = window.Module.cwrap("clear_bad_words", null, []);
    window.get_bad_words_count = window.Module.cwrap(
      "get_bad_words_count",
      "number",
      [],
    );

    // Инициализируем фильтр
    window.init_text_filter();
    console.log("✅ Фильтр текста инициализирован");

    // Добавляем базовые слова
    const defaultWords = [
      "мат",
      "спам",
      "оскорбление",
      "ненависть",
      "пропаганда",
    ];
    defaultWords.forEach((word) => window.add_bad_word(word));

    textFilterInitialized = true;

    // Обновляем статистику и список слов
    updateStats();
    updateWordList();

    // Настройка обработчиков событий
    setupEventListeners();

    console.log("🎉 Приложение успешно инициализировано!");
    showNotification("Фильтр текста готов к работе!", "success");
  } catch (error) {
    console.error("❌ Ошибка инициализации:", error);
    showNotification("Ошибка загрузки фильтра: " + error.message, "error");
  }
}

// Настройка обработчиков событий
function setupEventListeners() {
  // Обработчик загрузки изображений
  const imageInput = document.getElementById("imageInput");
  if (imageInput) {
    imageInput.addEventListener("change", function (e) {
      handleImageUpload(e.target.files[0]);
    });
  }

  // Обработчик перетаскивания изображений
  const uploadArea = document.querySelector(".upload-area");
  if (uploadArea) {
    uploadArea.addEventListener("dragover", function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = "var(--primary)";
      uploadArea.style.background = "#f0f8ff";
    });

    uploadArea.addEventListener("dragleave", function () {
      uploadArea.style.borderColor = "#ccc";
      uploadArea.style.background = "";
    });

    uploadArea.addEventListener("drop", function (e) {
      e.preventDefault();
      uploadArea.style.borderColor = "#ccc";
      uploadArea.style.background = "";
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleImageUpload(file);
      }
    });
  }

  // Обработчик чувствительности
  const sensitivity = document.getElementById("sensitivity");
  if (sensitivity) {
    sensitivity.addEventListener("input", function (e) {
      document.getElementById("sensitivityValue").textContent =
        e.target.value + "%";
    });
  }
}

// Функции для работы с текстом
function checkText() {
  try {
    const text = document.getElementById("textInput").value.trim();
    if (!text) {
      showResult("textResult", "Введите текст для проверки", "error");
      return;
    }

    const result = window.check_text(text);
    stats.textChecks++;
    updateStats();

    if (result === 0) {
      showResult(
        "textResult",
        "✅ Текст прошел проверку! Запрещенных слов не обнаружено.",
        "success",
      );
    } else {
      showResult(
        "textResult",
        "❌ Сообщение содержит запрещенные слова",
        "error",
      );
    }
  } catch (error) {
    showResult(
      "textResult",
      `Ошибка при проверке текста: ${error.message}`,
      "error",
    );
  }
}

function checkAndSend() {
  try {
    const text = document.getElementById("textInput").value.trim();
    if (!text) {
      showResult("textResult", "Введите текст для отправки", "error");
      return;
    }

    const result = window.check_text(text);
    stats.textChecks++;
    updateStats();

    if (result === 0) {
      showResult(
        "textResult",
        "✅ Сообщение успешно отправлено! Текст прошел проверку.",
        "success",
      );
      document.getElementById("textInput").value = "";
    } else {
      showResult(
        "textResult",
        "❌ Не удалось отправить сообщение: найдены запрещенные слова",
        "error",
      );
    }
  } catch (error) {
    showResult(
      "textResult",
      `❌ Не удалось отправить сообщение: ${error.message}`,
      "error",
    );
  }
}

function clearText() {
  document.getElementById("textInput").value = "";
  const resultDiv = document.getElementById("textResult");
  if (resultDiv) resultDiv.style.display = "none";
}

// Функции админки
function loadBadWords() {
  try {
    const wordsText = document.getElementById("badWordsInput").value.trim();
    if (!wordsText) {
      showNotification("Введите слова для загрузки", "error");
      return;
    }

    const words = wordsText
      .split(",")
      .map((word) => word.trim())
      .filter((word) => word);

    words.forEach((word) => {
      window.add_bad_word(word);
    });

    updateStats();
    updateWordList();
    showNotification(`Загружено ${words.length} слов`, "success");
  } catch (error) {
    showNotification(`Ошибка при загрузке слов: ${error.message}`, "error");
  }
}

function addDefaultWords() {
  try {
    const defaultWords = [
      "мат",
      "ругательство",
      "оскорбление",
      "ненависть",
      "пропаганда",
      "экстремизм",
      "насилие",
      "угроза",
      "спам",
      "мошенничество",
      "обман",
      "fake",
    ];

    defaultWords.forEach((word) => {
      window.add_bad_word(word);
    });

    const badWordsInput = document.getElementById("badWordsInput");
    if (badWordsInput) badWordsInput.value = defaultWords.join(", ");
    updateStats();
    updateWordList();
    showNotification(
      `Добавлено ${defaultWords.length} стандартных слов`,
      "success",
    );
  } catch (error) {
    showNotification(`Ошибка: ${error.message}`, "error");
  }
}

function clearBadWords() {
  try {
    if (
      confirm("Вы уверены, что хотите очистить весь список запрещенных слов?")
    ) {
      window.clear_bad_words();
      const badWordsInput = document.getElementById("badWordsInput");
      if (badWordsInput) badWordsInput.value = "";
      updateStats();
      updateWordList();
      showNotification("Список запрещенных слов очищен", "success");
    }
  } catch (error) {
    showNotification(`Ошибка: ${error.message}`, "error");
  }
}

function addSingleWord() {
  try {
    const word = document.getElementById("singleWordInput").value.trim();
    if (!word) {
      showNotification("Введите слово", "error");
      return;
    }

    window.add_bad_word(word);
    document.getElementById("singleWordInput").value = "";
    updateStats();
    updateWordList();
    showNotification(`Слово "${word}" добавлено`, "success");
  } catch (error) {
    showNotification(`Ошибка: ${error.message}`, "error");
  }
}

function updateWordList() {
  try {
    const count = window.get_bad_words_count();
    const wordList = document.getElementById("currentWords");
    if (wordList) {
      wordList.innerHTML = `<strong>Загружено ${count} запрещенных слов</strong>`;
    }
  } catch (error) {
    console.error("Ошибка обновления списка слов:", error);
  }
}

// Демо-функции
function loadDemoScenario() {
  const scenario = document.getElementById("demoScenario").value;
  const demoContent = document.getElementById("demoContent");
  const demoText = document.getElementById("demoText");

  if (!scenario) {
    if (demoContent) demoContent.style.display = "none";
    return;
  }

  if (demoContent) demoContent.style.display = "block";

  switch (scenario) {
    case "clean":
      if (demoText)
        demoText.value =
          "Это совершенно нормальное сообщение без каких-либо проблем. Оно содержит только допустимый контент для всех возрастов.";
      break;
    case "bad_words":
      if (demoText)
        demoText.value =
          "Это сообщение содержит мат и оскорбление. Также здесь есть спам и мошенничество.";
      break;
    case "similar":
      if (demoText)
        demoText.value =
          "Проверим различные варианты написания: м4т, сп4м, 0скорбление, ненависть.";
      break;
    case "custom":
      if (demoText) {
        demoText.value = "";
        demoText.readOnly = false;
        demoText.placeholder =
          "Введите ваш собственный текст для тестирования...";
      }
      break;
    default:
      if (demoText) demoText.readOnly = true;
  }
}

function runDemo() {
  try {
    const scenario = document.getElementById("demoScenario").value;
    const resultDiv = document.getElementById("demoResult");

    if (!scenario) {
      showResult("demoResult", "Выберите сценарий для демонстрации", "error");
      return;
    }

    if (resultDiv) {
      resultDiv.style.display = "block";
      resultDiv.className = "result info";
      resultDiv.innerHTML = "⏳ Запуск демонстрации...";
    }

    const demoText = document.getElementById("demoText");
    if (!demoText || !demoText.value.trim()) {
      showResult("demoResult", "Введите текст для демонстрации", "error");
      return;
    }

    const text = demoText.value;
    const result = window.check_text(text);
    stats.textChecks++;

    let message = "<strong>Результаты демонстрации:</strong><br><br>";
    message += `<strong>Сценарий:</strong> ${document.getElementById("demoScenario").options[document.getElementById("demoScenario").selectedIndex].text}<br><br>`;
    message += `<strong>Проверяемый текст:</strong><br>${text}<br><br>`;
    message += `<strong>Результат проверки:</strong> `;

    if (result === 0) {
      message += `<span style="color: var(--success)">✅ Текст чистый</span><br>`;
      message += `Фильтр не обнаружил запрещенных слов.`;
      if (resultDiv) resultDiv.className = "result success";
    } else {
      message += `<span style="color: var(--danger)">❌ Найдены запрещенные слова</span><br>`;
      message += `Текст содержит слова из черного списка.`;
      if (resultDiv) resultDiv.className = "result error";
    }

    message += `<br><br><strong>Статистика:</strong> Проверено ${stats.textChecks} текстов, в базе ${window.get_bad_words_count()} запрещенных слов.`;

    if (resultDiv) {
      resultDiv.innerHTML = message;
    }

    updateStats();
  } catch (error) {
    const resultDiv = document.getElementById("demoResult");
    if (resultDiv) {
      resultDiv.className = "result error";
      resultDiv.innerHTML = `❌ Ошибка при выполнении демо: ${error.message}`;
    }
  }
}

// Вспомогательные функции
function switchTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active");
  });
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.remove("active");
  });

  const targetTab = document.getElementById(tabName);
  if (targetTab) targetTab.classList.add("active");

  event.target.classList.add("active");
}

function showResult(elementId, message, type) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = message;
    element.className = `result ${type}`;
    element.style.display = "block";
  }
}

function showNotification(message, type) {
  const notification = document.createElement("div");
  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        background: ${type === "success" ? "#28a745" : type === "error" ? "#dc3545" : "#007bff"};
    `;

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function updateStats() {
  try {
    const count = window.get_bad_words_count();
    const wordsCount = document.getElementById("wordsCount");
    const checksCount = document.getElementById("checksCount");
    const imagesCount = document.getElementById("imagesCount");

    if (wordsCount) wordsCount.textContent = count;
    if (checksCount) checksCount.textContent = stats.textChecks;
    if (imagesCount) imagesCount.textContent = stats.imageChecks;
  } catch (error) {
    console.error("Ошибка обновления статистики:", error);
  }
}

function loadSettings() {
  const settings = JSON.parse(localStorage.getItem("filterSettings") || "{}");
  const sensitivity = document.getElementById("sensitivity");
  const sensitivityValue = document.getElementById("sensitivityValue");
  const autoBlockThreshold = document.getElementById("autoBlockThreshold");

  if (settings.sensitivity && sensitivity && sensitivityValue) {
    sensitivity.value = settings.sensitivity;
    sensitivityValue.textContent = settings.sensitivity + "%";
  }
  if (settings.autoBlockThreshold && autoBlockThreshold) {
    autoBlockThreshold.value = settings.autoBlockThreshold;
  }
}

function saveSettings() {
  const settings = {
    sensitivity: document.getElementById("sensitivity")
      ? parseInt(document.getElementById("sensitivity").value)
      : 50,
    autoBlockThreshold: document.getElementById("autoBlockThreshold")
      ? parseInt(document.getElementById("autoBlockThreshold").value)
      : 50,
  };

  localStorage.setItem("filterSettings", JSON.stringify(settings));
  showNotification("Настройки сохранены", "success");
}

async function handleImageUpload(file) {
  if (!file) return;

  const preview = document.getElementById("imagePreview");
  const resultDiv = document.getElementById("imageResult");

  // Показываем превью
  const url = URL.createObjectURL(file);
  if (preview) {
    preview.src = url;
    preview.style.display = "block";
  }

  if (resultDiv) {
    resultDiv.style.display = "block";
    resultDiv.className = "result info";
    resultDiv.innerHTML = "⏳ Анализ изображения...";
  }

  try {
    console.log("🔄 Начинаем анализ изображения...");

    // Инициализируем модератор, если еще не инициализирован
    if (!window.moderatorInitialized) {
      console.log("🔄 Инициализируем модератор...");
      await window.initModerator();
      window.moderatorInitialized = true;
      console.log("✅ Модератор инициализирован");
    }

    // Получаем настройку чувствительности
    const sensitivity =
      parseInt(document.getElementById("sensitivity").value) || 50;
    console.log(`🔧 Чувствительность: ${sensitivity}`);

    // Анализируем изображение
    console.log("🔄 Анализируем изображение...");
    const nsfwScore = await window.analyzeImageFile(file, sensitivity);
    console.log(`📊 Результат анализа: ${nsfwScore}%`);

    stats.imageChecks++;
    updateStats();

    // Обновляем интерфейс с результатом
    const scorePercent = nsfwScore + "%";
    let message = `<strong>Результат анализа:</strong><br>`;
    message += `Вероятность NSFW: <strong>${scorePercent}</strong><br>`;

    if (nsfwScore > 75) {
      message += `<span style="color: var(--danger)">❌ Высокий риск! Контент может быть неприемлемым.</span>`;
      resultDiv.className = "result error";
    } else if (nsfwScore > 50) {
      message += `<span style="color: var(--warning)">⚠️ Средний риск. Рекомендуется проверка модератора.</span>`;
      resultDiv.className = "result warning";
    } else {
      message += `<span style="color: var(--success)">✅ Низкий риск. Контент безопасен.</span>`;
      resultDiv.className = "result success";
    }

    resultDiv.innerHTML = message;

    // Обновляем статистику изображений
    const nsfwScoreElement = document.getElementById("nsfwScore");
    if (nsfwScoreElement) nsfwScoreElement.textContent = scorePercent;

    // Показываем статистику
    const imageStats = document.getElementById("imageStats");
    if (imageStats) imageStats.style.display = "grid";
  } catch (error) {
    console.error("❌ Ошибка анализа изображения:", error);
    if (resultDiv) {
      resultDiv.className = "result error";
      resultDiv.innerHTML = `❌ Ошибка анализа: ${error.message}<br>
                                  <em>Проверьте консоль браузера для деталей</em>`;
    }
  }
}

// Экспортируем функции для глобального использования
window.checkText = checkText;
window.checkAndSend = checkAndSend;
window.clearText = clearText;
window.switchTab = switchTab;
window.loadBadWords = loadBadWords;
window.addDefaultWords = addDefaultWords;
window.clearBadWords = clearBadWords;
window.addSingleWord = addSingleWord;
window.saveSettings = saveSettings;
window.loadDemoScenario = loadDemoScenario;
window.runDemo = runDemo;

// Запускаем при загрузке
document.addEventListener("DOMContentLoaded", function () {
  console.log("📄 DOM загружен");
  loadSettings();
  initApp();
});
