import { createRouter, createWebHashHistory } from 'vue-router'
import HomePage from './pages/HomePage.vue'
import DeductionPage from './pages/DeductionPage.vue'
import StubPage from './pages/StubPage.vue'
import DocumentsPage from './pages/DocumentsPage.vue'

// Hash-маршруты: работают на GitHub Pages без настройки сервера и в превью одним файлом
const stub = (path, title, section = title) => ({ path, component: StubPage, meta: { title, section } })

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: HomePage, meta: { title: 'Главная' } },
    { path: '/deduction', component: DeductionPage, meta: { title: 'Заявление на вычет' } },
    stub('/expenses', 'Расходы'),
    stub('/certificates', 'Справки'),
    { path: '/documents', component: DocumentsPage, meta: { title: 'Документы' } },
    stub('/notifications', 'Уведомления'),
    stub('/profile', 'Профиль'),
    stub('/search', 'Поиск'),
    stub('/privacy', 'Политика конфиденциальности'),
    stub('/terms', 'Соглашение'),
    { path: '/:pathMatch(.*)*', component: StubPage, meta: { title: 'Страница не найдена', section: null } }
  ],
  scrollBehavior: () => ({ top: 0 })
})

router.afterEach((to) => {
  document.title = to.path === '/' ? 'FlowTax — меняем расходы на доходы' : `${to.meta.title} — FlowTax`
})
