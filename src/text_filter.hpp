#ifndef TEXT_FILTER_HPP
#define TEXT_FILTER_HPP

#include <cstdint>

extern "C" {

// Инициализация фильтра с базовым списком запрещенных слов
void init_text_filter();

// Загрузка кастомного списка запрещенных слов
// words: строка с словами, разделенными запятыми
void load_bad_words(const char* words);

// Проверка текста на запрещенные слова
// Возвращает: 0 - текст чистый, 1 - найдены запрещенные слова
int check_text(const char* text);

// Проверка текста с возвратом конкретного найденного запрещенного слова
// found_word: буфер для записи найденного слова (минимум 64 байта)
// Возвращает: 0 - чистый, 1 - найдены запрещенные слова
int check_text_with_detail(const char* text, char* found_word);

// Добавление слова в черный список
void add_bad_word(const char* word);

// Удаление слова из черного списка
void remove_bad_word(const char* word);

// Очистка всех запрещенных слов
void clear_bad_words();

// Получение количества запрещенных слов
int get_bad_words_count();

// Освобождение ресурсов
void cleanup_text_filter();

}

#endif