#include "text_filter.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

EMSCRIPTEN_BINDINGS(text_filter) {
    function("init_text_filter", &init_text_filter);
    function("load_bad_words", &load_bad_words);
    function("check_text", &check_text);
    function("check_text_with_detail", &check_text_with_detail);
    function("add_bad_word", &add_bad_word);
    function("remove_bad_word", &remove_bad_word);
    function("clear_bad_words", &clear_bad_words);
    function("get_bad_words_count", &get_bad_words_count);
    function("cleanup_text_filter", &cleanup_text_filter);
}