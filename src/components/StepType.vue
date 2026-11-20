<script setup>
import { computed } from 'vue'
import { useFormStore } from '../store/form.js'
import { DEDUCTION_TYPES, YEARS } from '../data/rules.js'

defineProps({ showErrors: Boolean })
const form = useFormStore()

const year = computed({
  get: () => form.year,
  set: (v) => form.setYear(v)
})
</script>

<template>
  <div class="step">
    <h2 id="step-title" class="step__title">За что хотите вернуть налог?</h2>

    <div class="types" role="radiogroup" aria-label="Вид вычета">
      <button
        v-for="t in DEDUCTION_TYPES"
        :key="t.id"
        type="button"
        role="radio"
        :aria-checked="form.type === t.id"
        :class="['type', `type--${t.tone}`, { 'is-selected': form.type === t.id }]"
        @click="form.setType(t.id)"
      >
        <span class="type__top">
          <span class="type__name">{{ t.title }}</span>
          <span class="type__check" aria-hidden="true">{{ form.type === t.id ? '✓' : '' }}</span>
        </span>
        <span class="type__hint">{{ t.hint }}</span>
      </button>
    </div>

    <template v-if="form.type">
      <fieldset class="group">
        <legend class="field__label">Год, в котором вы платили</legend>
        <div class="segments">
          <label v-for="y in YEARS" :key="y" :class="['segment', { 'is-selected': year === y }]">
            <input v-model="year" class="visually-hidden" type="radio" name="year" :value="y" />
            {{ y }}
          </label>
        </div>
      </fieldset>

      <fieldset class="group">
        <legend class="field__label">За кого вы платили</legend>
        <div class="options">
          <label v-for="p in form.persons" :key="p.id" :class="['option', { 'is-selected': form.person === p.id }]">
            <input v-model="form.person" type="radio" name="person" :value="p.id" />
            <span>
              <span class="option__title">{{ p.title }}</span>
              <span v-if="p.note" class="option__note">{{ p.note }}</span>
            </span>
          </label>
        </div>
      </fieldset>

      <label v-if="form.type === 'medicine'" class="option option--check">
        <input v-model="form.expensive" type="checkbox" />
        <span>
          <span class="option__title">Дорогостоящее лечение</span>
          <span class="option__note">В справке об оплате стоит код «2». Для него нет лимита расходов.</span>
        </span>
      </label>
    </template>

    <div v-else class="empty">
      <p>Выберите вид вычета, чтобы продолжить.</p>
    </div>
  </div>
</template>

<style lang="less">
.step {
  display: flex;
  flex-direction: column;
  gap: 24px;

  &__title {
    font-size: 28px;
  }
  &__lead {
    color: var(--color-heading-secondary);
    margin-top: 8px;
  }
}

.types {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.type {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 28px;
  min-height: 140px;
  padding: 18px 20px;
  border: 2px solid transparent;
  border-radius: var(--radius-l);
  text-align: left;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;

  // Карточки из макета: светлая card-light и тёмная card-dark
  &--light {
    background: var(--color-card-light);
    color: var(--color-ink);
  }
  &--dark {
    background: var(--color-card-dark);
    color: var(--color-text-on-dark);
    .type__hint {
      color: var(--color-text-on-dark-muted);
    }
  }
  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow);
  }
  &.is-selected {
    border-color: var(--color-accent);
    box-shadow: 0 0 0 3px var(--color-bg-lilac);
  }

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  &__name {
    font-size: 18px;
    font-weight: 600;
  }
  &__check {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--color-ink);
    color: var(--color-bg);
    font-size: 14px;
    .type--dark & {
      background: var(--color-bg-lilac);
      color: var(--color-ink);
    }
  }
  &__hint {
    font-size: 14px;
    color: var(--color-text-2);
  }
}

.group {
  margin: 0;
  padding: 0;
  border: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.segments {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 8px;
}

.segment {
  min-width: 84px;
  padding: 10px 16px;
  border: 1px solid var(--color-card-light);
  border-radius: var(--radius-field);
  background: var(--color-bg-lilac);
  text-align: center;
  font-size: 14px;
  cursor: pointer;
  transition: border-color 0.15s;
  &:hover {
    border-color: var(--color-accent);
  }
  &.is-selected {
    background: var(--color-ink);
    border-color: var(--color-ink);
    color: var(--color-bg);
  }
  &:focus-within {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
}

.options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.option {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-s);
  cursor: pointer;

  input {
    margin-top: 4px;
    accent-color: var(--color-accent);
  }
  &.is-selected {
    border-color: var(--color-accent);
    background: var(--color-bg-lilac);
  }
  &__title {
    display: block;
    font-weight: 600;
  }
  &__note {
    display: block;
    font-size: 12px;
    color: var(--color-heading-secondary);
  }
  &--check {
    background: var(--color-bg-lilac);
    border-color: transparent;
  }
}

.empty {
  padding: 20px;
  color: var(--color-text-muted);
  text-align: center;
}

@media (max-width: 600px) {
  .step__title {
    font-size: 22px;
  }
  .types {
    gap: 8px;
  }
  .type {
    min-height: 120px;
    padding: 14px;
    gap: 16px;
    &__name {
      font-size: 16px;
    }
    &__hint {
      font-size: 12px;
    }
  }
  .options {
    grid-template-columns: 1fr;
  }
}
</style>
