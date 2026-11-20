<script setup>
import { ref, reactive, computed, watch, nextTick, onBeforeUnmount } from 'vue'
import { useLibraryStore } from '../store/library.js'
import { CATEGORIES, DOC_KINDS, categoryTitle, yearOf } from '../data/demo.js'
import { MAX_FILE_MB } from '../data/rules.js'
import { validateFile } from '../utils/files.js'
import { canRecognize, recognizeDocument, RECOGNIZABLE } from '../utils/recognize.js'
import { fileSize, rub, plural } from '../utils.js'
import iconUpload from '../assets/icons/upload.svg'
import iconFile from '../assets/icons/file.svg'
import iconFileError from '../assets/icons/file-error.svg'
import iconRemove from '../assets/icons/remove.svg'
import iconCamera from '../assets/icons/camera.svg'
import iconEdit from '../assets/icons/edit.svg'

// Окно «Добавить документ» по макету: десктопное окно и мобильный сценарий
// «способ → распознаём → проверьте данные → добавлено», ветка «не удалось распознать»
const props = defineProps({
  open: Boolean,
  mode: { type: String, default: 'file' } // file | photo | manual
})
const emit = defineEmits(['close'])

const library = useLibraryStore()
const step = ref('start') // start | form | recognizing | failed | done
const file = ref(null) // { name, size, type, blob, error }
const recognized = ref(false)
const recognizable = ref(false)
const fields = reactive({ kind: 'cert', category: '', date: '', org: '', amount: '' })
const touched = ref(false)
const added = ref(null)
const notice = ref('')
const titleRef = ref(null)
const dragging = ref(false)
let controller = null
let lastFocus = null

// Камера есть только на телефоне: на компьютере пункт «Сфотографировать» не показываем
const touch = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(pointer: coarse)').matches : false

canRecognize().then((v) => (recognizable.value = v))

function reset() {
  step.value = props.mode === 'manual' ? 'form' : 'start'
  file.value = null
  recognized.value = false
  touched.value = false
  added.value = null
  notice.value = ''
  Object.assign(fields, { kind: 'cert', category: '', date: '', org: '', amount: '' })
}

watch(
  () => props.open,
  async (v) => {
    if (v) {
      lastFocus = document.activeElement
      reset()
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', onKey)
      await nextTick()
      titleRef.value?.focus()
    } else {
      cleanup()
      lastFocus?.focus?.()
    }
  },
  { immediate: true }
)

function cleanup() {
  controller?.abort()
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
}
onBeforeUnmount(cleanup)

function onKey(e) {
  if (e.key !== 'Escape') return
  if (step.value === 'recognizing') cancelRecognition()
  else emit('close')
}

function pick(event) {
  const f = event.target.files?.[0]
  event.target.value = ''
  if (f) take(f)
}

function onDrop(event) {
  dragging.value = false
  const f = event.dataTransfer?.files?.[0]
  if (f) take(f)
}

function take(f) {
  const error = validateFile(f)
  file.value = { name: f.name, size: f.size, type: f.type, blob: f, error }
  recognized.value = false
  if (!error) step.value = 'form'
}

const canRecognizeFile = computed(() => recognizable.value && file.value && !file.value.error && RECOGNIZABLE.includes(file.value.type))

async function recognize() {
  notice.value = ''
  step.value = 'recognizing'
  controller = new AbortController()
  try {
    const result = await recognizeDocument(file.value.blob, { signal: controller.signal })
    if (!result) {
      step.value = 'failed'
      return
    }
    Object.assign(fields, {
      kind: result.kind,
      category: result.category || fields.category,
      date: result.date || fields.date,
      org: result.org || fields.org,
      amount: result.kind === 'contract' ? '' : result.amount || fields.amount
    })
    recognized.value = true
    touched.value = true
    step.value = 'form'
  } catch (e) {
    if (controller?.signal.aborted) {
      step.value = 'form'
    } else if (e?.code === 'not_granted' || e?.code === 'unavailable') {
      // Доступ к Claude не дали: убираем кнопку и оставляем ручной ввод
      recognizable.value = false
      notice.value = 'Распознавание недоступно. Заполните поля вручную.'
      step.value = 'form'
    } else if (e?.code === 'rate_limited') {
      notice.value = 'Слишком много запросов подряд. Попробуйте через минуту или заполните поля вручную.'
      step.value = 'form'
    } else {
      step.value = 'failed'
    }
  } finally {
    controller = null
  }
}

