<script setup>
import { computed, ref } from 'vue'
import { useFormStore } from '../store/form.js'
import { useLibraryStore } from '../store/library.js'
import { rub, plural } from '../utils.js'
import { DEMO_YEAR, DEMO_CERTIFICATES } from '../data/demo.js'
import LoopVideo from '../components/LoopVideo.vue'
import AiHelper from '../components/AiHelper.vue'
import heroVideo from '../assets/img/hero-coins.mp4'
import heroPoster from '../assets/img/hero-coins-poster.webp'
import fnsVideo from '../assets/img/fns-building.mp4'
import fnsPoster from '../assets/img/fns-building-poster.webp'
import iconCertificates from '../assets/icons/certificates.svg'
import iconCamera from '../assets/icons/camera-button.svg'
import iconUp from '../assets/icons/up.svg'

const form = useFormStore()
const library = useLibraryStore()
const helperOpen = ref(false)

// Суммы считаются из раздела «Документы»: новый документ сразу меняет карточку и итог
const categories = computed(() =>
  library.totals(DEMO_YEAR).map((c) => ({ ...c, orgs: `${c.orgs} ${plural(c.orgs, ['организация', 'организации', 'организаций'])}` }))
)
const yearTotal = computed(() => library.yearTotal(DEMO_YEAR))

// Сколько расходов этого года уже попало в заявление на вычет
const inApplication = computed(() => (form.type && form.year === DEMO_YEAR ? form.totalExpenses : 0))

const certificatesShare = `${Math.round((DEMO_CERTIFICATES.ready / DEMO_CERTIFICATES.total) * 100)}%`

function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
</script>

<template>
  <div class="home">
    <!-- Hero: анимация монет, заголовок, кнопки -->
    <section class="hero" aria-labelledby="hero-title">
      <LoopVideo class="hero__media" :src="heroVideo" :poster="heroPoster" />
      <div class="hero__content">
        <div class="hero__text">
          <h1 id="hero-title">Меняем расходы на доходы</h1>
          <p>FlowTax собирает документы, считает расходы и помогает оформить налоговый вычет.</p>
        </div>
        <div class="hero__actions">
          <RouterLink class="hero__add" :to="{ path: '/documents', query: { add: 'file' } }">
            <span class="icon-plus hero__plus" aria-hidden="true" />
            Добавить документ
            <span class="icon-arrow hero__arrow" aria-hidden="true" />
          </RouterLink>
          <RouterLink class="hero__camera" :to="{ path: '/documents', query: { add: 'photo' } }" aria-label="Сфотографировать документ">
            <img :src="iconCamera" width="44" height="44" alt="" />
          </RouterLink>
          <RouterLink class="text-link hero__manual" :to="{ path: '/documents', query: { add: 'manual' } }">
            <span>Добавить<span class="hero__long"> данные</span> вручную</span>
            <span class="icon-arrow text-link__arrow" aria-hidden="true" />
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Карточки категорий расходов -->
    <section class="categories" aria-label="Расходы по категориям">
      <RouterLink
        v-for="c in categories"
        :key="c.type"
        :class="['category', `category--${c.tone}`]"
        to="/expenses"
        :aria-label="`${c.title}: ${rub(c.amount)}, ${c.orgs}. Открыть расходы`"
      >
        <span class="category__top">
          <span class="category__title">{{ c.title }}</span>
          <span class="category__more" aria-hidden="true"><span class="icon-arrow27" /></span>
        </span>
        <span class="category__sum">{{ rub(c.amount) }}</span>
        <span class="category__orgs">{{ c.orgs }}</span>
      </RouterLink>
    </section>

    <!-- Общая сумма расходов за год -->
    <section class="year-total" aria-labelledby="year-total-title">
      <h2 id="year-total-title">Общая сумма расходов за {{ DEMO_YEAR }} год</h2>
      <p class="year-total__sum">{{ rub(yearTotal) }}</p>
      <p class="year-total__note">
        {{ inApplication ? `Уже учтено в заявке ${rub(inApplication)}` : 'Пока не учтено ни в одной заявке' }}
      </p>
      <RouterLink class="text-link year-total__more" to="/expenses">
        Подробнее <span class="icon-arrow text-link__arrow" aria-hidden="true" />
      </RouterLink>
    </section>

    <!-- Нижний блок: справки, помощник, документы, баннер ФНС -->
    <div class="lower">
      <section class="certs" aria-labelledby="certs-title">
        <h2 id="certs-title" class="certs__title">
          <img class="certs__icon" :src="iconCertificates" width="38" height="40" alt="" />
          Справки
        </h2>
        <div class="certs__progress">
          <span>{{ DEMO_CERTIFICATES.ready }} из {{ DEMO_CERTIFICATES.total }} готовы</span>
          <span
            class="certs__bar"
            role="progressbar"
            :aria-valuenow="DEMO_CERTIFICATES.ready"
            aria-valuemin="0"
            :aria-valuemax="DEMO_CERTIFICATES.total"
            aria-label="Готовые справки"
          >
            <span :style="{ width: certificatesShare }" />
          </span>
        </div>
        <RouterLink class="text-link text-link--light" to="/certificates">
          Перейти к справкам <span class="icon-arrow text-link__arrow" aria-hidden="true" />
        </RouterLink>
      </section>

      <section class="assistant" aria-labelledby="assistant-title">
        <h2 id="assistant-title">Наш AI-помощник подскажет, какие документы нужны и что делать дальше</h2>
        <button class="ask" type="button" @click="helperOpen = true">
          Спросить помощника
          <span class="ask__circle" aria-hidden="true"><span class="icon-arrow27" /></span>
        </button>
      </section>

      <section class="all-docs" aria-labelledby="all-docs-title">
        <h2 id="all-docs-title">Все необходимое —<br />в одном месте</h2>
        <p>Чеки, договоры и справки в одном месте. Вы всегда можете их посмотреть и скачать</p>
        <RouterLink class="text-link" to="/documents">
          Документы <span class="icon-arrow text-link__arrow" aria-hidden="true" />
        </RouterLink>
      </section>

      <section class="fns" aria-labelledby="fns-title">
        <LoopVideo class="fns__media" :src="fnsVideo" :poster="fnsPoster" />
        <div class="fns__content">
          <h2 id="fns-title">Готовы к налоговому вычету?</h2>
          <p>Подготовим декларацию и отправим документы в ФНС.</p>
          <RouterLink class="text-link fns__link" to="/deduction">
            Подготовить декларацию <span class="icon-arrow text-link__arrow" aria-hidden="true" />
          </RouterLink>
        </div>
      </section>
    </div>

    <div class="home__up">
      <button class="up" type="button" aria-label="Наверх" @click="toTop">
        <img :src="iconUp" width="24" height="54" alt="" />
      </button>
    </div>

    <AiHelper drawer :step="0" :open="helperOpen" @close="helperOpen = false" />
  </div>
