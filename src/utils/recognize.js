// Распознавание документа по фото через Claude.
// Работает только на странице, опубликованной на платформе Claude (возможность sample с изображениями).
// На GitHub Pages и локально window.claude нет: кнопка «Заполнить по фото» просто не показывается.

const CATEGORY_IDS = ['medicine', 'education', 'sport', 'property']
const KIND_IDS = ['cert', 'receipt', 'contract']
// Форматы картинок, которые Claude читает; PDF и HEIC заполняются вручную
export const RECOGNIZABLE = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

let samplePromise = null

function getSample() {
  if (typeof window === 'undefined' || !window.claude?.use) return Promise.resolve(null)
  samplePromise ??= Promise.resolve(window.claude.use('sample')).catch(() => null)
  return samplePromise
}

// Можно ли распознавать картинки в этом окне
export async function canRecognize() {
  const sample = await getSample()
  if (!sample) return false
  try {
    const limits = await sample.limits?.()
    return Boolean(limits?.images)
  } catch {
    return false
  }
}

const PROMPT = `Ты помогаешь заполнить карточку документа для налогового вычета в России.
На изображении должен быть кассовый чек, справка об оплате услуг или договор.
Верни только JSON без пояснений и без markdown:
{"kind": "cert" | "receipt" | "contract" | "unknown", "category": "medicine" | "education" | "sport" | "property" | null, "org": строка или null, "date": "YYYY-MM-DD" или null, "amount": число или null}
kind: cert — справка об оплате услуг для налоговой, receipt — кассовый чек, contract — договор.
category: medicine — лечение, стоматология, лекарства; education — обучение; sport — фитнес и спорт; property — покупка жилья или ипотека.
org — название организации, которой платили, как в документе.
date — дата оплаты или дата документа.
amount — итоговая сумма в рублях, только число.
Если на изображении нет документа об оплате или текст нельзя прочитать, верни {"kind": "unknown"}.`

function parse(value) {
  if (typeof value === 'string') {
    const match = value.match(/\{[\s\S]*\}/)
    value = match ? JSON.parse(match[0]) : null
  }
  if (!value || typeof value !== 'object' || !KIND_IDS.includes(value.kind)) return null
  const amount = Number(value.amount)
  return {
    kind: value.kind,
    category: CATEGORY_IDS.includes(value.category) ? value.category : '',
    org: typeof value.org === 'string' ? value.org.trim().slice(0, 120) : '',
    date: /^\d{4}-\d{2}-\d{2}$/.test(value.date || '') ? value.date : '',
    amount: Number.isFinite(amount) && amount > 0 ? String(Math.round(amount * 100) / 100) : ''
  }
}

// Фото с телефона весит несколько мегабайт: уменьшаем до 1600 px по длинной стороне,
// текст чека при этом читается, а запрос уходит быстрее. Если не вышло, отправляем как есть
async function shrink(file) {
  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1_500_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
    return blob || file
  } catch {
    return file
  }
}

// Возвращает поля документа или null, если распознать не удалось.
// Ошибки платформы приходят с code: not_granted (пользователь не разрешил), rate_limited и другие
export async function recognizeDocument(file, { signal } = {}) {
  const sample = await getSample()
  if (!sample) throw Object.assign(new Error('Распознавание недоступно'), { code: 'unavailable' })
  const image = await shrink(file)
  const opts = { images: [image], modelTier: 'default', cache: false, signal }
  const value = typeof sample.json === 'function' ? await sample.json(PROMPT, opts) : (await sample(PROMPT, opts)).text
  return parse(value)
}
