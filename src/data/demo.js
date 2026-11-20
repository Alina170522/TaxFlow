// Демо-данные прототипа: документы, которые пользователь будто бы уже загрузил.
// Один источник для главной, раздела «Документы» и формы вычета, чтобы суммы везде совпадали.
// Итоги за 2025 год как в мобильном макете и UI-kit: медицина 24 500 ₽ (3 организации),
// образование 42 000 ₽ (2), спорт 4 500 ₽ (1), недвижимость 12 450 ₽ (1), всего 83 450 ₽.

export const DEMO_USER = { name: 'Иванов Сергей' }

// Год, за который на главной показаны расходы
export const DEMO_YEAR = 2025

export const CATEGORIES = [
  { type: 'medicine', title: 'Медицина', tone: 'light' },
  { type: 'education', title: 'Образование', tone: 'light' },
  { type: 'sport', title: 'Спорт', tone: 'dark' },
  { type: 'property', title: 'Недвижимость', tone: 'dark' }
]

export const DOC_KINDS = [
  { id: 'cert', title: 'Справка об оплате' },
  { id: 'receipt', title: 'Чек' },
  { id: 'contract', title: 'Договор' }
]

// kind: cert — справка об оплате, receipt — чек, contract — договор (без суммы)
export const DEMO_DOCUMENTS = [
  { category: 'medicine', kind: 'cert', org: 'ООО «Здоровье»', date: '2025-05-12', amount: 12_000, file: 'Справка_Здоровье_2025.pdf', size: 184_000 },
  { category: 'medicine', kind: 'cert', org: 'Стоматология «Улыбка»', date: '2025-08-20', amount: 9_000, file: 'Справка_Улыбка_2025.pdf', size: 176_000 },
  { category: 'medicine', kind: 'receipt', org: 'Аптека «Ромашка»', date: '2025-09-03', amount: 3_500, file: 'Чек_аптека.jpg', size: 482_000 },
  { category: 'medicine', kind: 'contract', org: 'ООО «Здоровье»', date: '2025-01-15', amount: null, file: 'Договор_Здоровье.pdf', size: 236_000 },
  { category: 'education', kind: 'cert', org: 'ТУСУР', date: '2025-09-01', amount: 37_000, file: 'Справка_ТУСУР_2025.pdf', size: 198_000 },
  { category: 'education', kind: 'cert', org: '«Lingua Друзья»', date: '2025-10-10', amount: 5_000, file: 'Справка_Lingua_2025.pdf', size: 151_000 },
  { category: 'education', kind: 'contract', org: 'ТУСУР', date: '2025-08-25', amount: null, file: 'Договор_на_обучение.pdf', size: 312_000 },
  { category: 'sport', kind: 'cert', org: 'Фитнес-зал «Super-Gym»', date: '2025-06-30', amount: 4_500, file: 'Справка_Super-Gym_2025.pdf', size: 143_000 },
  { category: 'sport', kind: 'contract', org: 'Фитнес-зал «Super-Gym»', date: '2025-01-10', amount: null, file: 'Договор_Super-Gym.pdf', size: 205_000 },
  { category: 'property', kind: 'cert', org: 'Банк, справка о процентах', date: '2025-12-31', amount: 12_450, file: 'Справка_о_процентах_2025.pdf', size: 167_000 }
].map((d, i) => ({ ...d, id: `demo-${i + 1}`, demo: true, addedAt: '14.02.2026' }))

// Справки, запрошенные у организаций
export const DEMO_CERTIFICATES = { ready: 3, total: 6 }

export const categoryTitle = (type) => CATEGORIES.find((c) => c.type === type)?.title || ''
export const kindTitle = (kind) => DOC_KINDS.find((k) => k.id === kind)?.title || ''
export const yearOf = (date) => Number(String(date || '').slice(0, 4)) || null
