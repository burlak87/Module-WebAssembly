#ifndef CONTENT_MODERATOR_HPP
#define CONTENT_MODERATOR_HPP

#include <cstdint>

#ifdef __cplusplus
extern "C" {
#endif

void init_moderator();

int analyze_image(const uint8_t* image_data, int width, int height);

int analyze_image_with_sensitivity(const uint8_t* image_data, int width, int height, int sensitivity);

void cleanup_moderator();

#ifdef __cplusplus
}
#endif

#endif
