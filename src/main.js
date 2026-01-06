import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { initSession } from './lib/session'

const app = createApp(App)
app.use(router)
initSession()
app.mount('#app')
