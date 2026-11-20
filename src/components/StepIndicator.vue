<script setup>
import { STEPS as titles } from '../store/form.js'

defineProps({ step: { type: Number, required: true } })
const emit = defineEmits(['jump'])
</script>

<template>
  <nav class="steps" aria-label="Шаги заявления">
    <p class="steps__mobile">
      Шаг {{ step }} из {{ titles.length }} · <strong>{{ titles[step - 1] }}</strong>
    </p>
    <div class="steps__bar" aria-hidden="true">
      <span :style="{ width: `${(step / titles.length) * 100}%` }" />
    </div>
    <ol class="steps__list">
      <li v-for="(title, i) in titles" :key="title" :class="{ 'is-current': i + 1 === step, 'is-done': i + 1 < step }">
        <button
          type="button"
          :disabled="i + 1 > step"
          :aria-current="i + 1 === step ? 'step' : undefined"
          @click="emit('jump', i + 1)"
        >
          <span class="steps__num">{{ i + 1 < step ? '✓' : i + 1 }}</span>
          <span class="steps__title">{{ title }}</span>
        </button>
      </li>
    </ol>
  </nav>
</template>

<style lang="less">
.steps {
  &__mobile {
    display: none;
    font-size: 14px;
    color: var(--color-text-muted);
    strong {
      color: var(--color-ink);
    }
  }
  &__bar {
    display: none;
    height: 6px;
    margin-top: 10px;
    border-radius: 99px;
    background: var(--color-bg-lilac);
    span {
      display: block;
      height: 100%;
      border-radius: 99px;
      background: var(--color-accent);
      transition: width 0.3s;
    }
  }
  &__list {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      border-top: 3px solid var(--color-border);
      &.is-done,
      &.is-current {
        border-color: var(--color-accent);
      }
    }

    button {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      padding: 12px 0 0;
      border: 0;
      background: none;
      text-align: left;
      cursor: pointer;
      color: var(--color-heading-secondary);
      &:disabled {
        cursor: default;
      }
    }

    .is-current button,
    .is-done button {
      color: var(--color-ink);
    }
  }
  &__num {
    flex: none;
    display: grid;
    place-items: center;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    background: var(--color-bg-lilac);
    font-size: 12px;
    font-weight: 600;

    .is-current & {
      background: var(--color-ink);
      color: var(--color-bg);
    }
    .is-done & {
      background: var(--color-card-light);
    }
  }
  &__title {
    font-size: 14px;
    font-weight: 600;
  }
}

@media (max-width: 760px) {
  .steps__mobile,
  .steps__bar {
    display: block;
  }
  .steps__list {
    display: none;
  }
}
</style>