</template>

<style lang="less">
// Ссылка со стрелкой из макета («Подготовить декларацию →», «Подробнее →»)
.text-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-left: -10px;
  padding: 10px;
  border-radius: var(--radius-m);
  color: var(--color-ink);
  font-size: 18px;
  line-height: 1.25;
  text-decoration: none;
  transition: background 0.15s;
  &:hover {
    background: rgba(255, 255, 255, 0.5);
  }
  &__arrow {
    width: 20px;
    height: 17px;
  }
  &--light {
    color: #e7e4fe;
    font-size: 16px;
    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }
  }
}

// Стрелка 27px в круглой кнопке карточек
.icon-arrow27 {
  display: block;
  width: 27px;
  height: 27px;
  background: currentColor;
  -webkit-mask: url('../assets/icons/arrow-27.svg') center / contain no-repeat;
  mask: url('../assets/icons/arrow-27.svg') center / contain no-repeat;
}

.home {
  display: flex;
  flex-direction: column;
  gap: 100px;
}

// Hero 1378×776: текст слева, поля 140/70
.hero {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  aspect-ratio: 1378 / 776;
  min-height: 520px;
  padding: 0 70px;
  border-radius: var(--radius-l);
  background: var(--color-bg-lilac);

  &__media {
    position: absolute;
    inset: 0;
  }
  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 50px;
    width: min(640px, 100%);
  }
  h1 {
    font-size: clamp(40px, 5vw, 72px);
    line-height: 0.97;
  }
  p {
    margin-top: 16px;
    font-size: 20px;
    line-height: 1.37;
    color: var(--color-text-2);
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 16px 30px;
  }
  &__add {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 14px;
    width: 290px;
    height: 50px;
    border-radius: var(--radius-m);
    background: var(--color-ink);
    color: var(--color-bg-lilac);
    font-size: 18px;
    text-decoration: none;
    transition: background 0.15s;
    &:hover {
      background: var(--color-ink-hover);
    }
    &:active {
      background: var(--color-button-push);
    }
  }
  &__camera {
    display: none;
    img {
      display: block;
    }
  }
  // На десктопе плюс слева, на телефоне стрелка справа — как в макетах
  &__add &__arrow {
    display: none;
  }
}

// Карточки L 660×400: светлые card-light, тёмные card-dark
.categories {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px 18px;
  margin-top: -40px;
}

