<script setup>
import { computed, ref, nextTick } from 'vue'
import { useFormStore, STEPS } from '../store/form.js'
import StepIndicator from '../components/StepIndicator.vue'
import StepType from '../components/StepType.vue'
import StepDocuments from '../components/StepDocuments.vue'
import StepIncome from '../components/StepIncome.vue'
import StepReview from '../components/StepReview.vue'
import DoneScreen from '../components/DoneScreen.vue'
import AiHelper from '../components/AiHelper.vue'
import LoaderScreen from '../components/LoaderScreen.vue'

const form = useFormStore()

// Шкала шагов — только заполнение данных для вычета. Расходы ведутся отдельно и приходят вместе с документами
const steps = [StepType, StepDocuments, StepIncome, StepReview]
const lastStep = STEPS.length
const current = computed(() => steps[form.step - 1])
const error = computed(() => form.stepErrors[form.step])
const showError = ref(false)
const helperOpen = ref(false)
const titleRef = ref(null)
// Экран «Считаю ваши расходы…» между проверкой и готовым заявлением
const calculating = ref(false)

function onCalculated() {
  calculating.value = false
  form.finish()
}

async function next() {
  if (error.value) {
    showError.value = true
    return
  }
  showError.value = false
  if (form.step === lastStep) {
    calculating.value = true
    window.scrollTo({ top: 0 })
    return
  }
  form.goTo(form.step + 1)
  await nextTick()
  titleRef.value?.focus()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function back() {
  showError.value = false
  form.goTo(form.step - 1)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function jump(step) {
  showError.value = false
  form.goTo(step)
}

function startOver() {
  showError.value = false
  form.reset()
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <LoaderScreen v-if="calculating" @done="onCalculated" />

  <DoneScreen v-else-if="form.done" />

  <template v-else>
    <section class="page-head">
      <div>
        <h1 ref="titleRef" tabindex="-1">Заявление на налоговый вычет</h1>
        <p>FlowTax подскажет, какие документы нужны, и посчитает, сколько вернётся.</p>
      </div>
      <button class="btn btn--ghost" type="button" @click="startOver">Начать заново</button>
    </section>

    <div class="layout">
      <section class="flow" aria-labelledby="step-title">
        <StepIndicator :step="form.step" @jump="jump" />

        <div class="flow__body">
          <component :is="current" :show-errors="showError" />
        </div>

        <div v-if="showError && error" class="notice notice--error flow__error" role="alert">
          {{ error }}
        </div>

        <div class="flow__nav">
          <button v-if="form.step > 1" class="btn btn--secondary" type="button" @click="back">Назад</button>
          <span v-else />
          <button class="btn btn--primary" type="button" @click="next">
            {{ form.step === lastStep ? 'Сформировать заявление' : 'Далее' }}
          </button>
        </div>
      </section>

      <AiHelper :step="form.step" :open="helperOpen" @close="helperOpen = false" />
    </div>

    <button class="helper-fab" type="button" aria-label="Открыть помощника" @click="helperOpen = true">
      <span aria-hidden="true">✦</span> Помощник
    </button>
  </template>
</template>

<style lang="less">
.page-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin: 12px 0 24px;

  h1 {
    font-size: 40px;
    &:focus {
      outline: none;
    }
  }
  p {
    margin-top: 8px;
    font-size: 18px;
    color: var(--color-heading-secondary);
  }
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 24px;
  align-items: start;
}

.flow {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);
  padding: 28px;

  &__body {
    margin-top: 28px;
  }
  &__error {
    margin-top: 20px;
  }
  &__nav {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    margin-top: 28px;
    padding-top: 20px;
    border-top: 1px solid var(--color-border);
  }
}

.helper-fab {
  display: none;
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
  .helper-fab {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    position: fixed;
    right: 16px;
    bottom: 16px;
    z-index: 20;
    min-height: 48px;
    padding: 0 18px;
    border: 0;
    border-radius: 999px;
    background: var(--color-ink);
    color: var(--color-bg);
    font-weight: 600;
    box-shadow: var(--shadow);
    cursor: pointer;
  }
}

@media (max-width: 600px) {
  .page-head {
    flex-direction: column;
    align-items: flex-start;
    margin-top: 4px;
    h1 {
      font-size: 28px;
    }
    p {
      font-size: 15px;
    }
    .btn {
      margin-left: -12px;
    }
  }
  .flow {
    padding: 20px 16px;
    border-radius: var(--radius-m);
    &__nav .btn {
      flex: 1;
    }
  }
}
</style>
