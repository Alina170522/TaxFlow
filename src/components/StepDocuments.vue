<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useFormStore, amountError } from '../store/form.js'
import { MAX_FILE_MB } from '../data/rules.js'
import { validateFile } from '../utils/files.js'
import { fileSize, rub } from '../utils.js'
import iconUpload from '../assets/icons/upload.svg'
import iconFile from '../assets/icons/file.svg'
import iconFileError from '../assets/icons/file-error.svg'
import iconRemove from '../assets/icons/remove.svg'

const props = defineProps({ showErrors: Boolean })
const form = useFormStore()

// Имитация загрузки списка документов с сервера, чтобы показать skeleton
const loading = ref(true)
const timers = []
onMounted(() => timers.push(setTimeout(() => (loading.value = false), 700)))
onBeforeUnmount(() => timers.forEach(clearTimeout))

const touched = ref({})

function onFile(docId, event) {
  const file = event.target.files?.[0]
  event.target.value = ''
  if (!file) return
  const error = validateFile(file)
  if (error) {
    form.documents[docId] = { name: file.name, size: file.size, status: 'error', error }
    return
  }
  // Новый документ: сумму нужно указать заново, как в модалке «Добавить документ»
  form.documents[docId] = { name: file.name, size: file.size, status: 'uploading', amount: '' }
  touched.value[docId] = false
  // В прототипе файл никуда не отправляется: имитируем загрузку
  timers.push(
    setTimeout(() => {
      if (form.documents[docId]?.status === 'uploading') form.documents[docId].status = 'ready'
    }, 900)
  )
}

function remove(docId) {
  delete form.documents[docId]
}

function statusOf(d) {
  return form.documents[d.id]?.status || 'empty'
}

function iconFor(status) {
  if (status === 'error') return iconFileError
  if (status === 'ready' || status === 'uploading') return iconFile
  return iconUpload
}

function metaFor(doc) {
  if (doc.status === 'uploading') return `${doc.name} · ${fileSize(doc.size)} · загружается…`
  if (doc.earlier) return `${doc.name} · загружен ранее, ${doc.uploadedAt}`
  if (doc.status === 'ready') return `${doc.name} · ${fileSize(doc.size)} · загружен`
  return doc.name
}

function amountErrorFor(d) {
  const doc = form.documents[d.id]
  if (!d.amountKind || !(touched.value[d.id] || props.showErrors)) return null
  return amountError(doc)
}

const hasEarlier = computed(() => Object.values(form.documents).some((doc) => doc.earlier))
const groups = computed(() => form.calc.groups.filter((g) => g.sum > 0))
const groupLabel = (kind) => ({ purchase: ' на покупку', mortgage: ' по ипотеке' })[kind] || ''
</script>

<template>
  <div class="step">
    <div>
      <h2 id="step-title" class="step__title">Документы для вычета</h2>
      <p v-if="hasEarlier" class="step__lead">
        Справку и договор мы нашли среди ранее загруженных. Проверьте сумму по справке и добавьте недостающее.
        Новые файлы: PDF, JPG, PNG или HEIC, до {{ MAX_FILE_MB }} МБ.
      </p>
      <p v-else class="step__lead">
        За {{ form.year }} год ранее загруженных документов нет. Загрузите справку и договор, сумму расходов возьмём из справки.
        PDF, JPG, PNG или HEIC, до {{ MAX_FILE_MB }} МБ.
      </p>
      <p class="docs-note">Ранее загруженные документы в прототипе — демо-данные. Новые файлы остаются в браузере и никуда не отправляются.</p>
    </div>

    <ul v-if="loading" class="docs" aria-busy="true" aria-label="Загружаем список документов">
      <li v-for="n in 3" :key="n" class="doc doc--skeleton">
        <span class="skeleton" style="width: 36px; height: 36px; border-radius: 8px" />
        <span class="doc__text">
          <span class="skeleton" style="width: 70%; height: 16px" />
          <span class="skeleton" style="width: 45%; height: 12px; margin-top: 8px" />
        </span>
        <span class="skeleton" style="width: 110px; height: 44px; border-radius: 15px" />
      </li>
    </ul>

    <ul v-else class="docs">
      <li
        v-for="d in form.docsList"
        :key="d.id"
        :class="['doc', `doc--${statusOf(d)}`, { 'doc--missing': showErrors && !d.optional && statusOf(d) !== 'ready' }]"
      >
        <img class="doc__icon" :src="iconFor(form.documents[d.id]?.status)" width="36" height="36" alt="" />

        <span class="doc__text">
          <span class="doc__title">
            {{ d.title }}<span v-if="d.optional" class="doc__optional"> · по желанию</span>
          </span>
          <span v-if="!form.documents[d.id]" class="doc__where">{{ d.where }}</span>
          <span v-else class="doc__file">{{ metaFor(form.documents[d.id]) }}</span>
          <span v-if="form.documents[d.id]?.status === 'error'" class="field__error" role="alert">
            {{ form.documents[d.id].error }}
          </span>
        </span>

        <span class="doc__actions">
          <label v-if="statusOf(d) !== 'uploading'" class="btn btn--secondary doc__upload">
            {{ statusOf(d) === 'ready' ? 'Заменить' : statusOf(d) === 'error' ? 'Выбрать другой' : 'Загрузить' }}
            <input class="visually-hidden" type="file" accept=".pdf,image/*" @change="onFile(d.id, $event)" />
          </label>
          <span v-else class="doc__progress" aria-hidden="true"><span /></span>
          <button
            v-if="statusOf(d) === 'ready' || statusOf(d) === 'error'"
            class="doc__remove"
            type="button"
            :aria-label="`Убрать документ ${form.documents[d.id].name}`"
            @click="remove(d.id)"
          >
            <img :src="iconRemove" width="28" height="28" alt="" />
          </button>
        </span>

        <label v-if="d.amountKind && (statusOf(d) === 'ready' || statusOf(d) === 'uploading')" class="field doc__amount">
          <span class="field__label">{{ d.amountLabel }}</span>
          <input
            v-model.trim="form.documents[d.id].amount"
            :class="['input', { 'input--error': amountErrorFor(d) }]"
            type="text"
            inputmode="decimal"
            placeholder="0"
            :aria-invalid="Boolean(amountErrorFor(d))"
            @blur="touched[d.id] = true"
          />
          <span v-if="amountErrorFor(d)" class="field__error" role="alert">{{ amountErrorFor(d) }}</span>
        </label>
      </li>
    </ul>

    <div v-if="!loading && groups.length" class="total">
      <div>
        <span class="total__label">Расходы по документам</span>
        <span class="total__value">{{ rub(form.totalExpenses) }}</span>
      </div>
      <div v-for="g in groups" :key="g.kind" class="total__limit">
        <span>Лимит{{ groupLabel(g.kind) }}: {{ rub(g.limit) }}</span>
        <span v-if="g.sum > g.limit" class="total__over">учтём {{ rub(g.limit) }}</span>
      </div>
    </div>

    <div v-if="!loading && form.missingDocs.length === 0 && form.amountErrors.length === 0" class="notice notice--success">
      Все нужные документы на месте.
    </div>
  </div>
