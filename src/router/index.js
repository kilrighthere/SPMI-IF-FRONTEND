import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Kurikulum from '@/views/Kurikulum/Kurikulum.vue'
import DetailKur from '@/views/Kurikulum/DetailKur.vue'
import ProfilLulusan from '@/views/Kurikulum/ProfilLulusan.vue'
import CPLProdi from '@/views/Kurikulum/CPLProdi.vue'
import CPMK from '@/views/Kurikulum/CPMK.vue'
import NilMatkul from '@/views/Kurikulum/NilMatkul.vue'
import DetailNilaiMatkul from '@/views/Kurikulum/DetailNilaiMatkul.vue'
import RPS from '@/views/Kurikulum/RPS.vue'
import StrukMatkul from '@/views/Kurikulum/StrukMatkul.vue'
import UkurCPL from '@/views/Kurikulum/UkurCPL.vue'
import BahanKajian from '@/views/Kurikulum/BahanKajian.vue'
import KorelasiCPLPL from '@/views/Kurikulum/KorelasiCPLPL.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { title: 'Login' } },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard', requiresAuth: true },
  },
  { path: '/kurikulum', component: Kurikulum, meta: { title: 'Kurikulum' } },
  {
    path: '/kurikulum/:id',
    component: DetailKur,
    meta: { title: 'Detail Kurikulum', requiresAuth: true },
    children: [
      { path: '', redirect: 'profil-lulusan' },
      { 
        path: 'profil-lulusan',
        component: ProfilLulusan,
        meta: { title: 'Profil Lulusan', requiresAuth: true },
      },
      { path: 'cpl-prodi', component: CPLProdi, meta: { title: 'CPL Prodi', requiresAuth: true } },
      { path: 'korelasi-cpl-pl', component: KorelasiCPLPL, meta: { title: 'Korelasi CPL-PL', requiresAuth: true } },
      { path: 'cpmk', component: CPMK, meta: { title: 'CPMK', requiresAuth: true } },
      { path: 'bahan-kajian', component: BahanKajian, meta: { title: 'Bahan Kajian', requiresAuth: true } },
      {
        path: 'struktur-matkul',
        component: StrukMatkul,
        meta: { title: 'Struktur Mata Kuliah', requiresAuth: true },
      },
      { path: 'rps', component: RPS, meta: { title: 'RPS Mata Kuliah', requiresAuth: true } },
      {
        path: 'nilai-matkul',
        component: NilMatkul,
        meta: { title: 'Nilai Mata Kuliah', requiresAuth: true },
      },
      {
        path: 'nilai-matkul/:kodeMk',
        component: DetailNilaiMatkul,
        name: 'DetailNilaiMatkul',
        meta: { title: 'Detail Nilai Mata Kuliah', requiresAuth: true },
      },
      {
        path: 'ukur-cpl',
        component: UkurCPL,
        meta: { title: 'Pengukuran CPL Mahasiswa', requiresAuth: true },
      },
    ],
  },
  // Redirect for direct access to kurikulum details without ID
  {
    path: '/kurikulum-detail',
    redirect: (to) => {
      const kurikulumId = import.meta.env.VITE_DEFAULT_KURIKULUM_ID || '2020'
      return `/kurikulum/${kurikulumId}/profil-lulusan`
    },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// ganti title tab browser sesuai route dan proteksi route yang membutuhkan auth
router.beforeEach(async (to, from, next) => {
  document.title = to.meta.title ? `${to.meta.title} - OBELIKS` : 'OBELIKS'

  // Jika route membutuhkan autentikasi, cek auth store saat runtime
  if (to.meta.requiresAuth) {
    // import store lazily to avoid circular deps during router creation
    const { useAuthStore } = await import('@/stores/auth')
    const auth = useAuthStore()
    // Ensure we have attempted silent refresh if no token yet
    if (!auth.isAuthenticated || !auth.isAuthenticated.value) {
      // try to refresh once (checkAuth will return boolean)
      const ok = await auth.checkAuth()
      if (!ok) return next({ path: '/login' })
    }
  }

  next()
})

export default router
