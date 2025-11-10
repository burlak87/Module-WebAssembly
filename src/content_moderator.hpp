#ifndef CONTENT_MODERATOR_HPP
#define CONTENT_MODERATOR_HPP

#include <cstdint>

#ifdef __cplusplus
extern "C" {
#endif

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

#ifdef __cplusplus
}
#endif

#endif