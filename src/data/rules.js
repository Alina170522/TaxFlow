import { plural } from '../utils.js'

// Правила вычетов, упрощённо, по ст. 219 и 220 НК РФ (редакция на 2026 год).
// Прототип: расчёт примерный и не заменяет консультацию.

export const YEARS = [2025, 2024, 2023]

export const RATE = 0.13

export const DEDUCTION_TYPES = [
  {
    id: 'medicine',
    title: 'Лечение',
    hint: 'Платные услуги врачей, стоматология, лекарства по назначению',
    tone: 'light'
  },
  {
    id: 'education',
    title: 'Обучение',
    hint: 'Вуз, колледж, курсы, школа, детский сад, кружки с лицензией',
    tone: 'light'
  },
  {
    id: 'sport',
    title: 'Спорт',
    hint: 'Абонемент в фитнес или секцию из перечня Минспорта',
    tone: 'dark'
  },
  {
    id: 'property',
    title: 'Жильё',
    hint: 'Покупка квартиры или дома, проценты по ипотеке',
    tone: 'dark'
  }
]

// За кого можно заявить вычет. minYear — с какого года расходов это разрешено.
export const PERSONS = {
  medicine: [
    { id: 'me', title: 'За себя' },
    { id: 'spouse', title: 'За супруга или супругу' },
    { id: 'parent', title: 'За родителя' },
    { id: 'child', title: 'За ребёнка', note: 'до 18 лет, с 2024 года — до 24 лет при очной учёбе' }
  ],
  education: [
    { id: 'me', title: 'За себя' },
    { id: 'child', title: 'За ребёнка', note: 'до 24 лет, очная форма' },
    { id: 'sibling', title: 'За брата или сестру', note: 'до 24 лет, очная форма' },
    { id: 'spouse', title: 'За супруга или супругу', note: 'очная форма, с 2024 года', minYear: 2024 }
  ],
  sport: [
    { id: 'me', title: 'За себя' },
    { id: 'child', title: 'За ребёнка', note: 'до 18 лет, до 24 лет при очной учёбе' }
  ],
  property: [{ id: 'me', title: 'За себя', note: 'жильё оформлено на вас или на супруга' }]
}

// Лимит расходов, с которого считается вычет
export function getLimit({ type, year, person, expensive, propertyKind }) {
  if (type === 'property') {
    return propertyKind === 'mortgage' ? 3_000_000 : 2_000_000
  }
  if (type === 'medicine' && expensive) return Infinity
  // На обучение детей — отдельный лимит на каждого ребёнка
  if (type === 'education' && person === 'child') {
    return year >= 2024 ? 110_000 : 50_000
  }
  // Общий лимит социальных вычетов: лечение, своё обучение, спорт, брат или сестра
  return year >= 2024 ? 150_000 : 120_000
}

// НДФЛ за год по прогрессивной шкале (упрощённо, без учёта видов дохода)
export function getIncomeTax(income, year) {
  if (!income || income <= 0) return 0
  if (year < 2025) {
    return Math.round(Math.min(income, 5_000_000) * 0.13 + Math.max(income - 5_000_000, 0) * 0.15)
  }
  const steps = [
    [2_400_000, 0.13],
    [5_000_000, 0.15],
    [20_000_000, 0.18],
    [50_000_000, 0.2],
    [Infinity, 0.22]
  ]
  let tax = 0
  let prev = 0
  for (const [top, rate] of steps) {
    if (income <= prev) break
    tax += (Math.min(income, top) - prev) * rate
    prev = top
  }
  return Math.round(tax)
}

