#ifndef CONTENT_MODERATOR_HPP
#define CONTENT_MODERATOR_HPP

#include <cstdint>

extern "C" {

// Инициализация модуля модерации
void init_moderator();

// Анализ изображения в формате RGBA
// Возвращает вероятность NSFW контента (0-100)
int analyze_image(const uint8_t* image_data, int width, int height);

// Анализ изображения с порогом чувствительности
// sensitivity: 0-100, где 0 - самый строгий, 100 - самый мягкий
int analyze_image_with_sensitivity(const uint8_t* image_data, int width, int height, int sensitivity);

// Освобождение ресурсов
void cleanup_moderator();

// Вспомогательная функция для вычисления яркости области
float get_region_brightness(const uint8_t* image_data, int width, int height, 
                           int start_x, int start_y, int region_width, int region_height);

// Вспомогательная функция для анализа цветового распределения
void analyze_color_distribution(const uint8_t* image_data, int width, int height, 
                               float* skin_tone_ratio, float* saturated_ratio);

}

// Структура для хранения результатов анализа
struct AnalysisResult {
    float skin_tone_ratio;
    float saturation_level;
    float brightness_variance;
    int nsfw_probability;
};

#endif