<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import { STEP_TIPS, QUICK_QUESTIONS, findAnswer } from '../data/assistant.js'

const props = defineProps({
  step: { type: Number, required: true }, // 0 — главная, 1–4 — шаги формы
  open: Boolean,
  drawer: Boolean // выдвижная панель справа на любой ширине (для главной)
})
const emit = defineEmits(['close'])

const messages = ref([])
const question = ref('')
const typing = ref(false)
const listRef = ref(null)
const inputRef = ref(null)
let timer = null

async function scrollDown() {
  await nextTick()
  if (listRef.value) listRef.value.scrollTop = listRef.value.scrollHeight
}

function ask(text) {
  const q = (text ?? question.value).trim()
  if (!q || typing.value) return
  messages.value.push({ from: 'user', text: q })
  question.value = ''
  typing.value = true
  scrollDown()
  // Небольшая пауза, чтобы ответ не появлялся мгновенно
  timer = setTimeout(() => {
    messages.value.push({ from: 'bot', text: findAnswer(q) })
    typing.value = false
    scrollDown()
  }, 600)
}

function onKey(e) {
  if (e.key === 'Escape') emit('close')
}

// Escape закрывает открытую панель, даже если фокус ушёл с неё (например, на заблокированную кнопку)
watch(
  () => props.open,
  async (v) => {
    if (v) {
      window.addEventListener('keydown', onKey)
      await nextTick()
      inputRef.value?.focus()
    } else {
      window.removeEventListener('keydown', onKey)
    }
  }
)

onBeforeUnmount(() => {
  clearTimeout(timer)
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <div :class="['helper-wrap', { 'is-open': open, 'helper-wrap--drawer': drawer }]">
    <div class="helper-backdrop" @click="emit('close')" />
    <aside class="helper" aria-label="Помощник по вычетам">
      <header class="helper__head">
        <span class="helper__avatar" aria-hidden="true">✦</span>
        <span>
          <span class="helper__name">ИИ-помощник</span>
          <span class="helper__badge">демо: отвечает по базе правил</span>
        </span>
        <button class="helper__close" type="button" aria-label="Закрыть помощника" @click="emit('close')">×</button>
      </header>

      <div ref="listRef" class="helper__list" aria-live="polite">
        <div class="msg msg--bot msg--tip">
          <span class="msg__label">{{ step ? `Подсказка к шагу ${step}` : 'Подсказка' }}</span>
          {{ STEP_TIPS[step] }}
        </div>
        <div v-for="(m, i) in messages" :key="i" :class="['msg', `msg--${m.from}`]">{{ m.text }}</div>
        <div v-if="typing" class="msg msg--bot msg--typing" aria-label="Помощник печатает"><span /><span /><span /></div>
      </div>

      <div class="helper__chips">
        <button v-for="q in QUICK_QUESTIONS[step]" :key="q" class="chip" type="button" :disabled="typing" @click="ask(q)">
          {{ q }}
        </button>
      </div>

      <form class="helper__form" @submit.prevent="ask()">
        <label class="visually-hidden" for="helper-input">Вопрос помощнику</label>
        <input
          id="helper-input"
          ref="inputRef"
          v-model="question"
          class="input"
          type="text"
          placeholder="Спросите про вычет"
          autocomplete="off"
        />
        <button class="btn btn--primary helper__send" type="submit" :disabled="!question.trim() || typing" aria-label="Отправить">
          <span class="icon-arrow" aria-hidden="true" />
        </button>
      </form>
    </aside>
  </div>
</template>

<style lang="less">
// На десктопе обёртка тянется на всю высоту колонки, чтобы панель прилипала при прокрутке
.helper-wrap {
  align-self: stretch;
}

.helper-backdrop {
  display: none;
}

.helper {
  position: sticky;
  top: 24px;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 48px);
  min-height: 520px;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  overflow: hidden;

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 18px;
    background: var(--color-card-dark);
    color: var(--color-text-on-dark);
  }
  &__avatar {
    display: grid;
    place-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: var(--color-card-light);
    color: var(--color-ink);
  }
  &__name {
    display: block;
    font-weight: 600;
  }
  &__badge {
    display: block;
    font-size: 12px;
    color: var(--color-text-on-dark-muted);
  }
  &__close {
    display: none;
    margin-left: auto;
    width: 36px;
    height: 36px;
    border: 0;
    border-radius: 50%;
    background: var(--color-bg-lilac);
    color: var(--color-ink);
    font-size: 22px;
    cursor: pointer;
  }
  &__list {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 16px;
    overflow-y: auto;
  }
  &__chips {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    padding: 0 16px 12px;
  }
  &__form {
    display: flex;
    gap: 8px;
    padding: 12px 16px 16px;
    border-top: 1px solid var(--color-border);
  }
  &__send {
    flex: none;
    width: 44px;
    padding: 0;
    border-radius: 50%;
  }
}