// Документы для вычета. amountKind — документ, из которого берётся сумма расходов:
// social — социальный вычет, purchase — покупка жилья, mortgage — проценты по ипотеке.
export const DOCUMENTS = {
  medicine: [
    { id: 'med-cert', title: 'Справка об оплате медицинских услуг для ФНС', where: 'Выдаёт клиника по запросу. Часто её можно получить онлайн.', amountKind: 'social', amountLabel: 'Сумма по справке, ₽' },
    { id: 'med-contract', title: 'Договор с клиникой', where: 'Копия договора на оказание медицинских услуг.' },
    { id: 'med-receipt', title: 'Чеки об оплате', where: 'Для лекарств — рецепт и чеки из аптеки.', optional: true }
  ],
  education: [
    { id: 'edu-cert', title: 'Справка об оплате образовательных услуг', where: 'Выдаёт учебное заведение по заявлению.', amountKind: 'social', amountLabel: 'Сумма по справке, ₽' },
    { id: 'edu-contract', title: 'Договор на обучение', where: 'Договор с учебным заведением и допсоглашения, если цена менялась.' },
    { id: 'edu-receipt', title: 'Чеки или платёжные поручения', where: 'Пригодятся, если в справке что-то не сходится.', optional: true }
  ],
  sport: [
    { id: 'sport-cert', title: 'Справка об оплате физкультурно-оздоровительных услуг', where: 'Выдаёт фитнес-клуб или секция, если они есть в перечне Минспорта.', amountKind: 'social', amountLabel: 'Сумма по справке, ₽' },
    { id: 'sport-contract', title: 'Договор с фитнес-клубом или секцией', where: 'Договор или оферта, которую вы приняли при покупке абонемента.' },
    { id: 'sport-receipt', title: 'Чеки об оплате абонемента', where: 'Подойдёт фото чека с телефона.', optional: true }
  ],
  property: [
    { id: 'prop-contract', title: 'Договор купли-продажи или ДДУ', where: 'Из пакета документов по сделке.', amountKind: 'purchase', amountLabel: 'Стоимость жилья по договору, ₽' },
    { id: 'prop-egrn', title: 'Выписка из ЕГРН или акт приёма-передачи', where: 'Выписку можно заказать на Госуслугах.' },
    { id: 'prop-payment', title: 'Платёжные документы', where: 'Выписка банка или расписка продавца.' },
    { id: 'prop-interest', title: 'Справка банка об уплаченных процентах', where: 'Если брали ипотеку. Банк выдаёт справку за каждый год.', optional: true, amountKind: 'mortgage', amountLabel: 'Проценты за год по справке, ₽' }
  ]
}

// «Ранее загруженные» документы для формы: берутся из списка в разделе «Документы» за выбранный год.
// В слот с суммой (справка, а для жилья — справка о процентах) идут все документы с суммой, сумма складывается.
// В слот договора — договор, если он есть.
export function earlierDocuments(type, year, items = []) {
  const docs = items.filter((d) => d.category === type && Number(String(d.date).slice(0, 4)) === year)
  const paid = docs.filter((d) => d.amount > 0)
  const contracts = docs.filter((d) => d.kind === 'contract')
  const amountSlot = type === 'property' ? 'mortgage' : 'social'
  const result = {}
  for (const slot of DOCUMENTS[type] || []) {
    if (slot.amountKind === amountSlot && paid.length) {
      result[slot.id] = {
        name: paid.length === 1 ? paid[0].file || paid[0].org : `${paid.length} ${plural(paid.length, ['документ', 'документа', 'документов'])} с суммой: справки и чеки`,
        size: paid.reduce((a, d) => a + (d.size || 0), 0),
        status: 'ready',
        earlier: true,
        uploadedAt: paid[0].addedAt,
        amount: String(paid.reduce((a, d) => a + d.amount, 0)),
        count: paid.length
      }
    } else if (slot.id.endsWith('-contract') && type !== 'property' && contracts.length) {
      result[slot.id] = { name: contracts[0].file || contracts[0].org, size: contracts[0].size || 0, status: 'ready', earlier: true, uploadedAt: contracts[0].addedAt, amount: '' }
    }
  }
  return result
}

// Справки о доходах лежат в личном кабинете налогоплательщика, раздел «Доходы»
export const FNS_CABINET_URL = 'https://lkfl2.nalog.ru/lkfl/login'

export const MAX_FILE_MB = 10
export const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'image/webp']
