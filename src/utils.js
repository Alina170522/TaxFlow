const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 })

export function rub(value) {
  if (value === Infinity) return 'без лимита'
  return `${money.format(Math.round(Number(value) || 0))} ₽`
}

export function fileSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`
}

export function plural(n, [one, few, many]) {
  const m10 = n % 10
  const m100 = n % 100
  if (m10 === 1 && m100 !== 11) return one
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
  return many
}
