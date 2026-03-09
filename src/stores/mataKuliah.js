import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMKList, getMKById, addMK, updateMK, deleteMK } from '@/api'

export const useMKStore = defineStore('mataKuliah', () => {
  const mataKuliahList = ref([])
  const currentMK = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  const normalizeMK = (mk = {}) => ({
    kode_mk: mk.kode_mk || mk.kode || mk.id || '',
    nama_mk: mk.nama_mk || mk.nama || mk.name || '',
    deskripsi: mk.deskripsi || '-',
  })

  const normalizeMKPayload = (mkData = {}) => ({
    kode_mk: String(mkData.kode_mk || mkData.kode || '').trim(),
    nama_mk: String(mkData.nama_mk || mkData.nama || '').trim(),
    deskripsi: String(mkData.deskripsi || '').trim() || '-',
  })

  // Actions
  async function fetchAllMK() {
    isLoading.value = true
    error.value = null

    try {
      const response = await getMKList()
      const payload = response?.data?.data ?? response?.data
      if (Array.isArray(payload)) {
        mataKuliahList.value = payload.map(normalizeMK)
      } else {
        console.warn('Unexpected response format:', response.data)
        useFallbackData()
      }

      console.log('Mata Kuliah loaded:', mataKuliahList.value)
    } catch (err) {
      console.error('Error fetching Mata Kuliah:', err)
      error.value = 'Gagal memuat data Mata Kuliah'
      useFallbackData()
    } finally {
      isLoading.value = false
    }
  }

  // Helper function to use fallback data
  function useFallbackData() {
    console.log('Using fallback data for Mata Kuliah')
    mataKuliahList.value = [
      normalizeMK({ kode_mk: 'MKE401', nama_mk: 'Sistem Informasi Manajemen', deskripsi: '-' }),
      normalizeMK({
        kode_mk: 'IF2110',
        nama_mk: 'Algoritma dan Pemrograman',
        deskripsi: 'Mata kuliah tentang dasar-dasar algoritma dan pemrograman',
      }),
      normalizeMK({
        kode_mk: 'IF2120',
        nama_mk: 'Struktur Data',
        deskripsi: 'Mata kuliah tentang struktur data dan implementasinya',
      }),
      normalizeMK({
        kode_mk: 'IF2130',
        nama_mk: 'Sistem Basis Data',
        deskripsi: 'Mata kuliah tentang desain dan implementasi basis data',
      }),
      normalizeMK({
        kode_mk: 'IF2140',
        nama_mk: 'Rekayasa Perangkat Lunak',
        deskripsi: 'Mata kuliah tentang metodologi pengembangan perangkat lunak',
      }),
    ]
  }

  async function fetchMKById(id) {
    isLoading.value = true
    error.value = null

    try {
      const response = await getMKById(id)
      const payload = response?.data?.data ?? response?.data
      currentMK.value = normalizeMK(payload)
      return currentMK.value
    } catch (err) {
      console.error(`Error fetching Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal memuat detail Mata Kuliah'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createMK(mkData) {
    isLoading.value = true
    error.value = null

    try {
      const apiData = normalizeMKPayload(mkData)
      const response = await addMK(apiData)
      console.log('API response:', response)

      // Refresh list after adding
      await fetchAllMK()

      // Return the success response
      return response?.data || { success: true }
    } catch (err) {
      console.error('Error creating Mata Kuliah:', err)
      console.error('Error details:', err.response?.data || err.message)
      error.value = 'Gagal menambahkan Mata Kuliah: ' + (err.response?.data?.message || err.message)

      // Add to local list if in development/offline mode
      if (import.meta.env.DEV) {
        const newMk = normalizeMK(mkData)
        mataKuliahList.value.push(newMk)
        return { success: true, data: newMk }
      }

      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editMK(id, mkData) {
    isLoading.value = true
    error.value = null

    try {
      const apiData = normalizeMKPayload({ ...mkData, kode_mk: id })
      const response = await updateMK(id, apiData)
      // Refresh list after updating
      await fetchAllMK()
      return response.data
    } catch (err) {
      console.error(`Error updating Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal memperbarui Mata Kuliah'

      // Update local list if in development/offline mode
      if (import.meta.env.DEV) {
        const index = mataKuliahList.value.findIndex((item) => item.kode_mk === id)
        if (index !== -1) {
          mataKuliahList.value[index] = normalizeMK({ ...mataKuliahList.value[index], ...mkData })
          return { success: true, data: mataKuliahList.value[index] }
        }
      }

      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeMK(id) {
    isLoading.value = true
    error.value = null

    try {
      await deleteMK(id)
      // Remove from local list
      mataKuliahList.value = mataKuliahList.value.filter((mk) => mk.kode_mk !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal menghapus Mata Kuliah'

      // Still remove from local list if in development/offline mode
      if (import.meta.env.DEV) {
        mataKuliahList.value = mataKuliahList.value.filter((mk) => mk.kode_mk !== id)
        return { success: true }
      }

      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Helper untuk mendapatkan mata kuliah berdasarkan kode
  function getMKByKode(kodeMK) {
    if (!kodeMK) return null
    return mataKuliahList.value.find(
      (mk) =>
        // Handle different API response formats
        (mk.kode_mk && mk.kode_mk === kodeMK) || // New format
        (mk.kode && mk.kode === kodeMK) || // Old format
        (mk.id && mk.id === kodeMK), // Fallback to id
    )
  }

  // Helper untuk mendapatkan nama mata kuliah
  function getMataKuliahNama(kodeMK) {
    const mk = getMKByKode(kodeMK)
    if (!mk) return kodeMK // Return kode if not found
    return mk.nama_mk || mk.nama || `${kodeMK}` // Handle different formats
  }

  return {
    mataKuliahList,
    currentMK,
    isLoading,
    error,
    fetchAllMK,
    fetchMKById,
    createMK,
    editMK,
    removeMK,
    getMKByKode,
    getMataKuliahNama,
  }
})