function cancelRecognition() {
  controller?.abort()
  step.value = 'form'
}

function manual() {
  step.value = 'form'
}

const today = new Date().toISOString().slice(0, 10)

const needsAmount = computed(() => fields.kind !== 'contract')

const errors = computed(() => {
  const e = {}
  if (!fields.category) e.category = 'Выберите категорию'
  if (!fields.date) e.date = 'Укажите дату документа'
  else if (!yearOf(fields.date) || yearOf(fields.date) > new Date().getFullYear()) e.date = 'Проверьте дату'
  if (!fields.org.trim()) e.org = 'Укажите организацию'
  if (needsAmount.value) {
    const raw = String(fields.amount).trim().replace(',', '.').replace(/\s/g, '')
    if (!raw) e.amount = 'Укажите сумму из документа'
    else if (Number.isNaN(Number(raw))) e.amount = 'Введите сумму числом'
    else if (Number(raw) <= 0) e.amount = 'Сумма должна быть больше нуля'
    else if (Number(raw) > 100_000_000) e.amount = 'Проверьте сумму'
  }
  return e
})

function save() {
  touched.value = true
  if (Object.keys(errors.value).length) return
  const amount = needsAmount.value ? Number(String(fields.amount).replace(',', '.').replace(/\s/g, '')) : null
  added.value = library.add({
    category: fields.category,
    kind: fields.kind,
    org: fields.org.trim(),
    date: fields.date,
    amount,
    file: file.value?.name || '',
    size: file.value?.size || 0
  })
  step.value = 'done'
  nextTick(() => titleRef.value?.focus())
}

const summary = computed(() => {
  if (!added.value) return null
  const year = yearOf(added.value.date)
  const total = library.totals(year).find((c) => c.type === added.value.category)
  return { year, ...total, orgsText: `${total.orgs} ${plural(total.orgs, ['организация', 'организации', 'организаций'])}` }
})

function again() {
  reset()
  step.value = 'start'
  nextTick(() => titleRef.value?.focus())
}

const title = computed(
  () =>
    ({
      start: 'Добавить документ',
      form: recognized.value ? 'Проверьте данные' : 'Добавить документ',
      recognizing: 'Распознаём документ…',
      failed: 'Не удалось распознать документ',
      done: 'Документ добавлен'
    })[step.value]
)
</script>

