// Демо-данные прототипа: то, что пользователь будто бы уже внёс в разделах «Расходы» и «Документы».
// Один источник для главной и формы вычета, чтобы суммы везде совпадали.
// Суммы и количество организаций — как в макете (мобильная версия и UI-kit).

export const DEMO_USER = { name: 'Иванов Сергей' }

// Год, за который на главной показаны расходы
export const DEMO_YEAR = 2025

export const DEMO_CATEGORIES = [
  { type: 'medicine', title: 'Медицина', tone: 'light' },
  { type: 'education', title: 'Образование', tone: 'light' },
  { type: 'sport', title: 'Спорт', tone: 'dark' },
  { type: 'property', title: 'Недвижимость', tone: 'dark' }
]

// Расходы по годам и видам: сумма и организации, которым платили
export const DEMO_EXPENSES = {
  2025: {
    medicine: { amount: 24_500, orgs: ['Клиника', 'Стоматология', 'Аптека'] },
    education: { amount: 42_000, orgs: ['Колледж', 'Языковые курсы'] },
    sport: { amount: 4_500, orgs: ['Фитнес-клуб'] },
    property: { amount: 12_450, orgs: ['Банк'] }
  }
}

// Справки, запрошенные у организаций
export const DEMO_CERTIFICATES = { ready: 3, total: 6 }

export function demoExpense(type, year) {
  return DEMO_EXPENSES[year]?.[type] || null
}

export function demoYearTotal(year = DEMO_YEAR) {
  return Object.values(DEMO_EXPENSES[year] || {}).reduce((sum, e) => sum + e.amount, 0)
}