.category {
  display: flex;
  flex-direction: column;
  min-height: 400px;
  padding: 30px 40px;
  border-radius: var(--radius-l);
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }
  &--light {
    background: var(--color-card-light);
    color: var(--color-ink);
  }
  &--dark {
    background: var(--color-card-dark);
    color: var(--color-text-on-dark);
  }
  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  &__title {
    font-size: 28px;
    line-height: 1.37;
  }
  &__more {
    display: grid;
    place-items: center;
    width: 45px;
    height: 45px;
    border-radius: 50%;
    .category--light & {
      background: var(--color-ink);
      color: var(--color-bg-lilac);
    }
    .category--dark & {
      background: var(--color-bg-lilac);
      color: var(--color-ink);
    }
  }
  &__sum {
    margin-top: 50px;
    font-size: 40px;
    line-height: 1.37;
  }
  &__orgs {
    margin-top: auto;
    font-size: 28px;
    color: var(--color-text-muted);
    .category--dark & {
      color: var(--color-text-on-dark-muted);
    }
  }
}

// Общая сумма: монета в цветах справа снизу
.year-total {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: 413px;
  padding: 50px;
  margin-top: -60px;
  border-radius: var(--radius-l);
  background: var(--color-card-light) url('../assets/img/total-coin.webp') center bottom / cover no-repeat;

  h2 {
    font-size: 36px;
    line-height: 1.37;
  }
  &__sum {
    margin-top: 60px;
    font-size: 40px;
    line-height: 1.37;
  }
  &__note {
    margin-top: 8px;
    font-size: 20px;
    color: var(--color-text-2);
  }
  &__more {
    margin-top: auto;
    font-size: 16px;
  }
}

// Нижний блок: слева справки и документы (420), справа помощник и баннер ФНС (740)
.lower {
  display: grid;
  grid-template-columns: 420px minmax(0, 740px);
  grid-template-rows: auto auto 1fr;
  justify-content: space-between;
  column-gap: 40px;
  margin-top: -60px;

  .certs {
    grid-column: 1;
    grid-row: 1 / 3;
  }
  .assistant {
    grid-column: 2;
    grid-row: 1;
    justify-self: start;
    margin-left: -58px;
  }
  .all-docs {
    grid-column: 1;
    grid-row: 3;
    align-self: start;
    margin-top: 166px;
  }
  .fns {
    grid-column: 2;
    grid-row: 2 / 4;
    margin-top: 40px;
  }
}

.certs {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 50px;
  height: 300px;
  padding: 20px 50px;
  border-radius: var(--radius-l);
  background: var(--color-card-dark);
  color: var(--color-text-on-dark);

  &__title {
    display: flex;
    align-items: flex-end;
    gap: 26px;
    font-size: 28px;
    line-height: 1.15;
  }
  &__icon {
    display: block;
  }
  &__progress {
    display: flex;
    flex-direction: column;
    gap: 10px;
    width: 250px;
    font-size: 18px;
  }
  &__bar {
    display: block;
    height: 8px;
    border-radius: 4px;
    background: rgba(212, 213, 217, 0.75);
    overflow: hidden;
    span {
      display: block;
      height: 100%;
      border-radius: 4px;
      background: var(--color-accent);
    }
  }
  .text-link {
    margin-top: -20px;
  }
}

.assistant {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  max-width: 723px;

  h2 {
    font-size: 36px;
    line-height: 1.37;
  }
}

// Кнопка «Спросить помощника»: тёмная, стрелка в светлом круге
.ask {
  display: inline-flex;
  align-items: center;
  gap: 30px;
  width: 290px;
  padding: 5px 5px 5px 20px;
  border: 0;
  border-radius: var(--radius-l);
  background: var(--color-ink);
  color: var(--color-bg-lilac);
  font-size: 18px;
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: var(--color-ink-hover);
  }
  &:active {
    background: var(--color-button-push);
  }
  &__circle {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    margin-left: auto;
    border-radius: 50%;
    background: var(--color-bg-lilac);
    color: var(--color-ink);
  }
}

.all-docs {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;

  h2 {
    font-size: 40px;
    line-height: 1.37;
  }
  p {
    font-size: 18px;
    color: var(--color-text-muted);
  }
}

// Баннер «Готовы к налоговому вычету?»: пропорции как в макете, здание снизу
.fns {
  position: relative;
  overflow: hidden;
  aspect-ratio: 740 / 986;
  border-radius: var(--radius-l);
  background: #fafafc;

  &__media {
    position: absolute;
    inset: 0;
    object-position: center bottom;
  }
  &__content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 40px;
    padding: 40px 126px 0 40px;
  }
  h2 {
    font-size: 48px;
    line-height: 1.37;
  }
  p {
    font-size: 28px;
    line-height: 1.37;
    color: var(--color-text-muted);
  }
  &__link {
    margin-top: -10px;
  }
}

.home__up {
  display: flex;
  justify-content: flex-end;
  margin-top: -40px;
}

