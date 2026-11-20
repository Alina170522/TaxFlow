import { createApp, watch } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import { router } from './router.js'
import { useFormStore } from './store/form.js'
import './styles/base.less'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Черновик сохраняется в браузере, чтобы не потерять данные при перезагрузке
const form = useFormStore()
watch(() => form.$state, () => form.save(), { deep: true })

app.mount('#app')
