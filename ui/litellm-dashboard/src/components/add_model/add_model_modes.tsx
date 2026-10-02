// Define the available test modes
export const TEST_MODES = [
  { value: "chat", label: "Чат — /chat/completions" },
  { value: "completion", label: "Комплетинг — /completions" },
  { value: "embedding", label: "Эмбеддинги — /embeddings" },
  { value: "audio_speech", label: "Синтез речи — /audio/speech" },
  { value: "audio_transcription", label: "Транскрипция аудио — /audio/transcriptions" },
  { value: "image_generation", label: "Генерация изображений — /images/generations" },
  { value: "image_edit", label: "Редактирование изображений — /images/edits" },
  { value: "video_generation", label: "Генерация видео — /videos" },
  { value: "rerank", label: "Реранк — /rerank" },
  { value: "realtime", label: "Realtime — /realtime" },
  { value: "batch", label: "Пакетные — /batch" },
  { value: "ocr", label: "OCR — /ocr" },
];

// Define the available auto router routing strategies
export const AUTO_ROUTER_MODES = [
  { value: "simple-shuffle", label: "Простое перемешивание — случайный выбор из доступных моделей" },
  { value: "least-busy", label: "Наименее загруженная — маршрутизация на модель с наименьшей загрузкой" },
  { value: "latency-based", label: "По задержке — маршрутизация на модель с лучшим временем ответа" },
  { value: "cost-based", label: "По стоимости — маршрутизация на самую выгодную модель" },
  { value: "usage-based", label: "По расходу — маршрутизация по историческим паттернам использования" },
  { value: "custom", label: "Пользовательская — своя логика маршрутизации из конфигурации" },
];
