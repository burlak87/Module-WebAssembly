#include "text_filter.hpp"
#include <cstring>
#include <cctype>
#include <algorithm>
#include <string>
#include <vector>
#include <sstream>

namespace {

std::vector<std::string> bad_words;
bool is_initialized = false;

std::string to_lower(const std::string& str) {
    std::string result = str;
    std::transform(result.begin(), result.end(), result.begin(),
                   [](unsigned char c) { return std::tolower(c); });
    return result;
}

std::vector<std::string> split_words(const std::string& text) {
    std::vector<std::string> words;
    std::stringstream ss(text);
    std::string word;

    while (ss >> word) {
        std::string clean_word;
        for (char c : word) {
            if (std::isalnum(static_cast<unsigned char>(c))) {
                clean_word += std::tolower(static_cast<unsigned char>(c));
            }
        }
        if (!clean_word.empty()) {
            words.push_back(clean_word);
        }
    }
    return words;
}

}

void init_text_filter() {
    if (is_initialized) return;

    const char* default_bad_words[] = {
        "мат", "ругательство", "оскорбление", "ненависть",
        "пропаганда", "экстремизм", "насилие", "угроза",
        "спам", "мошенничество", "обман", "fake",
        "drugs", "violence", "hate", "scam"
    };

    for (const char* word : default_bad_words) {
        bad_words.push_back(to_lower(word));
    }

    is_initialized = true;
}

void add_bad_word(const char* word) {
    if (!word) return;
    std::string word_str = to_lower(word);

    if (std::find(bad_words.begin(), bad_words.end(), word_str) == bad_words.end()) {
        bad_words.push_back(word_str);
    }
}

int check_text(const char* text) {
    if (!text || !is_initialized) return 0;

    std::string text_str(text);
    std::vector<std::string> words = split_words(text_str);

    for (const std::string& word : words) {
        for (const std::string& bad_word : bad_words) {
            if (word == bad_word) {
                return 1;
            }
        }
    }

    return 0;
}

int get_bad_words_count() {
    return static_cast<int>(bad_words.size());
}

void load_bad_words(const char* words) {
    if (!words) return;

    std::string words_str(words);
    std::stringstream ss(words_str);
    std::string word;

    while (std::getline(ss, word, ',')) {
        word.erase(0, word.find_first_not_of(" \t\n\r\f\v"));
        word.erase(word.find_last_not_of(" \t\n\r\f\v") + 1);

        if (!word.empty()) {
            add_bad_word(word.c_str());
        }
    }
}

void clear_bad_words() {
    bad_words.clear();
}

int check_text_with_detail(const char* text, char* found_word) {
    return 0;
}

void remove_bad_word(const char* word) {
}

void cleanup_text_filter() {
}



// // Функция для очистки строки от знаков препинания
// std::string clean_word(const std::string& word) {
//     std::string result;
//     for (char c : word) {
//         if (std::isalnum(static_cast<unsigned char>(c))) {
//             result += std::tolower(static_cast<unsigned char>(c));
//         }
//     }
//     return result;
// }

// // Разделение строки на слова по разделителям
// std::vector<std::string> split_text(const std::string& text) {
//     std::vector<std::string> words;
//     std::stringstream ss(text);
//     std::string word;

//     while (ss >> word) {
//         // Убираем знаки препинания вокруг слова
//         while (!word.empty() && std::ispunct(static_cast<unsigned char>(word.front()))) {
//             word.erase(0, 1);
//         }
//         while (!word.empty() && std::ispunct(static_cast<unsigned char>(word.back()))) {
//             word.pop_back();
//         }

//         if (!word.empty()) {
//             words.push_back(to_lower_case(word));
//         }
//     }

//     return words;
// }

// // Проверка на схожесть слов (простой алгоритм)
// bool is_similar(const std::string& word1, const std::string& word2) {
//     // Простая проверка на замену символов
//     if (word1.length() != word2.length()) {
//         return false;
//     }

//     int differences = 0;
//     for (size_t i = 0; i < word1.length(); ++i) {
//         if (word1[i] != word2[i]) {
//             // Проверяем распространенные замены
//             if ((word1[i] == '0' && word2[i] == 'o') ||
//                 (word1[i] == 'o' && word2[i] == '0') ||
//                 (word1[i] == '1' && word2[i] == 'l') ||
//                 (word1[i] == 'l' && word2[i] == '1') ||
//                 (word1[i] == '3' && word2[i] == 'e') ||
//                 (word1[i] == 'e' && word2[i] == '3') ||
//                 (word1[i] == '4' && word2[i] == 'a') ||
//                 (word1[i] == 'a' && word2[i] == '4') ||
//                 (word1[i] == '5' && word2[i] == 's') ||
//                 (word1[i] == 's' && word2[i] == '5') ||
//                 (word1[i] == '7' && word2[i] == 't') ||
//                 (word1[i] == 't' && word2[i] == '7')) {
//                 differences++;
//             } else {
//                 return false;
//             }
//         }
//     }

