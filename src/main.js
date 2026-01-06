import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initTheme } from './lib/theme'
import { initSession } from './lib/session'

const app = createApp(App)
app.use(router)
initTheme()
initSession()
app.mount('#app')
