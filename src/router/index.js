import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Kurikulum from '@/views/Kurikulum/Kurikulum.vue'
import DetailKur from '@/views/Kurikulum/DetailKur.vue'

// import HomeView from '../views/HomeView.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { title: 'Login - Sistem Informasi' } },
  { path: '/dashboard', component: Dashboard, meta: { title: 'Dashboard - Sistem Informasi' } },
  { path: '/kurikulum', component: Kurikulum, meta: { title: 'Kurikulum - Sistem Informasi' } },
  { path: '/Detail-Kurikulum', component: DetailKur, meta: {title: 'Detail Kurikulum - Sistem Informasi'}},
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Sistem Informasi'
  next()
})

// const router = createRouter({
//   history: createWebHistory(import.meta.env.BASE_URL),
//   routes: [
//     {
//       path: '/',
//       name: 'home',
//       component: HomeView,
//     },
//     {
//       path: '/about',
//       name: 'about',
//       // route level code-splitting
//       // this generates a separate chunk (About.[hash].js) for this route
//       // which is lazy-loaded when the route is visited.
//       component: () => import('../views/AboutView.vue'),
//     },
//   ],
// })

export default router
