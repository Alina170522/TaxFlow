import { defineStore } from 'pinia'
import { DEDUCTION_TYPES, PERSONS, DOCUMENTS, RATE, getLimit, getIncomeTax, earlierDocuments } from '../data/rules.js'
import { useLibraryStore } from './library.js'

// v2: в форме нет шага «Расходы», суммы берутся из документов
const STORAGE_KEY = 'flowtax-draft-v2'
export const STEPS = ['Вид вычета', 'Документы', 'Доход', 'Проверка']

function emptyState() {
  return {
    step: 1,
    done: false,
    type: null,
    year: 2025,
    person: 'me',
    expensive: false,
    // docId -> { name, size, status: 'uploading' | 'ready' | 'error', error, amount, earlier, uploadedAt }
    documents: {},
    income: null
  }
}

function loadDraft() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    // Файлы не сохраняются между сессиями: оставляем только готовые записи о них
    for (const [id, doc] of Object.entries(data.documents || {})) {
      if (doc.status !== 'ready') delete data.documents[id]
    }
    return data
  } catch {
    return null
  }
}

// Ошибка суммы в документе, из которого берутся расходы
export function amountError(doc) {
  if (!doc || doc.status !== 'ready') return null
  const raw = String(doc.amount ?? '').trim()
  if (!raw) return 'Укажите сумму из документа'
  const amount = Number(raw)
  if (Number.isNaN(amount)) return 'Введите сумму числом'
  if (amount <= 0) return 'Сумма должна быть больше нуля'
  if (amount > 100_000_000) return 'Проверьте сумму'
  return null
}

export const useFormStore = defineStore('form', {
  state: () => ({ ...emptyState(), ...(loadDraft() || {}) }),

  getters: {
    typeInfo: (s) => DEDUCTION_TYPES.find((t) => t.id === s.type) || null,

    persons: (s) => (s.type ? PERSONS[s.type].filter((p) => !p.minYear || s.year >= p.minYear) : []),

    personInfo() {
      return this.persons.find((p) => p.id === this.person) || null
    },

    docsList: (s) => (s.type ? DOCUMENTS[s.type] : []),

    requiredDocs() {
      return this.docsList.filter((d) => !d.optional)
    },

    // Документы с суммой, которые участвуют в расчёте
    amountDocs() {
      return this.docsList
        .filter((d) => d.amountKind && this.documents[d.id]?.status === 'ready')
        .map((d) => ({ ...d, amount: Number(this.documents[d.id].amount) || 0 }))
    },

    totalExpenses() {
      return this.amountDocs.reduce((sum, d) => sum + d.amount, 0)
    },

    incomeTax: (s) => getIncomeTax(Number(s.income) || 0, s.year),

    // Расчёт возврата: по каждой группе расходов свой лимит
    calc(s) {
      if (!s.type) return { base: 0, limit: 0, refund: 0, capped: false, carryOver: 0, groups: [] }
      const kinds = s.type === 'property' ? ['purchase', 'mortgage'] : ['social']
      const groups = []
      for (const kind of kinds) {
        const sum = this.amountDocs.filter((d) => d.amountKind === kind).reduce((a, d) => a + d.amount, 0)
        if (sum > 0 || kind === 'social') {
          const limit =
            s.type === 'property'
              ? getLimit({ type: 'property', propertyKind: kind })
              : getLimit({ type: s.type, year: s.year, person: s.person, expensive: s.expensive })
          groups.push({ kind, sum, limit, base: Math.min(sum, limit) })
        }
      }
      const base = groups.reduce((a, g) => a + g.base, 0)
      const full = Math.round(base * RATE)
      const tax = this.incomeTax
      const refund = s.income ? Math.min(full, tax) : full
      const capped = Boolean(s.income) && full > tax
      // Остаток имущественного вычета переносится, остаток социального сгорает
      const carryOver = s.type === 'property' && capped ? full - refund : 0
      const limitHit = groups.some((g) => g.sum > g.limit)
      return { base, full, refund, capped, carryOver, groups, limitHit }
    },

    missingDocs() {
      return this.requiredDocs.filter((d) => this.documents[d.id]?.status !== 'ready')
    },

    amountErrors() {
      return this.docsList.filter((d) => d.amountKind && amountError(this.documents[d.id]))
    },

    stepErrors() {
      return {
        1: !this.type ? 'Выберите вид вычета' : !this.personInfo ? 'Выберите, за кого вы платили' : null,
        2: this.missingDocs.length
          ? `Загрузите документы: осталось ${this.missingDocs.length}`
          : this.amountErrors.length
            ? 'Проверьте суммы в документах'
            : null,
        3: !this.income || Number(this.income) <= 0 ? 'Укажите доход за год' : null,
        4: null
      }
    }
  },

  actions: {
    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.$state))
      } catch {
        // хранилище недоступно — черновик просто не сохранится
      }
    },

    setType(type) {
      if (this.type !== type) {
        this.type = type
        this.person = 'me'
        this.expensive = false
        this.documents = earlierDocuments(type, this.year, useLibraryStore().items)
      }
    },

    setYear(year) {
      if (this.year === year) return
      this.year = year
      if (!this.persons.some((p) => p.id === this.person)) this.person = 'me'
      // Справки выдаются за конкретный год, поэтому подставляем документы за новый год
      if (this.type) this.documents = earlierDocuments(this.type, year, useLibraryStore().items)
    },

    // Документ, добавленный в разделе «Документы», сразу попадает в черновик заявления за тот же год.
    // Файлы, загруженные прямо в форме, не трогаем
    syncEarlier() {
      if (!this.type || this.done) return
      const fresh = earlierDocuments(this.type, this.year, useLibraryStore().items)
      const docs = { ...this.documents }
      for (const [id, doc] of Object.entries(docs)) if (doc.earlier && !fresh[id]) delete docs[id]
      for (const [id, doc] of Object.entries(fresh)) if (!docs[id] || docs[id].earlier) docs[id] = doc
      this.documents = docs
    },

    goTo(step) {
      this.step = Math.min(Math.max(step, 1), STEPS.length)
    },

    finish() {
      this.done = true
    },

    reset() {
      Object.assign(this, emptyState())
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ничего */
      }
    }
  }
})
