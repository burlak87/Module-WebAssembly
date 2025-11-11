#include "content_moderator.hpp"
#include <cmath>
#include <algorithm>

namespace {

struct ModeratorConfig {
    float skin_tone_threshold = 0.15f;
    float saturation_threshold = 0.3f;
    float brightness_threshold = 0.7f;
    int min_skin_region_size = 50;
} config;

bool is_skin_tone(uint8_t r, uint8_t g, uint8_t b) {
    float red = r / 255.0f;
    float green = g / 255.0f;
    float blue = b / 255.0f;

    float cr = red - blue;
    float cb = green - blue;

    return (cr > 0.1f && cr < 0.4f) && (cb > 0.1f && cb < 0.3f);
}

bool is_high_saturation(uint8_t r, uint8_t g, uint8_t b) {
    uint8_t max_val = std::max({r, g, b});
    uint8_t min_val = std::min({r, g, b});

    if (max_val == 0) return false;

    float saturation = (max_val - min_val) / 255.0f;
    return saturation > config.saturation_threshold;
}

void analyze_region(const uint8_t* image_data, int width, int height,
                   int start_x, int start_y, int region_width, int region_height,
                   int& skin_pixels, int& saturated_pixels, int& bright_pixels) {

    skin_pixels = 0;
    saturated_pixels = 0;
    bright_pixels = 0;
    int total_pixels = 0;

    for (int y = start_y; y < start_y + region_height && y < height; ++y) {
        for (int x = start_x; x < start_x + region_width && x < width; ++x) {
            int index = (y * width + x) * 4;
            uint8_t r = image_data[index];
            uint8_t g = image_data[index + 1];
            uint8_t b = image_data[index + 2];

            if (is_skin_tone(r, g, b)) {
                skin_pixels++;
            }
            if (is_high_saturation(r, g, b)) {
                saturated_pixels++;
            }

            float brightness = (0.299f * r + 0.587f * g + 0.114f * b) / 255.0f;
            if (brightness > config.brightness_threshold) {
                bright_pixels++;
            }

            total_pixels++;
        }
    }
}

}

void init_moderator() {
    config = ModeratorConfig();
}

int analyze_image(const uint8_t* image_data, int width, int height) {
    return analyze_image_with_sensitivity(image_data, width, height, 50);
}

int analyze_image_with_sensitivity(const uint8_t* image_data, int width, int height, int sensitivity) {
    if (!image_data || width <= 0 || height <= 0) {
        return 0;
    }

    float sensitivity_factor = sensitivity / 100.0f;
    float adaptive_skin_threshold = config.skin_tone_threshold * (1.0f + sensitivity_factor);
    float adaptive_saturation_threshold = config.saturation_threshold * (1.0f + sensitivity_factor);

    int total_pixels = width * height;
    int skin_pixels = 0;
    int saturated_pixels = 0;
    int sensitive_regions = 0;

    const int region_size = 16;

    for (int y = 0; y < height; y += region_size) {
        for (int x = 0; x < width; x += region_size) {
            int region_skin_pixels, region_saturated_pixels, region_bright_pixels;

            analyze_region(image_data, width, height, x, y, region_size, region_size,
                          region_skin_pixels, region_saturated_pixels, region_bright_pixels);

            float skin_ratio = static_cast<float>(region_skin_pixels) / (region_size * region_size);
            float saturation_ratio = static_cast<float>(region_saturated_pixels) / (region_size * region_size);

            if (skin_ratio > adaptive_skin_threshold && saturation_ratio > adaptive_saturation_threshold) {
                sensitive_regions++;
            }
        }
    }

    int total_skin_pixels = 0;
    int total_saturated_pixels = 0;

    for (int i = 0; i < total_pixels; ++i) {
        int index = i * 4;
        uint8_t r = image_data[index];
        uint8_t g = image_data[index + 1];
        uint8_t b = image_data[index + 2];

        if (is_skin_tone(r, g, b)) {
            total_skin_pixels++;
        }
        if (is_high_saturation(r, g, b)) {
            total_saturated_pixels++;
        }
    }

    float overall_skin_ratio = static_cast<float>(total_skin_pixels) / total_pixels;
    float overall_saturation_ratio = static_cast<float>(total_saturated_pixels) / total_pixels;
    float region_sensitivity_ratio = static_cast<float>(sensitive_regions) /
                                   ((width / region_size) * (height / region_size));

    float nsfw_score = 0.0f;

    nsfw_score += overall_skin_ratio * 40.0f;
    nsfw_score += overall_saturation_ratio * 30.0f;
    nsfw_score += region_sensitivity_ratio * 30.0f;

    nsfw_score *= (1.0f - sensitivity_factor * 0.5f);

    int result = static_cast<int>(std::min(nsfw_score * 100.0f, 100.0f));
    return std::max(0, result);
}

void cleanup_moderator() {
    // Очистка ресурсов (если используются динамические модели)
}

float get_region_brightness(const uint8_t* image_data, int width, int height,
                           int start_x, int start_y, int region_width, int region_height) {
    if (!image_data) return 0.0f;

    float total_brightness = 0.0f;
    int pixel_count = 0;

    for (int y = start_y; y < start_y + region_height && y < height; ++y) {
        for (int x = start_x; x < start_x + region_width && x < width; ++x) {
            int index = (y * width + x) * 4;
            uint8_t r = image_data[index];
            uint8_t g = image_data[index + 1];
            uint8_t b = image_data[index + 2];

            float brightness = 0.299f * r + 0.587f * g + 0.114f * b;
            total_brightness += brightness;
            pixel_count++;
        }
    }

    return pixel_count > 0 ? total_brightness / (pixel_count * 255.0f) : 0.0f;
}

void analyze_color_distribution(const uint8_t* image_data, int width, int height,
                               float* skin_tone_ratio, float* saturated_ratio) {
    if (!image_data || !skin_tone_ratio || !saturated_ratio) {
        return;
    }

    int skin_pixels = 0;
    int saturated_pixels = 0;
    int total_pixels = width * height;

    for (int i = 0; i < total_pixels; ++i) {
        int index = i * 4;
        uint8_t r = image_data[index];
        uint8_t g = image_data[index + 1];
        uint8_t b = image_data[index + 2];

        if (is_skin_tone(r, g, b)) {
            skin_pixels++;
        }
        if (is_high_saturation(r, g, b)) {
            saturated_pixels++;
        }
    }

    *skin_tone_ratio = static_cast<float>(skin_pixels) / total_pixels;
    *saturated_ratio = static_cast<float>(saturated_pixels) / total_pixels;
}