<template>
  <div v-if="open" class="add-doc" @click.self="step !== 'recognizing' && emit('close')">
    <section class="add-doc__dialog" role="dialog" aria-modal="true" aria-labelledby="add-doc-title">
      <button class="add-doc__close" type="button" aria-label="Закрыть" @click="emit('close')">
        <span aria-hidden="true">×</span>
      </button>

      <header class="add-doc__head">
        <h2 id="add-doc-title" ref="titleRef" tabindex="-1">{{ title }}</h2>
        <p v-if="step === 'start'">Прикрепите чек, договор или справку и проверьте данные</p>
        <p v-else-if="step === 'form' && recognized">Мы распознали документ. Исправьте поля, если что-то не так</p>
      </header>

      <!-- Способ добавления -->
      <div v-if="step === 'start'" class="add-doc__start">
        <label v-if="touch" class="method method--accent">
          <img :src="iconCamera" width="20" height="18" alt="" />
          <span>
            <span class="method__title">Сфотографировать документ</span>
            <span class="method__note">{{ recognizable ? 'Быстрее всего: данные распознаются сами' : 'Фото прикрепится к документу' }}</span>
          </span>
          <span class="icon-arrow method__arrow" aria-hidden="true" />
          <input class="visually-hidden" type="file" accept="image/*" capture="environment" @change="pick" />
        </label>

        <label
          :class="['dropzone', { 'is-drag': dragging }]"
          @dragover.prevent="dragging = true"
          @dragleave="dragging = false"
          @drop.prevent="onDrop"
        >
          <img :src="iconUpload" width="44" height="44" alt="" />
          <span class="dropzone__title">{{ touch ? 'Выбрать файл' : 'Перетащите файл сюда или выберите на устройстве' }}</span>
          <span class="dropzone__note">PDF, JPG, PNG или HEIC, до {{ MAX_FILE_MB }} МБ</span>
          <input class="visually-hidden" type="file" accept=".pdf,image/*" @change="pick" />
        </label>

        <div v-if="file?.error" class="file-row file-row--error" role="alert">
          <img :src="iconFileError" width="36" height="36" alt="" />
          <span class="file-row__text">
            <span class="file-row__name">{{ file.name }}</span>
            <span class="file-row__meta">{{ file.error }}</span>
          </span>
          <button class="file-row__remove" type="button" aria-label="Убрать файл" @click="file = null">
            <img :src="iconRemove" width="28" height="28" alt="" />
          </button>
        </div>

        <button class="method" type="button" @click="manual">
          <img :src="iconEdit" width="18" height="18" alt="" />
          <span>
            <span class="method__title">Ввести вручную</span>
            <span class="method__note">Заполнить данные без файла</span>
          </span>
          <span class="icon-arrow method__arrow" aria-hidden="true" />
        </button>
      </div>

      <!-- Распознавание -->
      <div v-else-if="step === 'recognizing'" class="add-doc__status" role="status">
        <p>Это займёт несколько секунд. Мы найдём вид документа, организацию, дату и сумму.</p>
        <span class="add-doc__progress" aria-hidden="true"><span /></span>
        <button class="btn btn--ghost" type="button" @click="cancelRecognition">Отменить</button>
      </div>

      <!-- Не удалось распознать -->
      <div v-else-if="step === 'failed'" class="add-doc__status">
        <p>Фото получилось размытым или на нём нет документа об оплате. Попробуйте ещё раз при хорошем освещении или введите данные вручную.</p>
        <div class="add-doc__actions add-doc__actions--column">
          <label class="btn btn--primary">
            Выбрать другой файл
            <input class="visually-hidden" type="file" accept=".pdf,image/*" @change="pick" />
          </label>
          <button class="btn btn--secondary" type="button" @click="manual">Ввести вручную</button>
        </div>
      </div>

      <!-- Проверка данных -->
      <form v-else-if="step === 'form'" class="add-doc__form" novalidate @submit.prevent="save">
        <div v-if="file && !file.error" class="file-row">
          <img :src="iconFile" width="36" height="36" alt="" />
          <span class="file-row__text">
            <span class="file-row__name">{{ file.name }}</span>
            <span class="file-row__meta">{{ fileSize(file.size) }} · {{ recognized ? 'распознан автоматически' : 'загружен' }}</span>
          </span>
          <button class="file-row__remove" type="button" aria-label="Убрать файл" @click="file = null; recognized = false">
            <img :src="iconRemove" width="28" height="28" alt="" />
          </button>
        </div>

        <label v-if="!file || file.error" :class="['attach', { 'attach--error': file?.error }]">
          <img :src="iconUpload" width="28" height="28" alt="" />
          <span>
            <span class="attach__title">Прикрепить файл</span>
            <span class="attach__note">{{ file?.error || `Необязательно. PDF, JPG, PNG или HEIC, до ${MAX_FILE_MB} МБ` }}</span>
          </span>
          <input class="visually-hidden" type="file" accept=".pdf,image/*" @change="pick" />
        </label>

        <p v-if="notice" class="notice notice--warn" role="status">{{ notice }}</p>

        <div v-if="canRecognizeFile && !recognized" class="ai-fill">
          <span>
            <span class="ai-fill__title">Заполнить по фото</span>
            <span class="ai-fill__note">Claude прочитает документ и заполнит поля, вы их проверите</span>
          </span>
          <button class="btn btn--primary" type="button" @click="recognize">Распознать</button>
        </div>

        <fieldset class="field">
          <legend class="field__label">Вид документа</legend>
          <div class="segments">
            <label v-for="k in DOC_KINDS" :key="k.id" :class="['segment', { 'is-selected': fields.kind === k.id }]">
              <input v-model="fields.kind" class="visually-hidden" type="radio" name="doc-kind" :value="k.id" />
              {{ k.title }}
            </label>
          </div>
        </fieldset>

        <div class="add-doc__row">
          <label class="field">
            <span class="field__label">Категория</span>
            <select v-model="fields.category" :class="['input', 'select', { 'input--error': touched && errors.category, 'input--filled': fields.category }]">
              <option value="" disabled>Выберите</option>
              <option v-for="c in CATEGORIES" :key="c.type" :value="c.type">{{ c.title }}</option>
            </select>
            <span v-if="touched && errors.category" class="field__error">{{ errors.category }}</span>
          </label>
          <label class="field">
            <span class="field__label">Дата документа</span>
            <input v-model="fields.date" :class="['input', { 'input--error': touched && errors.date, 'input--filled': fields.date }]" type="date" :max="today" />
            <span v-if="touched && errors.date" class="field__error">{{ errors.date }}</span>
          </label>
        </div>

        <label class="field">
          <span class="field__label">Организация</span>
          <input v-model="fields.org" :class="['input', { 'input--error': touched && errors.org }]" type="text" placeholder="Клиника «Здоровье»" />
          <span v-if="touched && errors.org" class="field__error">{{ errors.org }}</span>
        </label>

        <label v-if="needsAmount" class="field">
          <span class="field__label">Сумма, ₽</span>
          <input v-model.trim="fields.amount" :class="['input', { 'input--error': touched && errors.amount }]" type="text" inputmode="decimal" placeholder="0" />
          <span v-if="touched && errors.amount" class="field__error">{{ errors.amount }}</span>
        </label>

        <div class="add-doc__actions">
          <button class="btn btn--ghost" type="button" @click="emit('close')">Отмена</button>
          <button class="btn btn--primary" type="submit">
            Сохранить документ <span class="icon-arrow" aria-hidden="true" />
          </button>
        </div>
      </form>

      <!-- Готово -->
      <div v-else-if="step === 'done' && summary" class="add-doc__done">
        <p>
          {{ added.amount ? `Сумма учтена в категории «${categoryTitle(added.category)}» за ${summary.year} год` : `Договор сохранён в документах за ${summary.year} год` }}
          и подставится в заявление на вычет за этот год.
        </p>
        <div :class="['mini-card', `mini-card--${summary.tone}`]">
          <span class="mini-card__title">{{ summary.title }}, {{ summary.year }}</span>
          <span class="mini-card__sum">{{ rub(summary.amount) }}</span>
          <span class="mini-card__orgs">{{ summary.orgsText }}</span>
        </div>
        <div class="add-doc__actions add-doc__actions--column">
          <button class="btn btn--primary" type="button" @click="emit('close')">
            К документам <span class="icon-arrow" aria-hidden="true" />
          </button>
          <button class="btn btn--ghost" type="button" @click="again">Добавить ещё</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style lang="less">