.msg {
  max-width: 92%;
  padding: 10px 14px;
  border-radius: var(--radius-m);
  font-size: 14px;
  line-height: 1.37;

  &--bot {
    align-self: flex-start;
    background: var(--color-bg-lilac);
    border-bottom-left-radius: 4px;
  }
  &--user {
    align-self: flex-end;
    background: var(--color-ink);
    color: var(--color-bg);
    border-bottom-right-radius: 4px;
  }
  &--tip {
    background: var(--color-card-light);
  }
  &__label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-2);
    margin-bottom: 4px;
  }
  &--typing {
    display: flex;
    gap: 4px;
    padding: 14px;
    span {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--color-heading-secondary);
      animation: blink 1s infinite;
      &:nth-child(2) {
        animation-delay: 0.15s;
      }
      &:nth-child(3) {
        animation-delay: 0.3s;
      }
    }
  }
}

@keyframes blink {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 1;
  }
}

.chip {
  padding: 6px 12px;
  border: 1px solid var(--color-card-light);
  border-radius: var(--radius-field);
  background: var(--color-bg-lilac);
  font-size: 12px;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
  &:hover:not(:disabled) {
    border-color: var(--color-accent);
  }
  &:disabled {
    opacity: 0.5;
  }
}

// Выдвижная панель справа: открывается кнопкой «Спросить помощника» на главной
.helper-wrap--drawer {
  position: fixed;
  inset: 0;
  z-index: 30;
  pointer-events: none;
  visibility: hidden;

  &.is-open {
    pointer-events: auto;
    visibility: visible;
  }
  .helper-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    background: var(--color-scrim);
    opacity: 0;
    transition: opacity 0.2s;
  }
  &.is-open .helper-backdrop {
    opacity: 1;
  }
  .helper {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: auto;
    width: min(420px, 100%);
    max-height: none;
    min-height: 0;
    border-radius: var(--radius-l) 0 0 var(--radius-l);
    transform: translateX(100%);
    transition: transform 0.25s ease;
  }
  &.is-open .helper {
    transform: translateX(0);
  }
  .helper__close {
    display: block;
  }
}

@media (max-width: 960px) {
  .helper-wrap:not(.helper-wrap--drawer) {
    position: fixed;
    inset: 0;
    z-index: 30;
    pointer-events: none;
    visibility: hidden;

    &.is-open {
      pointer-events: auto;
      visibility: visible;
      .helper-backdrop {
        opacity: 1;
      }
      .helper {
        transform: translateY(0);
      }
    }
  }
  .helper-backdrop {
    display: block;
    position: absolute;
    inset: 0;
    background: var(--color-scrim);
    opacity: 0;
    transition: opacity 0.2s;
  }
  .helper {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    top: auto;
    max-height: 85vh;
    min-height: 60vh;
    border-radius: var(--radius-l) var(--radius-l) 0 0;
    transform: translateY(100%);
    transition: transform 0.25s ease;

    &__close {
      display: block;
    }
  }
}
</style>
