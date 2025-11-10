#ifndef TEXT_FILTER_HPP
#define TEXT_FILTER_HPP

#include <cstdint>

#ifdef __cplusplus
extern "C" {
#endif

void init_text_filter();
void load_bad_words(const char* words);
int check_text(const char* text);
int check_text_with_detail(const char* text, char* found_word);
void add_bad_word(const char* word);
void remove_bad_word(const char* word);
void clear_bad_words();
int get_bad_words_count();
void cleanup_text_filter();

#ifdef __cplusplus
}
#endif

#endif
