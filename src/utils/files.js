import { MAX_FILE_MB, ACCEPTED_TYPES } from '../data/rules.js'

// Проверка файла перед загрузкой: формат и размер, как в форме вычета и в окне «Добавить документ»
export function validateFile(file) {
  const okType = ACCEPTED_TYPES.includes(file.type) || /\.(pdf|jpe?g|png|heic|webp)$/i.test(file.name)
  if (!okType) return 'Формат не поддерживается. Нужен PDF, JPG, PNG или HEIC.'
  if (file.size > MAX_FILE_MB * 1024 * 1024) return `Файл больше ${MAX_FILE_MB} МБ. Сожмите фото или сохраните PDF меньшего размера.`
  if (file.size === 0) return 'Файл пустой. Попробуйте выбрать его ещё раз.'
  return null
}
