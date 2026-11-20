<script setup>
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { DEMO_USER } from '../data/demo.js'
import logoMark from '../assets/icons/logo-mark.svg'
import iconSearch from '../assets/icons/search.svg'
import iconSearchSmall from '../assets/icons/search-40.svg'
import iconBell from '../assets/icons/bell.svg'
import iconUser from '../assets/icons/user.svg'
import iconBurger from '../assets/icons/burger.svg'

// Шапка из макета: логотип, меню разделов, поиск, уведомления, профиль
const menu = [
  { to: '/', label: 'Главная' },
  { to: '/expenses', label: 'Расходы' },
  { to: '/certificates', label: 'Справки' },
  { to: '/documents', label: 'Документы' }
]

const route = useRoute()
const open = ref(false)
watch(() => route.fullPath, () => (open.value = false))
</script>

<template>
  <header class="header">
    <div class="container header__inner">
      <RouterLink class="logo" to="/" aria-label="FlowTax, на главную">
        <img class="logo__mark" :src="logoMark" width="40" height="43" alt="" />
        <span>FlowTax</span>
      </RouterLink>

      <nav class="menu" aria-label="Разделы">
        <RouterLink v-for="item in menu" :key="item.to" class="menu__link" :to="item.to" exact-active-class="is-active">
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="header__user">
        <RouterLink class="header__icon header__search" to="/search" aria-label="Поиск">
          <img :src="iconSearch" width="54" height="50" alt="" />
        </RouterLink>
        <RouterLink class="header__icon header__bell" to="/notifications" aria-label="Уведомления">
          <img :src="iconBell" width="26" height="30" alt="" />
        </RouterLink>
        <RouterLink class="header__profile" to="/profile" aria-label="Профиль">
          <img :src="iconUser" width="54" height="54" alt="" />
          <span>{{ DEMO_USER.name }}</span>
        </RouterLink>
      </div>

      <!-- Мобильная шапка из макета: поиск и кнопка меню -->
      <div class="header__mobile">
        <RouterLink class="header__icon" to="/search" aria-label="Поиск">
          <img :src="iconSearchSmall" width="40" height="40" alt="" />
        </RouterLink>
        <button class="header__icon header__burger" type="button" :aria-expanded="open" aria-controls="mobile-menu" aria-label="Меню" @click="open = !open">
          <img :src="iconBurger" width="40" height="40" alt="" />
        </button>
      </div>
    </div>

    <nav v-if="open" id="mobile-menu" class="mobile-menu container" aria-label="Разделы">
      <RouterLink v-for="item in menu" :key="item.to" class="mobile-menu__link" :to="item.to" exact-active-class="is-active">
        {{ item.label }}
      </RouterLink>
      <RouterLink class="mobile-menu__link" to="/notifications">Уведомления</RouterLink>
      <RouterLink class="mobile-menu__link" to="/profile">Профиль · {{ DEMO_USER.name }}</RouterLink>
    </nav>
  </header>
</template>

<style lang="less">
.header {
  position: relative;
  z-index: 10;
  background: var(--color-bg);

  &__inner {
    display: flex;
    align-items: center;
    gap: 27px;
    min-height: 91px;
    padding-top: 20px;
  }
  &__user {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 15px;
  }
  &__icon {
    display: grid;
    place-items: center;
    flex: none;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: none;
    cursor: pointer;
    img {
      display: block;
    }
  }
  &__search,
  &__bell {
    border-radius: 25px;
    transition: opacity 0.15s;
    &:hover {
      opacity: 0.8;
    }
  }
  &__bell {
    width: 40px;
    height: 44px;
  }
  &__profile {
    display: flex;
    align-items: center;
    gap: 5px;
    color: var(--color-ink);
    text-decoration: none;
    span {
      width: 72px;
      font-size: 14px;
      line-height: 1.43;
      text-align: center;
    }
    img {
      display: block;
    }
  }
  &__mobile {
    display: none;
    margin-left: auto;
    gap: 16px;
  }
}

// Логотип из макета: знак 40×43 и надпись 24px, цвет «Текст основной»
.logo {
  display: inline-flex;
  flex: none;
  align-items: center;
  gap: 5px;
  font-weight: 600;
  font-size: 24px;
  line-height: 1.25;
  color: #171b3a;
  text-decoration: none;

  &__mark {
    display: block;
    flex: none;
  }
}

// Меню: Default — вторичный текст, Hover и активный пункт — основной
.menu {
  display: flex;
  justify-content: center;
  gap: 20px;
  width: 800px;
  flex: none;

  &__link {
    display: grid;
    place-items: center;
    min-width: 120px;
    height: 44px;
    padding: 0 12px;
    border-radius: var(--radius-m);
    font-size: 20px;
    color: var(--color-heading-secondary);
    text-decoration: none;
    transition: color 0.15s, background 0.15s;
    &:hover {
      color: var(--color-ink);
    }
    &.is-active {
      color: var(--color-ink);
    }
  }
}

.mobile-menu {
  display: flex;
  flex-direction: column;
  padding-top: 8px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg);

  &__link {
    padding: 12px 0;
    font-size: 18px;
    color: var(--color-heading-secondary);
    text-decoration: none;
    & + & {
      border-top: 1px solid var(--color-border);
    }
    &.is-active {
      color: var(--color-ink);
    }
  }
}

@media (max-width: 1320px) {
  .menu {
    width: auto;
    flex: 1;
    gap: 4px;
    &__link {
      min-width: 0;
      font-size: 18px;
    }
  }
  .header__user {
    flex: none;
  }
}

@media (max-width: 1023px) {
  .menu,
  .header__user {
    display: none;
  }
  .header__mobile {
    display: flex;
  }
  .header__inner {
    min-height: 72px;
    padding-top: 16px;
  }
}

@media (min-width: 1024px) {
  .mobile-menu {
    display: none;
  }
}
</style>
