<script setup>
import { computed, ref } from 'vue'
import { useFormStore } from '../store/form.js'
import { rub } from '../utils.js'
import { FNS_CABINET_URL } from '../data/rules.js'

const props = defineProps({ showErrors: Boolean })
const form = useFormStore()
const touched = ref(false)

const invalid = computed(() => (touched.value || props.showErrors) && (!form.income || Number(form.income) <= 0))
</script>

<template>
  <div class="step">
    <div>
      <h2 id="step-title" class="step__title">Сколько вы заработали в {{ form.year }} году?</h2>
      <p class="step__lead">Вернуть можно не больше налога, который удержали с вашего дохода. Поэтому нам нужен доход до вычета налога.</p>
    </div>

    <a class="fns-link" :href="FNS_CABINET_URL" target="_blank" rel="noopener noreferrer">
      <span>
        <span class="fns-link__title">Посмотреть доход в личном кабинете ФНС</span>
        <span class="fns-link__note">Раздел «Доходы», справка о доходах за {{ form.year }} год. Откроется в новой вкладке</span>
      </span>
      <span class="icon-arrow fns-link__arrow" aria-hidden="true" />
    </a>

    <label class="field income">
      <span class="field__label">Или введите доход за {{ form.year }} год вручную, ₽</span>
      <input
        v-model="form.income"
        :class="['input', 'income__input', { 'input--error': invalid }]"
        type="number"
        inputmode="decimal"
        min="0"
        placeholder="Например, 720000"
        @blur="touched = true"
      />
      <span v-if="invalid" class="field__error" role="alert">Укажите доход больше нуля</span>
      <span v-else class="field__hint">Общая сумма дохода до вычета налога из справки о доходах.</span>
    </label>

    <div v-if="Number(form.income) > 0" class="tax-box">
      <div>
        <span class="tax-box__label">Удержано НДФЛ за год</span>
        <span class="tax-box__value">≈ {{ rub(form.incomeTax) }}</span>
      </div>
      <p v-if="form.calc.capped" class="notice notice--warn">
        Налога за год меньше, чем полагается к возврату. Вернём {{ rub(form.calc.refund) }}{{ form.type === 'property' ? ', остаток перенесётся на следующие годы.' : ', остаток социального вычета не переносится.' }}
      </p>
      <p v-else class="notice notice--success">Налога хватает, чтобы вернуть всю сумму.</p>
    </div>
  </div>
</template>

<style lang="less">
// Ссылка в стиле кнопок-ссылок макета («Подготовить декларацию →»)
.fns-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  max-width: 520px;
  padding: 14px 18px;
  border-radius: var(--radius-l);
  background: var(--color-card-dark);
  color: var(--color-text-on-dark);
  text-decoration: none;
  transition: background 0.15s;

  &:hover {
    background: var(--color-button-push);
  }
  &__title {
    display: block;
  }
  &__note {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    color: var(--color-text-on-dark-muted);
  }
  &__arrow {
    width: 20px;
    height: 17px;
  }
}

.income {
  max-width: 420px;
  &__input {
    font-size: 20px;
    font-weight: 600;
    min-height: 54px;
    border-radius: 27px;
  }
}

.tax-box {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px 20px;
  border-radius: var(--radius-l);
  background: var(--color-bg-lilac);

  &__label {
    display: block;
    font-size: 14px;
    color: var(--color-heading-secondary);
  }
  &__value {
    font-size: 20px;
    font-weight: 600;
  }
}
</style>
