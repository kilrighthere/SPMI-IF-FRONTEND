import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable untuk mengelola permission berdasarkan role
 *
 * Role hierarchy:
 * - ADMIN: Bisa MELIHAT dan MENGEDIT seluruh hal
 * - DOSEN: Dapat MENGUBAH seluruh hal seputar PENILAIAN saja, sisanya hanya MELIHAT
 * - MAHASISWA: Hanya dapat MELIHAT kurikulum, profil lulusan, CPL prodi, CPL sndikti, CPL PL,
 *              CPMK, bahan kajian, mata kuliah, CPL BK, CPMK MK, kurikulum MK, dan NILAI MILIK DIRINYA SENDIRI
 */
export function usePermissions() {
  const auth = useAuthStore()

  // Get current user role
  const userRole = computed(() => auth.user?.role || null)
  const userId = computed(() => auth.user?.nim || auth.user?.nip || null)

  // Check if user is admin
  const isAdmin = computed(() => userRole.value === 'admin')

  // Check if user is dosen
  const isDosen = computed(() => userRole.value === 'dosen')

  // Check if user is mahasiswa
  const isMahasiswa = computed(() => userRole.value === 'mahasiswa')

  /**
   * Permissions untuk setiap menu/feature
   */
  const permissions = computed(() => ({
    // Dashboard - Semua role bisa akses
    dashboard: {
      view: true,
    },

    // Kurikulum Management
    kurikulum: {
      view: true, // Semua bisa lihat
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Profil Lulusan
    profilLulusan: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPL Prodi
    cplProdi: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPL SNDIKTI
    cplSndikti: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Korelasi CPL-PL
    korelasiCplPl: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPMK
    cpmk: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Bahan Kajian
    bahanKajian: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Mata Kuliah / Struktur Mata Kuliah
    strukturMatkul: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Kurikulum Mata Kuliah
    kurikulumMk: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value, // Hanya admin
      edit: isAdmin.value, // Hanya admin
      delete: isAdmin.value,
    },

    // CPL BK (Korelasi CPL vs Bahan Kajian)
    cplBk: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPMK MK (Korelasi CPMK vs Mata Kuliah)
    cpmkMk: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // BK MK (Korelasi BK vs Mata Kuliah)
    bkMk: {
      view: true, // Semua bisa lihat (mahasiswa, dosen, admin)
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // RPS
    rps: {
      view: isAdmin.value || isDosen.value, // Mahasiswa tidak bisa lihat RPS
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // MK Periode
    mkPeriode: {
      view: isAdmin.value || isDosen.value, // Mahasiswa tidak bisa lihat
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Nilai Mata Kuliah - PENILAIAN (Dosen bisa edit)
    nilaiMatkul: {
      view: true, // Semua bisa lihat (mahasiswa hanya milik sendiri)
      viewOwn: isMahasiswa.value, // Mahasiswa hanya lihat nilai sendiri
      viewAll: isAdmin.value || isDosen.value, // Admin & dosen bisa lihat semua
      create: isAdmin.value || isDosen.value, // Dosen bisa input nilai
      edit: isAdmin.value || isDosen.value, // Dosen bisa edit nilai
      delete: isAdmin.value, // Hanya admin bisa delete
    },

    // Nilai CPMK - PENILAIAN (Dosen bisa edit)
    nilaiCpmk: {
      view: isAdmin.value || isDosen.value, // Mahasiswa tidak bisa lihat nilai CPMK
      create: isAdmin.value || isDosen.value, // Dosen bisa input nilai CPMK
      edit: isAdmin.value || isDosen.value, // Dosen bisa edit nilai CPMK
      delete: isAdmin.value,
    },

    // Bobot CPMK - PENILAIAN (Dosen bisa edit)
    bobotCpmk: {
      view: isAdmin.value || isDosen.value, // Mahasiswa tidak bisa lihat bobot CPMK
      create: isAdmin.value || isDosen.value, // Dosen bisa input bobot
      edit: isAdmin.value || isDosen.value, // Dosen bisa edit bobot
      delete: isAdmin.value,
    },

    // Pengukuran CPL (Ukur CPL)
    ukurCpl: {
      view: true, // Semua bisa lihat (mahasiswa hanya milik sendiri)
      viewOwn: isMahasiswa.value, // Mahasiswa hanya bisa lihat milik sendiri
      viewAll: isAdmin.value || isDosen.value, // Admin & dosen bisa lihat semua
      create: isAdmin.value || isDosen.value,
      edit: isAdmin.value || isDosen.value,
      delete: isAdmin.value,
    },

    // Mahasiswa Management
    mahasiswa: {
      view: true, // Semua bisa lihat (mahasiswa hanya data sendiri)
      viewOwn: isMahasiswa.value, // Mahasiswa bisa lihat data diri sendiri
      viewAll: isAdmin.value || isDosen.value, // Admin & dosen bisa lihat semua
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // User Management (jika ada)
    userManagement: {
      view: isAdmin.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },
  }))

  /**
   * Check if user has permission for specific action
   * @param {string} module - Module name (e.g., 'kurikulum', 'cplProdi')
   * @param {string} action - Action name (e.g., 'view', 'create', 'edit', 'delete')
   * @returns {boolean}
   */
  function can(module, action = 'view') {
    if (!permissions.value[module]) {
      console.warn(`Module '${module}' not found in permissions`)
      return false
    }
    return permissions.value[module][action] || false
  }

  /**
   * Check if user can access specific mahasiswa data
   * @param {string} nim - NIM mahasiswa yang ingin diakses
   * @returns {boolean}
   */
  function canAccessMahasiswaData(nim) {
    // Admin dan dosen bisa akses semua data mahasiswa
    if (isAdmin.value || isDosen.value) return true

    // Mahasiswa hanya bisa akses data sendiri
    if (isMahasiswa.value && userId.value === nim) return true

    return false
  }

  /**
   * Get allowed menu items based on role
   * @returns {Array} Array of menu items that user can access
   */
  function getAllowedMenuItems() {
    const allMenuItems = [
      {
        path: '/dashboard',
        name: 'Dashboard',
        icon: 'ri-dashboard-line',
        requiredRole: ['admin', 'dosen', 'mahasiswa'],
      },
      {
        path: '/kurikulum',
        name: 'Kurikulum',
        icon: 'ri-book-line',
        requiredRole: ['admin', 'dosen'],
      },
    ]

    return allMenuItems.filter(
      (item) => !item.requiredRole || item.requiredRole.includes(userRole.value),
    )
  }

  /**
   * Helper functions for specific features
   */
  const canManageKurikulumMk = computed(() => can('kurikulumMk', 'create'))

  // Helper khusus untuk penilaian (dosen dan admin bisa edit)
  const canManageNilai = computed(() => isAdmin.value || isDosen.value)

  // Helper untuk view-only mode (mahasiswa dan dosen di halaman non-penilaian)
  const isViewOnly = computed(() => isMahasiswa.value)

  return {
    userRole,
    userId,
    isAdmin,
    isDosen,
    isMahasiswa,
    permissions,
    can,
    canAccessMahasiswaData,
    getAllowedMenuItems,
    canManageKurikulumMk,
    canManageNilai,
    isViewOnly,
  }
}
