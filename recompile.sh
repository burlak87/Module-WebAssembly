#!/bin/bash

echo "🔨 Компиляция простой версии..."

mkdir -p build
mkdir -p www

echo "🔤 Компиляция Text Filter..."
emcc src/text_filter_simple.cpp \
  -I src/ \
  -O2 \
  -s WASM=1 \
  -s EXPORTED_FUNCTIONS='["_init_text_filter", "_load_bad_words", "_check_text", "_check_text_with_detail", "_add_bad_word", "_remove_bad_word", "_clear_bad_words", "_get_bad_words_count", "_cleanup_text_filter", "_malloc", "_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["cwrap", "UTF8ToString", "stringToUTF8"]' \
  -o build/text_filter.js

cp build/text_filter.wasm www/
cp build/text_filter.js www/

echo "✅ Компиляция завершена"