//     return differences <= 2; // Допускаем до 2 замен
// }

// } // анонимное пространство имен

// // Реализации функций
// void init_text_filter() {
//     if (is_initialized) return;

//     // Базовый список запрещенных слов (можно расширить)
//     const char* default_bad_words[] = {
//         "мат", "ругательство", "оскорбление", "ненависть",
//         "пропаганда", "экстремизм", "насилие", "угроза",
//         "спам", "мошенничество", "обман", "fake",
//         "drugs", "violence", "hate", "scam",
//         // Добавьте другие слова по необходимости
//     };

//     for (const char* word : default_bad_words) {
//         bad_words.push_back(to_lower_case(word));
//     }

//     is_initialized = true;
// }

// void load_bad_words(const char* words) {
//     if (!words) return;

//     bad_words.clear();
//     std::string words_str(words);
//     std::stringstream ss(words_str);
//     std::string word;

//     while (std::getline(ss, word, ',')) {
//         // Убираем пробелы вокруг слова
//         word.erase(0, word.find_first_not_of(" \t\n\r\f\v"));
//         word.erase(word.find_last_not_of(" \t\n\r\f\v") + 1);

//         if (!word.empty()) {
//             bad_words.push_back(to_lower_case(word));
//         }
//     }
// }

// int check_text(const char* text) {
//     if (!text || !is_initialized) return 0;

//     std::string text_str(text);
//     std::vector<std::string> words = split_text(text_str);

//     for (const std::string& word : words) {
//         std::string clean = clean_word(word);
//         if (clean.empty()) continue;

//         // Прямое сравнение
//         for (const std::string& bad_word : bad_words) {
//             if (clean == bad_word) {
//                 return 1; // Найдено запрещенное слово
//             }

//             // Проверка на частичное совпадение (для длинных слов)
//             if (clean.length() >= 3 && bad_word.length() >= 3) {
//                 if (clean.find(bad_word) != std::string::npos ||
//                     bad_word.find(clean) != std::string::npos) {
//                     return 1;
//                 }
//             }

//             // Проверка на схожесть (обход фильтра)
//             if (is_similar(clean, bad_word)) {
//                 return 1;
//             }
//         }
//     }

//     return 0; // Текст чистый
// }

// int check_text_with_detail(const char* text, char* found_word) {
//     if (!text || !found_word || !is_initialized) return 0;

//     std::string text_str(text);
//     std::vector<std::string> words = split_text(text_str);

//     for (const std::string& word : words) {
//         std::string clean = clean_word(word);
//         if (clean.empty()) continue;

//         for (const std::string& bad_word : bad_words) {
//             if (clean == bad_word ||
//                 (clean.length() >= 3 && bad_word.length() >= 3 &&
//                  (clean.find(bad_word) != std::string::npos ||
//                   bad_word.find(clean) != std::string::npos)) ||
//                 is_similar(clean, bad_word)) {

//                 // Копируем найденное слово в буфер
//                 size_t copy_len = std::min(bad_word.length(), size_t(63));
//                 std::strncpy(found_word, bad_word.c_str(), copy_len);
//                 found_word[copy_len] = '\0';

//                 return 1;
//             }
//         }
//     }

//     found_word[0] = '\0';
//     return 0;
// }

// void add_bad_word(const char* word) {
//     if (!word) return;

//     std::string word_str = to_lower_case(word);
//     // Проверяем, нет ли уже такого слова
//     if (std::find(bad_words.begin(), bad_words.end(), word_str) == bad_words.end()) {
//         bad_words.push_back(word_str);
//     }
// }

// void remove_bad_word(const char* word) {
//     if (!word) return;

//     std::string word_str = to_lower_case(word);
//     auto it = std::find(bad_words.begin(), bad_words.end(), word_str);
//     if (it != bad_words.end()) {
//         bad_words.erase(it);
//     }
// }

// void clear_bad_words() {
//     bad_words.clear();
// }

// int get_bad_words_count() {
//     return static_cast<int>(bad_words.size());
// }

// void cleanup_text_filter() {
//     bad_words.clear();
//     bad_words.shrink_to_fit();
//     is_initialized = false;
// }
