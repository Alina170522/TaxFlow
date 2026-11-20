<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import LoopVideo from './LoopVideo.vue'
import coinVideo from '../assets/img/coin-loader.mp4'
import coinPoster from '../assets/img/coin-loader-poster.webp'

// Экран загрузки из макета («Состояния и ошибки» → «Загрузки»).
// Отсчёт идёт с момента, когда монета реально начала вращаться: пользователь видит полный оборот.
const TURN_MS = 3000 // один оборот монеты в ролике
const STILL_MS = 1500 // статичный кадр при «Уменьшить движение»
const FALLBACK_MS = 1500 // если видео не стартовало, ждём не дольше

const emit = defineEmits(['done'])
const titleRef = ref(null)
const duration = ref(0)
let timer = null
let started = false

function start(ms) {
  if (started) return
  started = true
  clearTimeout(timer)
  duration.value = ms
  timer = setTimeout(() => emit('done'), ms)
}

function onPlaying({ still }) {
  start(still ? STILL_MS : TURN_MS)
}

onMounted(() => {
  titleRef.value?.focus()
  // Видео не стартовало (заблокировано браузером): показываем статичный кадр, всего не дольше 3 с
  timer = setTimeout(() => start(STILL_MS), FALLBACK_MS)
})
onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <section class="loader" aria-labelledby="loader-title">
    <div class="loader__coin">
      <LoopVideo :src="coinVideo" :poster="coinPoster" @playing="onPlaying" />
    </div>
    <h1 id="loader-title" ref="titleRef" class="loader__title" tabindex="-1" role="status">Считаю ваши расходы…</h1>
    <div class="loader__progress" aria-hidden="true">
      <span v-if="duration" :style="{ animationDuration: `${duration}ms` }" />
    </div>
  </section>
</template>

<style lang="less">
// Десктоп и планшет: фон на весь экран, монета и шкала по центру
.loader {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: var(--color-bg-lilac);
  text-align: center;

  &__coin {
    width: min(345px, 100%, 45vh);
    aspect-ratio: 1;
    // Края ролика растворяются в фоне, чтобы не было видно квадрата вокруг монеты
    -webkit-mask-image: radial-gradient(closest-side, #000 82%, transparent 100%);
    mask-image: radial-gradient(closest-side, #000 82%, transparent 100%);
  }
  &__title {
    margin-top: 32px;
    font-size: 28px;
    &:focus {
      outline: none;
    }
  }
  // Полоса прогресса: accent на светлой дорожке
  &__progress {
    width: min(331px, 100%);
    height: 6px;
    margin-top: 40px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.2);
    overflow: hidden;
    span {
      display: block;
      height: 100%;
      width: 100%;
      background: var(--color-accent);
      transform-origin: left;
      animation: loader-fill linear forwards;
    }
  }
}

@keyframes loader-fill {
  from {
    transform: scaleX(0.05);
  }
  to {
    transform: scaleX(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .loader__progress span {
    animation: none;
    transform: scaleX(0.5);
  }
}

// Телефон: карточка под шапкой, как раньше
@media (max-width: 600px) {
  .loader {
    position: static;
    max-width: 480px;
    margin: 0 auto;
    padding: 16px 16px 40px;
    border-radius: var(--radius-m);
    &__coin {
      width: min(345px, 100%);
      margin-top: 24px;
    }
    &__title {
      font-size: 24px;
    }
  }
}
</style>