// Окно по макету «Modal / Add document»: 535 px, скругление 16, тень, крестик в тёмном круге
.add-doc {
  position: fixed;
  inset: 0;
  z-index: 60;
  // flex + margin: auto центрирует окно и не обрезает его верх, когда оно выше экрана
  display: flex;
  padding: 24px;
  background: var(--color-scrim);
  overflow-y: auto;

  &__dialog {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 14px;
    flex: none;
    margin: auto;
    width: min(535px, 100%);
    padding: 28px 26px 22px;
    border-radius: 16px;
    background: var(--color-bg);
    box-shadow: var(--shadow);
  }
  &__close {
    position: absolute;
    top: -14px;
    right: -14px;
    display: grid;
    place-items: center;
    width: 34px;
    height: 34px;
    border: 0;
    border-radius: 50%;
    background: var(--color-card-dark);
    color: var(--color-bg);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  &__head {
    display: flex;
    flex-direction: column;
    gap: 4px;
    h2 {
      font-size: 20px;
      &:focus {
        outline: none;
      }
    }
    p {
      font-size: 14px;
      color: #8a8ca3;
    }
  }
  &__start,
  &__form {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }
  &__actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding-top: 8px;
    &--column {
      flex-direction: column;
      align-items: stretch;
    }
  }
  &__status {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    padding: 16px 0 4px;
    text-align: center;
    p {
      font-size: 14px;
      color: var(--color-heading-secondary);
    }
  }
  &__progress {
    display: block;
    width: 100%;
    height: 6px;
    border-radius: 3px;
    background: var(--color-bg-lilac);
    overflow: hidden;
    span {
      display: block;
      width: 40%;
      height: 100%;
      background: var(--color-accent);
      animation: progress 1.1s ease-in-out infinite;
    }
  }
  &__done {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    text-align: center;
    p {
      font-size: 14px;
      color: var(--color-heading-secondary);
    }
  }
}

