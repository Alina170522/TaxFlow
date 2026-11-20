<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import LoopVideo from '../components/LoopVideo.vue'
import coinVideo from '../assets/img/coin-loader.mp4'
import coinPoster from '../assets/img/coin-loader-poster.webp'

// Экран «Раздел в разработке» по макету страницы «Ошибка 505»
const route = useRoute()
const router = useRouter()

const title = computed(() => (route.meta.section ? `Раздел «${route.meta.section}» в разработке` : 'Такой страницы нет'))
const text = computed(() =>
  route.meta.section ? 'Мы уже знаем, что здесь будет, и скоро это сделаем.' : 'Возможно, ссылка устарела. Вернитесь назад или откройте главную.'
)

function back() {
  if (window.history.state?.back) router.back()
  else router.push('/')
}
</script>

<template>
  <section class="stub" aria-labelledby="stub-title">
    <div class="stub__text">
      <h1 id="stub-title">{{ title }}</h1>
      <p>{{ text }}</p>
    </div>
    <button class="stub__back" type="button" @click="back">Назад</button>
    <div class="stub__media">
      <LoopVideo :src="coinVideo" :poster="coinPoster" />
    </div>
  </section>
</template>

<style lang="less">
// Макет 505: лиловый фон, заголовок 64, текст 40, кнопка 294×50 card-dark, иллюстрация со скруглением 15
.stub {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  min-height: 720px;
  padding: 72px 24px 64px;
  border-radius: var(--radius-m);
  background: var(--color-bg-lilac);
  text-align: center;

  &__text {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 900px;
  }
  h1 {
    font-size: clamp(32px, 4.5vw, 64px);
    line-height: 1.25;
  }
  p {
    font-size: clamp(20px, 2.8vw, 40px);
    line-height: 1.1;
  }
  &__back {
    width: 294px;
    max-width: 100%;
    height: 50px;
    margin-top: 8px;
    border: 0;
    border-radius: var(--radius-m);
    background: var(--color-card-dark);
    color: var(--color-bg-lilac);
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.15s;
    &:hover {
      background: var(--color-button-push);
    }
  }
  &__media {
    width: min(380px, 100%);
    aspect-ratio: 1;
    border-radius: var(--radius-m);
    overflow: hidden;
  }
}

@media (max-width: 600px) {
  .stub {
    min-height: 0;
    padding: 40px 16px 32px;
    &__back {
      font-size: 20px;
    }
  }
}
</style>
