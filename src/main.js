// import './assets/main.css'
import './assets/base.css'
import "@fontsource/inter"
import "@fontsource/inter/400.css"; // Specify weight
import "@fontsource/inter/400-italic.css"; // Specify weight and style
import 'remixicon/fonts/remixicon.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min.js'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Font Awesome setup
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faUser, faLock, faHome } from '@fortawesome/free-solid-svg-icons'


// daftar ikon yang mau dipakai
library.add(faUser, faLock, faHome)

const app = createApp(App)

// daftarkan komponen global
app.component('font-awesome-icon', FontAwesomeIcon)

app.use(createPinia())
app.use(router)

app.mount('#app')
