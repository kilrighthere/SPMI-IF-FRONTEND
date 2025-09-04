// import './assets/main.css'
import './assets/base.css'
import 'remixicon/fonts/remixicon.css'
// import 'bootstrap/dist/css/bootstrap.min.css'
// import 'bootstrap/dist/js/bootstrap.bundle.min.js'
import './assets/custom.scss'
import "@fontsource/inter"; // default 400
import "@fontsource/inter/600.css"; // kalau mau berat tertentu
import "@fontsource/inter/700.css"; 


import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
