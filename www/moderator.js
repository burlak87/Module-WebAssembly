let moderatorInitialized = false;

function loadContentModerator() {
  return new Promise((resolve, reject) => {
    console.log("🔄 Загрузка Content Moderator...");

    if (
      window.ContentModeratorModule &&
      typeof window.ContentModeratorModule.cwrap === "function"
    ) {
      console.log("✅ Content Moderator уже загружен как объект");
      resolve(window.ContentModeratorModule);
      return;
    }

    if (
      window.ContentModeratorModule &&
      typeof window.ContentModeratorModule === "function"
    ) {
      console.log("✅ Найдена ContentModeratorModule factory");

      const moduleConfig = {
        locateFile: function (path) {
          if (path.endsWith(".wasm")) {
            return "content_moderator.wasm";
          }
          return path;
        },
        onRuntimeInitialized: function () {
          console.log("✅ Content Moderator WASM инициализирован");
          resolve(this);
        },
        onAbort: function (reason) {
          console.error("❌ Content Moderator прерван:", reason);
          reject(new Error(`WASM module aborted: ${reason}`));
        },
      };

      try {
        const instance = window.ContentModeratorModule(moduleConfig);
        if (instance && typeof instance.then === "function") {
          instance.then(resolve).catch(reject);
        }
      } catch (error) {
        reject(error);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "content_moderator.js";

    script.onload = function () {
      console.log("✅ Content Moderator script загружен");

      setTimeout(() => {
        if (window.ContentModeratorModule) {
          if (typeof window.ContentModeratorModule === "function") {
            const moduleConfig = {
              locateFile: function (path) {
                if (path.endsWith(".wasm")) {
                  return "content_moderator.wasm";
                }
                return path;
              },
              onRuntimeInitialized: function () {
                console.log("✅ Content Moderator WASM инициализирован");
                resolve(this);
              },
            };

            try {
              const instance = window.ContentModeratorModule(moduleConfig);
              if (instance && typeof instance.then === "function") {
                instance.then(resolve).catch(reject);
              }
            } catch (error) {
              reject(error);
            }
          } else if (
            typeof window.ContentModeratorModule.cwrap === "function"
          ) {
            console.log("✅ Content Moderator уже инициализирован");
            resolve(window.ContentModeratorModule);
          } else {
            reject(
              new Error(
                "ContentModeratorModule loaded but not in expected format",
              ),
            );
          }
        } else {
          reject(
            new Error("ContentModeratorModule not found after script load"),
          );
        }
      }, 100);
    };

    script.onerror = function (err) {
      console.error("❌ Ошибка загрузки Content Moderator script:", err);
      reject(new Error("Failed to load content_moderator.js"));
    };

    document.head.appendChild(script);
  });
}

async function initModerator() {
  if (moderatorInitialized) {
    console.log("✅ Content Moderator уже инициализирован");
    return;
  }

  try {
    console.log("🔄 Инициализация Content Moderator...");

    const moderatorModule = await loadContentModerator();
    console.log("✅ Content Moderator модуль загружен");

    window.init_moderator = moderatorModule.cwrap("init_moderator", null, []);
    window.analyze_image = moderatorModule.cwrap("analyze_image", "number", [
      "number",
      "number",
      "number",
    ]);
    window.analyze_image_with_sensitivity = moderatorModule.cwrap(
      "analyze_image_with_sensitivity",
      "number",
      ["number", "number", "number", "number"],
    );

    console.log("✅ Функции C++ обернуты");

    window.init_moderator();
    console.log("✅ init_moderator выполнен");

    window.moderatorModule = moderatorModule;
    moderatorInitialized = true;

    console.log("✅ Content Moderator полностью инициализирован");
  } catch (error) {
    console.error("❌ Ошибка инициализации Content Moderator:", error);
    throw error;
  }
}

function analyzeImageData(imageData, sensitivity = 50) {
  if (!moderatorInitialized || !window.moderatorModule) {
    throw new Error("Moderator not initialized");
  }

  const width = imageData.width;
  const height = imageData.height;
  const data = imageData.data;

  console.log(`🖼️ Анализ изображения: ${width}x${height}`);

  const buffer = window.moderatorModule._malloc(data.length);
  window.moderatorModule.HEAPU8.set(data, buffer);

  let result;
  try {
    if (sensitivity !== 50) {
      result = window.analyze_image_with_sensitivity(
        buffer,
        width,
        height,
        sensitivity,
      );
    } else {
      result = window.analyze_image(buffer, width, height);
    }
  } catch (error) {
    window.moderatorModule._free(buffer);
    throw error;
  }

  window.moderatorModule._free(buffer);

  return result;
}

async function analyzeImageFile(file, sensitivity = 50) {
  if (!moderatorInitialized) {
    await initModerator();
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = function () {
      try {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        const result = analyzeImageData(imageData, sensitivity);

        URL.revokeObjectURL(url);
        resolve(result);
      } catch (error) {
        URL.revokeObjectURL(url);
        reject(error);
      }
    };

    img.onerror = function () {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

function getRiskLevel(probability) {
  if (probability < 20) return "safe";
  if (probability < 50) return "low";
  if (probability < 75) return "medium";
  return "high";
}

window.initModerator = initModerator;
window.analyzeImageFile = analyzeImageFile;
window.getRiskLevel = getRiskLevel;
window.moderatorInitialized = false;

console.log("✅ moderator_fixed.js загружен");
