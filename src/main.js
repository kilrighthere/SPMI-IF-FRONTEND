import './assets/base.css'
import './assets/fonts.css'
import 'remixicon/fonts/remixicon.css'
// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/custom.scss'

// Import fonts from centralized font module
import './assets/fonts.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'

import App from './App.vue'
import router from './router'

// Create app and single Pinia instance (avoid creating Pinia twice)
const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

// Initialize authentication state on startup. We attempt to refresh the access token
// using a httpOnly refresh cookie if no token is present in localStorage. Do this
// before mounting so route guards have the correct auth state.
const auth = useAuthStore()
auth.checkAuth().finally(() => {
  // Mount the app regardless of auth outcome (router guards will redirect if needed)
  app.mount('#app')
})
