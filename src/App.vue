<script setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <AppHeader />
  <main id="main" class="container page">
    <RouterView />
  </main>
  <AppFooter />
</template>

<style lang="less">
// Сетка из макета: кадр 1458, поля 40, контент 1378
.container {
  max-width: 1458px;
  margin: 0 auto;
  padding-left: 40px;
  padding-right: 40px;
}

.page {
  padding-top: 20px;
  padding-bottom: 64px;
  min-height: 60vh;
}

@media (max-width: 600px) {
  .container {
    padding-left: 16px;
    padding-right: 16px;
  }
  .page {
    padding-top: 12px;
    padding-bottom: 40px;
  }
}
</style>
