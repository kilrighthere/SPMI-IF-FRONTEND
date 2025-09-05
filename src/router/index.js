import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Kurikulum from '@/views/Kurikulum/Kurikulum.vue'
import DetailKur from '@/views/Kurikulum/DetailKur.vue'
import ProfilLulusan from '@/views/Kurikulum/ProfilLulusan.vue'
import CPLProdi from '@/views/Kurikulum/CPLProdi.vue'
import CPMK from '@/views/Kurikulum/CPMK.vue'
import KorelasiPL from '@/views/Kurikulum/KorelasiPL.vue'
import NilMatkul from '@/views/Kurikulum/NilMatkul.vue'
import RPS from '@/views/Kurikulum/RPS.vue'
import StrukMatkul from '@/views/Kurikulum/StrukMatkul.vue'
import UkurCPL from '@/views/Kurikulum/UkurCPL.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { title: 'Login - Sistem Informasi' } },
  { path: '/dashboard', component: Dashboard, meta: { title: 'Dashboard - Sistem Informasi' } },
  { path: '/kurikulum', component: Kurikulum, meta: { title: 'Kurikulum - Sistem Informasi' } },
  { path: '/Detail-Kurikulum', component: DetailKur, meta: {title: 'Detail Kurikulum - Sistem Informasi'}},
  {path: '/kurikulum/CPL-Prodi', component:CPLProdi, meta:{title:'CPL Prodi - Sistem Informasi'}},
  {path: '/kurikulum/CPMK', component:CPMK, meta:{title:'CPMK - Sistem Informasi'}},
  {path: '/kurikulum/Korelasi-PL', component:KorelasiPL, meta:{title:'Korelasi PL - Sistem Informasi'}},
  {path: '/kurikulum/Nilai-Matkul', component:NilMatkul, meta:{title:'Nilai Mata Kuliah - Sistem Informasi'}},
  {path: '/kurikulum/RPS', component:RPS, meta:{title:'RPS - Sistem Informasi'}},
  {path: '/kurikulum/Struktur-Matkul', component:StrukMatkul, meta:{title:'Struktur Mata Kuliah - Sistem Informasi'}},
  {path: '/kurikulum/Ukur-CPL', component:UkurCPL, meta:{title:'Ukur CPL - Sistem Informasi'}},
  {path: '/kurikulum/Profil-Lulusan', component:ProfilLulusan, meta:{title:'Profil Lulusan - Sistem Informasi'}},
  
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'Sistem Informasi'
  next()
})


export default router
