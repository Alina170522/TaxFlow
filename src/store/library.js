import { defineStore } from 'pinia'
import { DEMO_DOCUMENTS, CATEGORIES, yearOf } from '../data/demo.js'

// Все документы пользователя: демо-набор плюс добавленные в разделе «Документы».
// Хранятся в браузере, файлы никуда не отправляются (сохраняются только имя и размер).
const STORAGE_KEY = 'flowtax-library-v1'

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const data = raw ? JSON.parse(raw) : null
    return Array.isArray(data?.items) ? data.items : null
  } catch {
    return null
  }
}

let uid = 0
const newId = () => `doc-${Date.now().toString(36)}-${(uid++).toString(36)}`

export const useLibraryStore = defineStore('library', {
  state: () => ({ items: load() || DEMO_DOCUMENTS.map((d) => ({ ...d })) }),

  getters: {
    // Документы за год по виду вычета
    forYear: (s) => (type, year) => s.items.filter((d) => d.category === type && yearOf(d.date) === year),

    // Итоги по категориям за год: сумма и число организаций, которым платили
    totals: (s) => (year) =>
      CATEGORIES.map((c) => {
        const paid = s.items.filter((d) => d.category === c.type && yearOf(d.date) === year && d.amount > 0)
        return {
          ...c,
          amount: paid.reduce((sum, d) => sum + d.amount, 0),
          orgs: new Set(paid.map((d) => d.org.trim().toLowerCase())).size
        }
      }),

    yearTotal() {
      return (year) => this.totals(year).reduce((sum, c) => sum + c.amount, 0)
    }
  },

  actions: {
    add(doc) {
      const today = new Date()
      const addedAt = `${String(today.getDate()).padStart(2, '0')}.${String(today.getMonth() + 1).padStart(2, '0')}.${today.getFullYear()}`
      const item = { ...doc, id: newId(), demo: false, addedAt }
      this.items.unshift(item)
      return item
    },

    save() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ items: this.items }))
      } catch {
        // хранилище недоступно — список просто не сохранится
      }
    },

    // Вернуть демо-набор (на случай, если список нужно показать с нуля)
    resetDemo() {
      this.items = DEMO_DOCUMENTS.map((d) => ({ ...d }))
    }
  }
})
