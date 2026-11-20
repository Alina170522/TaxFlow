<script setup>
import { ref, onMounted } from 'vue'
import { useFormStore } from '../store/form.js'
import { rub } from '../utils.js'
import LoopVideo from './LoopVideo.vue'
import fnsVideo from '../assets/img/fns-building.mp4'
import fnsPoster from '../assets/img/fns-building-poster.webp'

const form = useFormStore()
const titleRef = ref(null)
onMounted(() => titleRef.value?.focus())

// Сводка для заполнения 3-НДФЛ в личном кабинете налогоплательщика
function download() {
  const lines = [
    'FlowTax — сводка для декларации 3-НДФЛ',
    '',
    `Вид вычета: ${form.typeInfo?.title}${form.expensive ? ' (дорогостоящее лечение)' : ''}`,
    `Год расходов: ${form.year}`,
    `За кого: ${form.personInfo?.title}`,
    `Доход за год: ${rub(form.income)}`,
    '',
    'Документы:',
    ...form.docsList
      .filter((d) => form.documents[d.id]?.status === 'ready')
      .map((d) => {
        const doc = form.documents[d.id]
        const sum = d.amountKind ? ` — ${rub(doc.amount)}` : ''
        return `— ${d.title}: ${doc.name}${sum}`
      }),
    `Расходы по документам: ${rub(form.totalExpenses)}`,
    '',
    `Примерная сумма возврата: ${rub(form.calc.refund)}`,
    form.calc.carryOver ? `Остаток на следующие годы: ${rub(form.calc.carryOver)}` : '',
    '',
    'Расчёт примерный. Учебный прототип FlowTax.'
  ].filter((l, i, arr) => l !== '' || arr[i - 1] !== '')

  saveText(`flowtax-${form.type}-${form.year}.txt`, lines.join('\n'))
}

// Страница по ссылке Claude отдаёт файл через функцию downloads (браузер спросит подтверждение),
// на GitHub Pages и локально — обычной ссылкой на скачивание
async function saveText(filename, text) {
  const host = window.claude
  if (host?.use) {
    const downloads = await host.use('downloads')
    if (downloads) {
      try {
        await downloads.save({ filename, data: text })
      } catch {
        // пользователь отказался или сохранение здесь недоступно
      }
      return
    }
  }
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function again() {
  form.reset()
  window.scrollTo({ top: 0 })
}
</script>

<template>
  <section class="done">
    <!-- Баннер по макету «Готовы к налоговому вычету?»: заголовок, подзаголовок, ссылка со стрелкой, здание ФНС снизу -->
    <div class="done__hero">
      <LoopVideo class="done__media" :src="fnsVideo" :poster="fnsPoster" />
      <div class="done__head">
        <h1 ref="titleRef" tabindex="-1">Заявление готово</h1>
        <p class="done__lead">Вернётся примерно</p>
        <p class="done__sum">{{ rub(form.calc.refund) }}</p>
        <button class="done__link" type="button" @click="download">
          Скачать сводку <span class="icon-arrow done__arrow" aria-hidden="true" />
        </button>
      </div>
    </div>

    <div class="done__body">
      <h2>Что дальше</h2>
      <ol class="done__steps">
        <li>Скачайте сводку: в ней все суммы и список документов.</li>
        <li>Войдите в личный кабинет налогоплательщика на nalog.gov.ru через Госуслуги.</li>
        <li>Заполните декларацию 3-НДФЛ по сводке и прикрепите документы.</li>
        <li>Налоговая проверит декларацию до трёх месяцев, деньги придут в течение месяца после одобрения.</li>
      </ol>

      <div class="done__actions">
        <button class="btn btn--secondary" type="button" @click="again">Оформить ещё один вычет</button>
      </div>
    </div>
  </section>
</template>

<style lang="less">
.done {
  display: grid;
  grid-template-columns: minmax(0, 540px) minmax(0, 1fr);
  max-width: 1100px;
  margin: 24px auto 0;
  border-radius: var(--radius-l);
  overflow: hidden;
  background: var(--color-surface);
  border: 1px solid var(--color-border);

  // Пропорции как у баннера в макете (здание всегда в нижней половине), текст масштабируется от ширины
  &__hero {
    position: relative;
    container-type: inline-size;
    aspect-ratio: 700 / 932;
    background: #fafafc;
  }
  &__media {
    position: absolute;
    inset: 0;
    object-position: center bottom;
  }
  // Отступы и размеры из макета (ширина 740): поля 40, заголовок 48, подзаголовок 28, ссылка 18
  &__head {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding: clamp(20px, 5.4cqi, 40px);
    padding-right: clamp(20px, 17cqi, 126px);

    h1 {
      font-size: clamp(26px, 6.5cqi, 48px);
      line-height: 1.25;
      &:focus {
        outline: none;
      }
    }
  }
  &__lead {
    margin-top: clamp(12px, 4cqi, 30px);
    font-size: clamp(15px, 3.8cqi, 28px);
    line-height: 1.25;
    color: var(--color-text-muted);
  }
  &__sum {
    margin-top: 4px;
    font-size: clamp(26px, 6.5cqi, 48px);
    line-height: 1.25;
    color: var(--color-ink);
  }
  &__link {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    margin-top: clamp(12px, 4cqi, 30px);
    margin-left: -10px;
    padding: 10px;
    border: 0;
    border-radius: var(--radius-m);
    background: none;
    color: var(--color-ink);
    font-size: clamp(14px, 2.45cqi, 18px);
    cursor: pointer;
    &:hover {
      background: var(--color-bg-lilac);
    }
  }
  &__arrow {
    width: 20px;
    height: 17px;
  }
  &__body {
    padding: 40px 40px 40px;
    h2 {
      font-size: 28px;
    }
  }
  &__steps {
    margin: 20px 0 0;
    padding-left: 22px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    li::marker {
      color: var(--color-accent);
    }
  }
  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 32px;
  }
}

@media (max-width: 900px) {
  .done {
    grid-template-columns: 1fr;
    max-width: 560px;
  }
}

@media (max-width: 600px) {
  .done {
    margin-top: 0;
    &__body {
      padding: 24px 20px;
      h2 {
        font-size: 22px;
      }
    }
    &__actions .btn {
      width: 100%;
    }
  }
}
</style>
