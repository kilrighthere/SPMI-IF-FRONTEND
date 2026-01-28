import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Dashboard from '@/views/Dashboard.vue'
import Kurikulum from '@/views/Kurikulum/Kurikulum.vue'
import DetailKur from '@/views/Kurikulum/DetailKur.vue'
import ProfilLulusan from '@/views/Kurikulum/ProfilLulusan.vue'
import CPLProdi from '@/views/Kurikulum/CPLProdi.vue'
import CPLSndikti from '@/views/Kurikulum/CPLSndikti.vue'
import CPMK from '@/views/Kurikulum/CPMK.vue'
import NilMatkul from '@/views/Kurikulum/NilMatkul.vue'
import DetailNilaiMatkul from '@/views/Kurikulum/DetailNilaiMatkul.vue'
import NilaiMahasiswaPerPeriode from '@/views/Kurikulum/NilaiMahasiswaPerPeriode.vue'
import RPS from '@/views/Kurikulum/RPS.vue'
import StrukMatkul from '@/views/Kurikulum/StrukMatkul.vue'
import KurikulumMk from '@/views/Kurikulum/KurikulumMk.vue'
import UkurCPL from '@/views/Kurikulum/UkurCPL.vue'
import BahanKajian from '@/views/Kurikulum/BahanKajian.vue'
import KorelasiCPLPL from '@/views/Kurikulum/KorelasiCPLPL.vue'
import CpmkMk from '@/views/Kurikulum/CpmkMk.vue'
import MkPeriode from '@/views/Kurikulum/MkPeriode.vue'
import BkMk from '@/views/Kurikulum/BkMk.vue'
import Mahasiswa from '@/views/Kurikulum/Mahasiswa.vue'
import CPLBk from '@/views/Kurikulum/CplBk.vue'
import NilaiCpmk from '@/views/Kurikulum/NilaiCpmk.vue'
import BobotCpmk from '@/views/Kurikulum/BobotCpmk.vue'
import DosenWali from '@/views/DosenWali.vue'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: Login, meta: { title: 'Login' } },
  // {
  //   path: '/Login',
  //   component: Dashboard,
  //   meta: { title: 'Dashboard', requiresAuth: true },
  // },
  {
    path: '/dashboard',
    component: Dashboard,
    meta: { title: 'Dashboard', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
  },

  {
    path: '/kurikulum',
    component: Kurikulum,
    meta: { title: 'Kurikulum', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
  },
  {
    path: '/kurikulum/:id',
    component: DetailKur,
    meta: { title: 'Detail Kurikulum', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
    children: [
      { path: '', redirect: 'profil-lulusan' },
      {
        path: 'profil-lulusan',
        component: ProfilLulusan,
        meta: {
          title: 'Profil Lulusan',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'cpl-prodi',
        component: CPLProdi,
        meta: { title: 'CPL Prodi', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
      },
      {
        path: 'cpl-sndikti',
        component: CPLSndikti,
        meta: { title: 'CPL SNDIKTI', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
      },
      {
        path: 'korelasi-cpl-pl',
        component: KorelasiCPLPL,
        meta: {
          title: 'Korelasi CPL-PL',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'cpmk',
        component: CPMK,
        meta: { title: 'CPMK', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
      },
      {
        path: 'bahan-kajian',
        component: BahanKajian,
        meta: { title: 'Bahan Kajian', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
      },
      {
        path: 'cpl-bk',
        component: CPLBk,
        meta: {
          title: 'Korelasi CPL vs BK',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'cpmk-mk',
        component: CpmkMk,
        meta: {
          title: 'Korelasi CPMK vs MK',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'bk-mk',
        component: BkMk,
        meta: {
          title: 'Korelasi BK vs MK',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'struktur-matkul',
        component: StrukMatkul,
        meta: {
          title: 'Struktur Mata Kuliah',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'kurikulum-mk',
        component: KurikulumMk,
        meta: {
          title: 'Kurikulum Mata Kuliah',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'rps',
        component: RPS,
        meta: { title: 'RPS Mata Kuliah', requiresAuth: true, roles: ['admin', 'dosen'] },
      },
      {
        path: 'nilai-matkul',
        component: NilMatkul,
        meta: {
          title: 'Nilai Mata Kuliah',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'nilai-cpmk',
        component: NilaiCpmk,
        meta: { title: 'Nilai CPMK', requiresAuth: true, roles: ['admin', 'dosen'] },
      },
      {
        path: 'bobot-cpmk',
        component: BobotCpmk,
        meta: { title: 'Bobot CPMK', requiresAuth: true, roles: ['admin', 'dosen'] },
      },
      {
        path: 'nilai-matkul/:kodeMk',
        component: DetailNilaiMatkul,
        name: 'DetailNilaiMatkul',
        meta: {
          title: 'Detail Nilai Mata Kuliah',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'ukur-cpl',
        component: UkurCPL,
        meta: {
          title: 'Pengukuran CPL Mahasiswa',
          requiresAuth: true,
          roles: ['admin', 'dosen', 'mahasiswa'],
        },
      },
      {
        path: 'mahasiswa',
        component: Mahasiswa,
        meta: { title: 'Mahasiswa', requiresAuth: true, roles: ['admin', 'dosen', 'mahasiswa'] },
      },
      {
        path: 'mk-periode',
        component: MkPeriode,
        meta: { title: 'MK Periode', requiresAuth: true, roles: ['admin', 'dosen'] },
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
  // Route untuk view nilai mahasiswa per periode
  {
    path: '/mahasiswa/:nim/:periode',
    component: NilaiMahasiswaPerPeriode,
    name: 'NilaiMahasiswaPerPeriode',
    meta: {
      title: 'Nilai CPL per Periode',
      requiresAuth: true,
      roles: ['admin', 'dosen', 'mahasiswa'],
    },
  },
  {
    path: '/admin/dosen-wali',
    component: DosenWali,
    meta: {
      title: 'Dosen Wali',
      requiresAuth: true,
      roles: ['admin', 'dosen'],
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

  const { useAuthStore } = await import('@/stores/auth')
  const auth = useAuthStore()

  if (to.path === '/login') {
    const hasActiveSession = localStorage.getItem('token') || localStorage.getItem('user')

    if (hasActiveSession) {
      const ok = await auth.checkAuth()

      if (ok && auth.isAuthenticated) {
        return next({ path: '/dashboard' })
      }
    }
    return next()
  }

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

    // Check role-based access
    if (to.meta.roles && to.meta.roles.length > 0) {
      const userRole = auth.user?.role
      if (!userRole || !to.meta.roles.includes(userRole)) {
        // Redirect based on role
        if (userRole === 'mahasiswa') {
          // Mahasiswa hanya bisa akses dashboard dan view nilai sendiri
          return next({ path: '/dashboard' })
        } else if (userRole === 'dosen') {
          // Dosen bisa akses kurikulum
          return next({ path: '/dashboard' })
        }
        // Default redirect ke login jika role tidak cocok
        return next({ path: '/login' })
      }
    }
  }

  next()
})

export default router
