import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable untuk mengelola permission berdasarkan role
 *
 * Role hierarchy:
 * - admin: Akses penuh ke semua menu dan submenu
 * - dosen: Akses untuk mengisi nilai forward dan backward (per-CPL)
 * - mahasiswa: Akses untuk melihat grafik nilai akhir (per-CPL) milik sendiri
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
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Profil Lulusan
    profilLulusan: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPL Prodi
    cplProdi: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPL SNDIKTI
    cplSndikti: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Korelasi CPL-PL
    korelasiCplPl: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // CPMK
    cpmk: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Bahan Kajian
    bahanKajian: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Struktur Mata Kuliah
    strukturMatkul: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Kurikulum Mata Kuliah
    kurikulumMk: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value || isDosen.value, // Dosen bisa manage mata kuliah
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // RPS
    rps: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value,
      edit: isAdmin.value,
      delete: isAdmin.value,
    },

    // Nilai Mata Kuliah
    nilaiMatkul: {
      view: isAdmin.value || isDosen.value,
      create: isAdmin.value || isDosen.value, // Dosen bisa input nilai
      edit: isAdmin.value || isDosen.value, // Dosen bisa edit nilai
      delete: isAdmin.value,
      // Dosen bisa mengisi nilai forward dan backward (per-CPL)
      inputNilaiForward: isDosen.value || isAdmin.value,
      inputNilaiBackward: isDosen.value || isAdmin.value,
    },

    // Pengukuran CPL (Ukur CPL)
    ukurCpl: {
      view: isAdmin.value || isDosen.value || isMahasiswa.value,
      // Mahasiswa hanya bisa lihat milik sendiri
      viewOwn: isMahasiswa.value,
      viewAll: isAdmin.value || isDosen.value,
      create: isAdmin.value || isDosen.value,
      edit: isAdmin.value || isDosen.value,
      delete: isAdmin.value,
    },

    // Mahasiswa Management
    mahasiswa: {
      view: isAdmin.value || isDosen.value,
      viewOwn: isMahasiswa.value, // Mahasiswa bisa lihat data diri sendiri
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
  }
}