.up {
  display: grid;
  place-items: center;
  width: 100px;
  height: 100px;
  border: 0;
  border-radius: 50%;
  background: var(--color-ink);
  cursor: pointer;
  transition: background 0.15s;
  &:hover {
    background: var(--color-ink-hover);
  }
  img {
    display: block;
    transform: rotate(90deg);
  }
}

// Планшет: одна колонка снизу, карточки компактнее
@media (max-width: 1100px) {
  .home {
    gap: 64px;
  }
  .categories,
  .year-total,
  .lower {
    margin-top: -24px;
  }
  .category {
    min-height: 260px;
    padding: 24px 28px;
    &__title {
      font-size: 22px;
    }
    &__sum {
      margin-top: 28px;
      font-size: 32px;
    }
    &__orgs {
      font-size: 18px;
    }
  }
  .lower {
    display: flex;
    flex-direction: column;
    gap: 32px;
    .assistant,
    .all-docs,
    .fns {
      margin: 0;
    }
    .fns {
      width: min(560px, 100%);
    }
  }
  .certs {
    width: min(560px, 100%);
    height: auto;
    gap: 24px;
    padding: 24px;
    .text-link {
      margin-top: 0;
    }
  }
  .assistant h2 {
    font-size: 28px;
  }
  .all-docs h2 {
    font-size: 30px;
  }
  .year-total h2 {
    font-size: 28px;
  }
}

// Телефон: макет Mobile · 375
@media (max-width: 600px) {
  .home {
    gap: 24px;
  }
  .categories,
  .year-total,
  .lower {
    margin-top: 0;
  }
  .hero {
    align-items: flex-start;
    aspect-ratio: auto;
    min-height: 470px;
    padding: 20px;
    &__content {
      gap: 14px;
    }
    h1 {
      font-size: 34px;
      line-height: 1.25;
    }
    p {
      margin-top: 14px;
      font-size: 15px;
      line-height: 1.25;
    }
    &__actions {
      display: grid;
      grid-template-columns: 210px 44px;
      justify-content: space-between;
      gap: 12px;
      width: 100%;
    }
    &__add {
      width: 210px;
      height: 48px;
      font-size: 16px;
      gap: 10px;
    }
    &__camera {
      display: block;
    }
    &__add &__plus,
    &__long {
      display: none;
    }
    &__add &__arrow {
      display: inline-block;
    }
    // Как в макете: ссылка той же ширины, что кнопка, подпись по центру под кнопкой
    &__manual {
      grid-column: 1;
      justify-content: center;
      width: 210px;
      margin-left: 0;
      font-size: 16px;
    }
  }
  .categories {
    gap: 12px;
  }
  .category {
    min-height: 132px;
    padding: 14px 10px;
    &__title {
      font-size: 14px;
      line-height: 1.25;
    }
    &__more {
      width: 28px;
      height: 28px;
      .icon-arrow27 {
        width: 18px;
        height: 18px;
      }
    }
    &__sum {
      margin-top: auto;
      font-size: 20px;
      line-height: 1.25;
    }
    &__orgs {
      margin-top: 12px;
      font-size: 12px;
    }
  }
  .year-total {
    min-height: 300px;
    padding: 16px;
    background-size: auto 100%;
    background-position: 75% bottom;
    h2 {
      font-size: 18px;
    }
    &__sum {
      margin-top: 14px;
      font-size: 36px;
      line-height: 1.25;
    }
    &__note {
      margin-top: 14px;
      font-size: 14px;
      color: var(--color-heading-secondary);
    }
    &__more {
      margin-top: 8px;
      font-size: 14px;
    }
  }
  .lower {
    gap: 20px;
  }
  .certs {
    gap: 14px;
    padding: 20px;
    &__title {
      font-size: 20px;
      gap: 0;
    }
    &__icon {
      display: none;
    }
    &__progress {
      width: 100%;
      gap: 14px;
      font-size: 16px;
    }
    &__bar {
      height: 6px;
    }
    .text-link {
      font-size: 14px;
    }
  }
  .assistant {
    gap: 16px;
    h2 {
      font-size: 20px;
      line-height: 1.25;
    }
  }
  .ask {
    width: 281px;
  }
  .all-docs {
    gap: 14px;
    h2 {
      font-size: 22px;
      line-height: 1.37;
    }
    h2 br {
      display: none;
    }
    p {
      font-size: 16px;
      color: var(--color-heading-secondary);
    }
    .text-link {
      font-size: 16px;
    }
  }
  .fns {
    aspect-ratio: auto;
    height: 460px;
    &__content {
      gap: 14px;
      padding: 20px;
    }
    h2 {
      font-size: 28px;
      line-height: 1.25;
    }
    p {
      font-size: 16px;
      color: var(--color-heading-secondary);
    }
  }
  .home__up {
    display: none;
  }
}
</style>
