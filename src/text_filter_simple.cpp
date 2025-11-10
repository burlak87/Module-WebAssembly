#include "text_filter.hpp"
#include <vector>
#include <string>
#include <algorithm>
#include <cstring>
#include <cctype>

namespace {

std::vector<std::string> bad_words;
bool is_initialized = false;

// Простая функция для приведения к нижнему регистру
std::string to_lower(const std::string& str) {
    std::string result = str;
    for (char& c : result) {
        c = std::tolower(static_cast<unsigned char>(c));
    }
    return result;
}

} // namespace

void init_text_filter() {
    if (is_initialized) return;

    // Базовый список запрещенных слов
    const char* default_bad_words[] = {
        "мат", "спам", "оскорбление", "ненависть"
    };

    for (const char* word : default_bad_words) {
        bad_words.push_back(to_lower(word));
    }

    is_initialized = true;
}

void add_bad_word(const char* word) {
    if (!word) return;
    std::string word_str = to_lower(word);

    // Проверяем, нет ли уже такого слова
    if (std::find(bad_words.begin(), bad_words.end(), word_str) == bad_words.end()) {
        bad_words.push_back(word_str);
    }
}

int check_text(const char* text) {
    if (!text || !is_initialized) return 0;

    std::string text_lower = to_lower(text);

    // Простой поиск подстроки
    for (const std::string& bad_word : bad_words) {
        if (text_lower.find(bad_word) != std::string::npos) {
            return 1; // Найдено запрещенное слово
        }
    }

    return 0; // Текст чистый
}

int get_bad_words_count() {
    return static_cast<int>(bad_words.size());
}

// Простые реализации остальных функций
void load_bad_words(const char* words) {
    if (!words) return;

    std::string words_str = to_lower(words);
    std::string current_word;

    for (size_t i = 0; i <= words_str.length(); i++) {
        if (i == words_str.length() || words_str[i] == ',') {
            if (!current_word.empty()) {
                bad_words.push_back(current_word);
                current_word.clear();
            }
        } else {
            current_word += words_str[i];
        }
    }
}

void clear_bad_words() {
    bad_words.clear();
}

void remove_bad_word(const char* word) {
    if (!word) return;
    std::string word_str = to_lower(word);

    for (auto it = bad_words.begin(); it != bad_words.end(); ) {
        if (*it == word_str) {
            it = bad_words.erase(it);
        } else {
            ++it;
        }
    }
}

int check_text_with_detail(const char* text, char* found_word) {
    if (!text || !found_word || !is_initialized) return 0;

    std::string text_lower = to_lower(text);

    for (const std::string& bad_word : bad_words) {
        if (text_lower.find(bad_word) != std::string::npos) {
            // Копируем найденное слово в буфер
            std::strncpy(found_word, bad_word.c_str(), 63);
            found_word[63] = '\0';
            return 1;
        }
    }

    found_word[0] = '\0';
    return 0;
}

void cleanup_text_filter() {
    bad_words.clear();
    is_initialized = false;
}
