<script setup>
import { computed } from 'vue'
import { useFormStore } from '../store/form.js'
import { rub, plural } from '../utils.js'

defineProps({ showErrors: Boolean })
const form = useFormStore()
const docsCount = computed(() => form.docsList.filter((d) => form.documents[d.id]?.status === 'ready').length)
</script>

<template>
  <div class="step">
    <h2 id="step-title" class="step__title">Проверьте данные</h2>

    <div class="refund">
      <span class="refund__label">Вернётся на счёт</span>
      <span class="refund__value">{{ rub(form.calc.refund) }}</span>
      <span class="refund__note">13% от {{ rub(form.calc.base) }} учтённых расходов</span>
    </div>

    <dl class="summary">
      <div class="summary__row">
        <dt>Вычет</dt>
        <dd>
          {{ form.typeInfo?.title }}{{ form.expensive ? ', дорогостоящее лечение' : '' }}
          <button class="link" type="button" @click="form.goTo(1)">Изменить</button>
        </dd>
      </div>
      <div class="summary__row">
        <dt>Год и за кого</dt>
        <dd>
          {{ form.year }}, {{ form.personInfo?.title.toLowerCase() }}
          <button class="link" type="button" @click="form.goTo(1)">Изменить</button>
        </dd>
      </div>
      <div class="summary__row">
        <dt>Документы</dt>
        <dd>
          {{ docsCount }} {{ plural(docsCount, ['документ', 'документа', 'документов']) }} · расходы {{ rub(form.totalExpenses) }}
          <button class="link" type="button" @click="form.goTo(2)">Изменить</button>
        </dd>
      </div>
      <div class="summary__row">
        <dt>Доход за год</dt>
        <dd>
          {{ rub(form.income) }}
          <button class="link" type="button" @click="form.goTo(3)">Изменить</button>
        </dd>
      </div>
    </dl>

    <p v-if="form.calc.limitHit" class="notice notice--info">Часть расходов выше лимита, поэтому вычет считается с лимита.</p>
    <p v-if="form.calc.carryOver" class="notice notice--info">
      Остаток {{ rub(form.calc.carryOver) }} можно будет вернуть в следующие годы.
    </p>
  </div>
</template>

<style lang="less">
// Блок по мотивам карточки «Общая сумма расходов за год»: монета в цветах справа снизу
.refund {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 220px;
  padding: 32px 36px;
  border-radius: var(--radius-l);
  background: var(--color-card-light) url('../assets/img/total-coin.webp') right bottom / cover no-repeat;
  color: var(--color-ink);

  &__label {
    font-size: 20px;
    line-height: 1.25;
  }
  &__value {
    margin-top: 8px;
    font-size: 40px;
    font-weight: 600;
    line-height: 1.25;
  }
  &__note {
    font-size: 14px;
    color: var(--color-text-2);
  }
}

.summary {
  margin: 0;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-l);

  &__row {
    display: grid;
    grid-template-columns: 180px 1fr;
    gap: 12px;
    padding: 14px 16px;
    & + & {
      border-top: 1px solid var(--color-border);
    }
  }
  dt {
    color: var(--color-heading-secondary);
  }
  dd {
    margin: 0;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 4px 12px;
    font-weight: 600;
  }
}

.link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--color-ink);
  font-size: 14px;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}

@media (max-width: 600px) {
  .refund {
    min-height: 260px;
    padding: 20px;
    background-position: 78% bottom;
    background-size: auto 125%;
    &__note {
      max-width: 58%;
    }
    &__label {
      font-size: 16px;
    }
    &__value {
      font-size: 34px;
    }
  }
  .summary__row {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
