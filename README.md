# 🛡️ Universal Content Filter

<div align="center">

![WebAssembly](https://img.shields.io/badge/WebAssembly-654FF0?style=for-the-badge&logo=WebAssembly&logoColor=white)
![C++](https://img.shields.io/badge/C++-00599C?style=for-the-badge&logo=c%2B%2B&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![AI Moderation](https://img.shields.io/badge/AI%20Moderation-FF6B6B?style=for-the-badge)

**High-performance content moderation system powered by WebAssembly**

*Real-time text and image analysis in the browser*

[Features](#-features) • [Demo](#-live-demo) • [Installation](#-installation) • [Usage](#-usage) • [API](#-api)

</div>

## 📋 Overview

Universal Content Filter is a cutting-edge content moderation system that performs **real-time analysis** of text and images directly in the browser using **WebAssembly**. No server-side processing required - everything happens client-side for maximum privacy and performance.

### 🎯 What Problems We Solve

- ✅ **Text Moderation**: Detect inappropriate language, hate speech, and spam
- ✅ **Image Analysis**: Identify NSFW content using computer vision
- ✅ **Real-time Processing**: Instant feedback without server round-trips
- ✅ **Privacy-First**: All processing happens locally in the browser
- ✅ **High Performance**: C++ algorithms compiled to WebAssembly

## 🚀 Features

### 🔤 Smart Text Filtering
- **Multi-language support** with customizable word lists
- **Context-aware detection** to reduce false positives
- **Real-time analysis** as users type
- **Admin dashboard** for managing banned words
- **Export/Import** word lists

### 🖼️ Advanced Image Analysis
- **NSFW Detection** using color analysis and pattern recognition
- **Skin Tone Analysis** with configurable sensitivity
- **Saturation & Brightness** evaluation
- **Adaptive Thresholds** based on content type
- **Batch Processing** for multiple images

### ⚡ Technical Excellence
- **WebAssembly Powered** - C++ performance in the browser
- **Zero Dependencies** - Pure client-side solution
- **Modular Architecture** - Easy to extend and customize
- **Cross-Platform** - Works on all modern browsers
- **Open Source** - MIT Licensed

## 🎮 Live Demo

Experience the power of client-side content moderation:

```bash
# Clone and run locally
git clone https://github.com/your-username/universal-content-filter.git
cd universal-content-filter
./compile_all.sh
cd www
python3 -m http.server 8000
# Open http://localhost:8000
```

🛠️ Installation
Prerequisites
Emscripten SDK (for compilation)
Modern browser with WebAssembly support
Python 3.x (for local server)

Quick Start
1. Clone the repository
`
git clone https://github.com/your-username/universal-content-filter.git
cd universal-content-filter
`

2.Compile WebAssembly modules
`
chmod +x compile_all.sh
./compile_all.sh
`

3.Launch development server
`
cd www
python3 -m http.server 8000
`

4.Open in browser
`
http://localhost:8000
`

📖 Usage
Basic Text Filtering
javascript

// Initialize the text filter
await initApp();

// Check text for inappropriate content
const text = "This is a sample text with inappropriate words";
const result = checkText(text);

if (result === 0) {
    console.log("✅ Text is clean");
} else {
    console.log("❌ Text contains banned words");
}

Image Content Analysis
javascript

// Analyze image for NSFW content
async function analyzeImage(imageFile) {
    await initModerator();
    const nsfwScore = await analyzeImageFile(imageFile, 50);

    const riskLevel = getRiskLevel(nsfwScore);
    console.log(`NSFW Score: ${nsfwScore}% - Risk: ${riskLevel}`);

    return nsfwScore;
}

Admin Configuration
javascript

// Add custom banned words
addBadWord("inappropriate-term");
addBadWord("another-bad-word");

// Load word list from CSV
loadBadWords("spam,scam,fraud,malware");

// Adjust image analysis sensitivity
setSensitivity(75); // 0-100 scale

🔧 API Reference
Text Filter Module
Function	Parameters	Returns	Description
init_text_filter()	-	void	Initialize text filter
check_text(text)	string	number	Check text (0=clean, 1=bad)
add_bad_word(word)	string	void	Add word to blacklist
load_bad_words(words)	string	void	Load comma-separated words
get_bad_words_count()	-	number	Get blacklist size
Image Moderator Module
Function	Parameters	Returns	Description
init_moderator()	-	void	Initialize image analyzer
analyze_image(data, w, h)	buffer, number, number	number	Analyze image (0-100 score)
analyze_image_with_sensitivity(data, w, h, sens)	buffer, number, number, number	number	Analyze with custom sensitivity
JavaScript Wrappers
javascript

// Text filtering
window.check_text("user input");

// Image analysis
window.analyzeImageFile(imageFile, sensitivity);

// Admin functions
window.addBadWord("new-word");
window.clearBadWords();

🏗️ Architecture
text

src/
├── text_filter_simple.cpp    # Text analysis engine
├── text_filter.hpp          # Text filter headers
├── content_moderator.cpp    # Image analysis engine
└── content_moderator.hpp    # Image analyzer headers

www/
├── index.html              # Main application
├── app.js                  # Application logic
├── moderator.js            # Image analysis bridge
├── text_filter.js          # Auto-generated WASM
├── content_moderator.js    # Auto-generated WASM
└── styles.css              # UI styling

How It Works

    C++ Algorithms are compiled to WebAssembly for near-native performance

    Text Analysis uses efficient string matching and pattern recognition

    Image Processing analyzes color distributions, skin tones, and saturation

    JavaScript Bridge provides easy-to-use API for web applications

    Real-time Results are displayed instantly to users

🎨 Customization
Adding New Banned Words
javascript

// Single word
addBadWord("new-inappropriate-term");

// Multiple words
loadBadWords("term1,term2,term3");

// From external source
fetch('/bad-words.txt')
  .then(response => response.text())
  .then(words => loadBadWords(words));

Custom Image Analysis Rules
cpp

// In content_moderator.cpp - modify detection algorithms
bool is_skin_tone(uint8_t r, uint8_t g, uint8_t b) {
    // Custom skin tone detection logic
    return custom_skin_detection(r, g, b);
}

float calculate_risk_score(float skin_ratio, float saturation) {
    // Custom risk calculation
    return custom_risk_algorithm(skin_ratio, saturation);
}

Theming and Styling
css

/* Custom color scheme */
:root {
    --primary: #your-color;
    --danger: #your-alert-color;
    --success: #your-success-color;
}

📊 Performance
Operation	Average Time	Browser Support
Text Analysis (100 chars)	< 1ms	Chrome, Firefox, Safari, Edge
Image Analysis (1MP image)	50-100ms	Chrome 80+, Firefox 79+, Safari 14+
Initial Load	200-500ms	All modern browsers
🔒 Privacy & Security

    🚫 No Data Sent to Servers - All processing happens locally

    🔐 No User Tracking - Complete anonymity guaranteed

    🗑️ No Data Storage - Analysis results aren't persisted

    🌐 Open Source - Transparent algorithms and processes

🤝 Contributing

We love contributions! Here's how you can help:
Reporting Issues

    Bug reports

    Feature requests

    Performance issues

    Documentation improvements

Code Contributions

    Fork the repository

    Create a feature branch (git checkout -b feature/amazing-feature)

    Commit your changes (git commit -m 'Add amazing feature')

    Push to the branch (git push origin feature/amazing-feature)

    Open a Pull Request

Development Setup
bash

# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest

# Build and test
./compile_all.sh


cd www && python3 -m http.server 8000

#### Feature

- Разделение кода JS на модули
- Увеличение возможностей проверок
- Изменение работы text_filter модуля, он будет изменять окончательные данные `сука -> ****` но при этом сохранять сообщение даже если в них есть запрещенные слова.
- text_filter работает так мы даем ему список слов и он блокирует все где есть сочитания этих букв `ма -> мама/матерь(будет заблакирована)`
- доработать опрделение фото-файлов и другого контента
- Изменение дизайна под окончательную версию приложения
- Демонстрация ограничений

🚀 Ближайшие улучшения:
- Машинное обучение в браузере:
  1) Заменить простой анализ цвета на TensorFlow.js
  2) Использовать предобученные модели для NSFW детекции
  3) Добавить распознавание объектов и сцен
- Расширенная фильтрация текста:
  1) Синонимы и обходы фильтров (м4т, м@т)
  2) Контекстный анализ (оскорбление vs медицинский термин)
  3) AI-классификация тона сообщения
- Веб-камера и скриншоты:
  1) `const stream = await navigator.mediaDevices.getUserMedia({video: true});`
Продвинутые функции:
- Облачная интеграция:
  1) Резервное копирование черных списков
  2) Синхронизация между устройствами
  3) Общие базы запрещенных слов
- API для разработчиков:
`
const filter = new ContentFilter({
    apiKey: 'your_key',
    mode: 'strict'
});
const result = await filter.checkImage(imageFile);
`
- Производительность:
  1) Web Workers для тяжелых вычислений
  2) Кэширование результатов
  3) Оптимизация WASM модулей

**Также рассматриваются** такие варианты - Расширения браузера: Фильтрация контента в соцсетях, Безопасный поиск, Родительский контроль, Аналитика и отчеты: Статистика нарушений, Тренды и паттерны, Автоматические отчеты