</template>

<style lang="less">
.docs-note {
  margin-top: 8px;
  font-size: 12px;
  color: var(--color-heading-secondary);
}

.docs {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.doc {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1.5px dashed var(--color-accent);
  border-radius: var(--radius-s);
  background: var(--color-bg-lilac);

  // Строки файлов из модалки «Добавить документ»: File / Loaded и File / Error
  &--ready,
  &--uploading,
  &--skeleton {
    border: 1.5px solid transparent;
  }
  &--error,
  &--missing {
    border: 1px solid var(--color-error);
  }
  &--error {
    background: var(--color-error-bg);
  }

  &__icon {
    flex: none;
    display: block;
    width: 36px;
    height: 36px;
  }
  &--empty &__icon {
    width: 44px;
    height: 44px;
    margin: -4px;
  }
  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__title {
    font-size: 14px;
    line-height: 1.25;
  }
  &__optional {
    color: var(--color-heading-secondary);
  }
  &__where,
  &__file {
    font-size: 12px;
    line-height: 1.25;
    color: var(--color-heading-secondary);
    overflow-wrap: anywhere;
  }
  .field__error {
    font-size: 12px;
  }
  &__actions {
    flex: none;
    display: flex;
    align-items: center;
    gap: 4px;
  }
  &__upload {
    cursor: pointer;
    background: var(--color-surface);
    &:focus-within {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }
  }
  &__remove {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    padding: 0;
    border: 0;
    border-radius: var(--radius-xs);
    background: none;
    cursor: pointer;
    &:hover {
      background: var(--color-card-light);
    }
    img {
      display: block;
    }
  }
  &__progress {
    display: block;
    width: 110px;
    height: 6px;
    border-radius: 3px;
    background: var(--color-card-light);
    overflow: hidden;
    span {
      display: block;
      height: 100%;
      width: 40%;
      background: var(--color-accent);
      border-radius: 3px;
      animation: progress 0.9s ease-in-out infinite;
    }
  }
  // Поле суммы под документом, выровнено по тексту
  &__amount {
    flex: 0 0 100%;
    padding: 2px 0 4px 48px;
    .input {
      max-width: 320px;
      background: var(--color-surface);
    }
    .input:not(:placeholder-shown):not(.input--error) {
      background: var(--color-card-light);
    }
    .input.input--error {
      background: var(--color-error-bg);
    }
  }
}

@keyframes progress {
  from {
    transform: translateX(-100%);
  }
  to {
    transform: translateX(260%);
  }
}

// Итог расходов: по мотивам карточки «Общая сумма расходов за год»
.total {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  padding: 18px 20px;
  border-radius: var(--radius-l);
  background: var(--color-card-light);

  &__label {
    display: block;
    font-size: 14px;
    color: var(--color-text-2);
  }
  &__value {
    font-size: 28px;
    line-height: 1.25;
  }
  &__limit {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    font-size: 14px;
    color: var(--color-text-2);
  }
  &__over {
    color: var(--color-ink);
  }
}

@media (max-width: 600px) {
  .doc {
    &__text {
      flex-basis: calc(100% - 50px);
    }
    &__actions {
      width: 100%;
      .btn {
        flex: 1;
      }
    }
    &__amount {
      padding-left: 0;
      .input {
        max-width: none;
      }
    }
  }
  .total__limit {
    align-items: flex-start;
  }
}
</style>
