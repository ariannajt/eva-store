import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import { useAuthStore } from './stores/auth'
import './styles/neon-theme.css'

const app = createApp(App)

app.use(createPinia())
app.use(vuetify)

const authStore = useAuthStore()
authStore.init().finally(() => {
  app.use(router)
  app.mount('#app')
})
