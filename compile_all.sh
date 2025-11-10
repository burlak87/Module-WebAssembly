#!/bin/bash

echo "🚀 Компиляция всех WebAssembly модулей..."

# Создаем папки
mkdir -p build
mkdir -p www

echo "🔤 Компиляция Text Filter..."
emcc src/text_filter.cpp \
  -I src/ \
  -O2 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_init_text_filter", "_load_bad_words", "_check_text", "_check_text_with_detail", "_add_bad_word", "_remove_bad_word", "_clear_bad_words", "_get_bad_words_count", "_cleanup_text_filter", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap", "UTF8ToString", "stringToUTF8"]' \
  -o build/text_filter.js

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции Text Filter!"
    exit 1
fi

echo "🖼️ Компиляция Content Moderator..."
emcc src/content_moderator.cpp \
  -I src/ \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s USE_ES6_IMPORT_META=0 \
  -s ALLOW_MEMORY_GROWTH=1 \
  -s EXPORTED_FUNCTIONS='["_init_moderator", "_analyze_image", "_analyze_image_with_sensitivity", "_cleanup_moderator", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall", "cwrap"]' \
  -o build/content_moderator.js

if [ $? -ne 0 ]; then
    echo "❌ Ошибка компиляции Content Moderator!"
    exit 1
fi

# Копируем файлы
echo "📁 Копирование файлов..."
cp build/text_filter.wasm www/
cp build/text_filter.js www/
cp build/content_moderator.wasm www/
cp build/content_moderator.js www/

echo "✅ Компиляция завершена!"
echo "📁 Файлы в папке www/:"
ls -la www/

echo ""
echo "🚀 Для запуска выполните:"
echo "cd www && python3 -m http.server 8000"