// Способ добавления: строки из мобильного макета «Добавить расход»
.method {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  background: var(--color-surface);
  text-align: left;
  cursor: pointer;
  &:hover {
    border-color: var(--color-accent);
  }
  &:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  &--accent {
    background: var(--color-bg-lilac);
    border-color: var(--color-accent);
  }
  img {
    flex: none;
  }
  &__title {
    display: block;
    font-size: 14px;
  }
  &__note {
    display: block;
    font-size: 12px;
    color: var(--color-heading-secondary);
  }
  &__arrow {
    margin-left: auto;
  }
}

// Зона загрузки: пунктир accent на лиловом фоне
.dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 22px 16px;
  border: 1.5px dashed var(--color-accent);
  border-radius: 14px;
  background: var(--color-bg-lilac);
  text-align: center;
  cursor: pointer;
  &.is-drag {
    background: var(--color-card-light);
  }
  &:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  &__title {
    font-size: 14px;
  }
  &__note {
    font-size: 12px;
    color: var(--color-heading-secondary);
  }
}

// Строка файла: File / Loaded и File / Error
.file-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--color-bg-lilac);
  &--error {
    background: var(--color-error-bg);
    border: 1px solid var(--color-error);
    .file-row__meta {
      color: var(--color-error);
    }
  }
  img {
    display: block;
    flex: none;
  }
  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  &__name {
    font-size: 14px;
    overflow-wrap: anywhere;
  }
  &__meta {
    font-size: 12px;
    color: var(--color-heading-secondary);
  }
  &__remove {
    display: grid;
    place-items: center;
    flex: none;
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
  }
}

// Прикрепить файл к документу, начатому вручную
.attach {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1.5px dashed var(--color-card-light);
  border-radius: 12px;
  cursor: pointer;
  &:hover {
    border-color: var(--color-accent);
  }
  &:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  img {
    flex: none;
  }
  &__title {
    display: block;
    font-size: 14px;
  }
  &__note {
    display: block;
    font-size: 12px;
    color: var(--color-heading-secondary);
  }
  &--error {
    border-color: var(--color-error);
    .attach__note {
      color: var(--color-error);
    }
  }
}

// Блок «Заполнить по фото» — только на странице Claude
.ai-fill {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: var(--color-card-dark);
  color: var(--color-text-on-dark);
  &__title {
    display: block;
    font-size: 14px;
  }
  &__note {
    display: block;
    font-size: 12px;
    color: var(--color-text-on-dark-muted);
  }
  .btn--primary {
    flex: none;
    background: var(--color-bg-lilac);
    color: var(--color-ink);
    &:hover:not(:disabled) {
      background: var(--color-card-light);
    }
  }
}

// У select нет placeholder, поэтому пустой выбор выглядел бы заполненным: возвращаем вид Default
.input.select:not(.input--filled):not(.input--error):not(:hover):not(:focus) {
  background-color: var(--color-bg-lilac);
  border-color: var(--color-card-light);
}

.add-doc fieldset {
  margin: 0;
  padding: 0;
  border: 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--color-ink) 50%), linear-gradient(135deg, var(--color-ink) 50%, transparent 50%);
  background-position: calc(100% - 22px) 50%, calc(100% - 16px) 50%;
  background-size: 6px 6px;
  background-repeat: no-repeat;
  padding-right: 40px;
}

// Карточка категории после добавления, как на экране «Расход добавлен»
.mini-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  width: 100%;
  padding: 18px 20px;
  border-radius: var(--radius-l);
  text-align: left;
  &--light {
    background: var(--color-card-light);
    color: var(--color-ink);
  }
  &--dark {
    background: var(--color-card-dark);
    color: var(--color-text-on-dark);
  }
  &__title {
    font-size: 18px;
  }
  &__sum {
    font-size: 28px;
  }
  &__orgs {
    font-size: 14px;
    color: var(--color-text-muted);
    .mini-card--dark & {
      color: var(--color-text-on-dark-muted);
    }
  }
}

// Телефон: окно на весь экран, как мобильные экраны макета
@media (max-width: 600px) {
  .add-doc {
    padding: 0;
    &__dialog {
      margin: 0;
      // без flex-start окно растянулось бы ровно на высоту экрана и кнопки ушли бы за край
      align-self: flex-start;
      width: 100%;
      min-height: 100%;
      border-radius: 0;
      padding: 56px 16px 24px;
    }
    &__close {
      top: 12px;
      right: 12px;
    }
    &__row {
      grid-template-columns: 1fr;
    }
  }
}
</style>
