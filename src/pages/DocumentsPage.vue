<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useLibraryStore } from '../store/library.js'
import { CATEGORIES, categoryTitle, kindTitle } from '../data/demo.js'
import { rub, formatDate, plural } from '../utils.js'
import AddDocument from '../components/AddDocument.vue'
import iconFile from '../assets/icons/file.svg'

// Раздел «Документы»: всё, что пользователь уже загрузил, и добавление нового документа к имеющимся
const route = useRoute()
const router = useRouter()
const library = useLibraryStore()

const filter = ref('all')
const addOpen = ref(false)
const addMode = ref('file')

// Кнопки hero на главной ведут сюда с ?add=file|photo|manual и сразу открывают окно
watch(
  () => route.query.add,
  (mode) => {
    if (!mode) return
    addMode.value = ['file', 'photo', 'manual'].includes(mode) ? mode : 'file'
    addOpen.value = true
  },
  { immediate: true }
)

function openAdd() {
  addMode.value = 'file'
  addOpen.value = true
}

function closeAdd() {
  addOpen.value = false
  if (route.query.add) router.replace({ query: {} })
}

const chips = computed(() => [
  { type: 'all', title: 'Все', count: library.items.length },
  ...CATEGORIES.map((c) => ({ ...c, count: library.items.filter((d) => d.category === c.type).length }))
])

// Сначала новые: по дате документа, добавленные пользователем выше демо-набора при равной дате
const list = computed(() =>
  library.items
    .filter((d) => filter.value === 'all' || d.category === filter.value)
    .slice()
    .sort((a, b) => Number(a.demo) - Number(b.demo) || String(b.date).localeCompare(String(a.date)))
)

const countText = computed(() => `${list.value.length} ${plural(list.value.length, ['документ', 'документа', 'документов'])}`)
</script>

<template>
  <section class="page-head docs-head">
    <div>
      <h1>Документы</h1>
      <p>Чеки, договоры и справки об оплате. Суммы из них попадают в расходы и в заявление на вычет.</p>
    </div>
    <button class="btn btn--primary" type="button" @click="openAdd">
      <span class="icon-plus" aria-hidden="true" />
      Добавить документ
    </button>
  </section>

  <div class="docs-chips" role="group" aria-label="Категория">
    <button
      v-for="c in chips"
      :key="c.type"
      :class="['docs-chip', { 'is-selected': filter === c.type }]"
      type="button"
      :aria-pressed="filter === c.type"
      @click="filter = c.type"
    >
      {{ c.title }} <span class="docs-chip__count">{{ c.count }}</span>
    </button>
  </div>

  <p class="docs-count" aria-live="polite">{{ countText }}</p>

  <ul v-if="list.length" class="docs-list">
    <li v-for="d in list" :key="d.id" :class="['doc-card', { 'is-new': !d.demo }]">
      <img class="doc-card__icon" :src="iconFile" width="36" height="36" alt="" />
      <div class="doc-card__main">
        <p class="doc-card__title">
          {{ kindTitle(d.kind) }} · {{ d.org }}
          <span v-if="!d.demo" class="doc-card__badge">Новый</span>
        </p>
        <p class="doc-card__meta">
          {{ categoryTitle(d.category) }} · {{ formatDate(d.date) }}<template v-if="d.file"> · {{ d.file }}</template>
        </p>
      </div>
      <p class="doc-card__sum">{{ d.amount ? rub(d.amount) : 'без суммы' }}</p>
    </li>
  </ul>
  <div v-else class="docs-empty">
    <p>В этой категории пока нет документов.</p>
    <button class="btn btn--secondary" type="button" @click="openAdd">Добавить документ</button>
  </div>

  <p class="docs-note">
    Документы хранятся только в этом браузере. Новый документ сразу учитывается в суммах на главной и в заявлении на вычет за тот же год.
  </p>

  <AddDocument :open="addOpen" :mode="addMode" @close="closeAdd" />
</template>

<style lang="less">
.docs-head .btn {
  flex: none;
}

.docs-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.docs-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
  padding: 0 16px;
  border: 1px solid var(--color-card-light);
  border-radius: var(--radius-field);
  background: var(--color-bg-lilac);
  font-size: 14px;
  cursor: pointer;
  &:hover {
    border-color: var(--color-accent);
  }
  &.is-selected {
    background: var(--color-ink);
    border-color: var(--color-ink);
    color: var(--color-bg);
  }
  &__count {
    font-size: 12px;
    opacity: 0.7;
  }
}

.docs-count {
  margin: 20px 0 10px;
  font-size: 14px;
  color: var(--color-heading-secondary);
}

.docs-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.doc-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  background: var(--color-surface);
  &.is-new {
    border-color: var(--color-accent);
    background: var(--color-bg-lilac);
  }
  &__icon {
    flex: none;
  }
  &__main {
    flex: 1;
    min-width: 0;
  }
  &__title {
    font-size: 16px;
    overflow-wrap: anywhere;
  }
  &__badge {
    display: inline-block;
    margin-left: 6px;
    padding: 2px 8px;
    border-radius: 10px;
    background: var(--color-card-dark);
    color: var(--color-text-on-dark);
    font-size: 12px;
    vertical-align: 2px;
  }
  &__meta {
    margin-top: 4px;
    font-size: 13px;
    color: var(--color-heading-secondary);
    overflow-wrap: anywhere;
  }
  &__sum {
    flex: none;
    font-size: 18px;
    font-weight: 600;
    white-space: nowrap;
  }
}

.docs-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  padding: 24px;
  border-radius: var(--radius-l);
  background: var(--color-bg-lilac);
}

.docs-note {
  margin: 20px 0 8px;
  font-size: 13px;
  color: var(--color-heading-secondary);
}

@media (max-width: 600px) {
  .page-head.docs-head .btn {
    margin-left: 0;
    width: 100%;
  }
  .doc-card {
    flex-wrap: wrap;
    padding: 12px 14px;
    &__sum {
      width: 100%;
      padding-left: 50px;
      font-size: 16px;
    }
  }
}
</style>
