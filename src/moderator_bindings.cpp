#include "content_moderator.hpp"
#include <emscripten/bind.h>

using namespace emscripten;

// Обертки для функций с указателями
int analyze_image_wrapper(int ptr, int width, int height) {
    return analyze_image(reinterpret_cast<const uint8_t*>(ptr), width, height);
}

int analyze_image_with_sensitivity_wrapper(int ptr, int width, int height, int sensitivity) {
    return analyze_image_with_sensitivity(reinterpret_cast<const uint8_t*>(ptr), width, height, sensitivity);
}

float get_region_brightness_wrapper(int ptr, int width, int height,
                                   int start_x, int start_y, int region_width, int region_height) {
    return get_region_brightness(reinterpret_cast<const uint8_t*>(ptr), width, height,
                                start_x, start_y, region_width, region_height);
}

void analyze_color_distribution_wrapper(int ptr, int width, int height,
                                       int skin_tone_ptr, int saturated_ptr) {
    float skin_tone, saturated;
    analyze_color_distribution(reinterpret_cast<const uint8_t*>(ptr), width, height,
                              &skin_tone, &saturated);
    
    // Записываем результаты обратно в память
    *reinterpret_cast<float*>(skin_tone_ptr) = skin_tone;
    *reinterpret_cast<float*>(saturated_ptr) = saturated;
}

EMSCRIPTEN_BINDINGS(content_moderator) {
    function("init_moderator", &init_moderator);
    function("analyze_image", &analyze_image_wrapper);
    function("analyze_image_with_sensitivity", &analyze_image_with_sensitivity_wrapper);
    function("cleanup_moderator", &cleanup_moderator);
    function("get_region_brightness", &get_region_brightness_wrapper);
    function("analyze_color_distribution", &analyze_color_distribution_wrapper);
}