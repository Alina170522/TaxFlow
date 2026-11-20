<template>
  <footer class="footer container">
    <div class="footer__row">
      <span>© 2026 FlowTax</span>
      <span>Поддержка support@flowtax.ru</span>
      <span class="footer__links">
        <RouterLink to="/privacy">Политика конфиденциальности</RouterLink>
        <RouterLink to="/terms">Соглашение</RouterLink>
      </span>
    </div>
    <p class="footer__note">Учебный прототип. Расчёт примерный и не заменяет консультацию налогового специалиста.</p>
  </footer>
</template>

<style lang="less">
// Подвал из макета; цвет текста темнее, чем в макете (20% чёрного), чтобы его можно было прочитать
.footer {
  padding-top: 8px;
  padding-bottom: 32px;
  font-size: 14px;
  color: var(--color-text-muted);

  &__row {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 12px 40px;
    padding: 16px 0;
  }
  &__links {
    display: flex;
    gap: 50px;
    a {
      color: inherit;
      text-decoration: none;
      &:hover {
        color: var(--color-ink);
      }
    }
  }
  &__note {
    font-size: 12px;
  }
}

@media (max-width: 600px) {
  .footer {
    padding-bottom: 88px;
    &__row {
      flex-direction: column;
      gap: 8px;
    }
    &__links {
      flex-direction: column;
      gap: 8px;
    }
  }
}
</style>
