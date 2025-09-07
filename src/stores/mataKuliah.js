import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMKList, getMKById, addMK, updateMK, deleteMK } from '@/api'

export const useMKStore = defineStore('mataKuliah', () => {
  const mataKuliahList = ref([])
  const currentMK = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllMK() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getMKList()
      // Handle new API response format
      if (response.data && response.data.success) {
        mataKuliahList.value = response.data.data
      } else {
        mataKuliahList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching Mata Kuliah:', err)
      error.value = 'Gagal memuat data Mata Kuliah'
      
      // Fallback data jika API belum tersedia
      mataKuliahList.value = [
        { 
          id: 'MK001', 
          kode: 'IF2110', 
          nama: 'Algoritma dan Pemrograman',
          sks: 4,
          semester: 1
        },
        { 
          id: 'MK002', 
          kode: 'IF2120', 
          nama: 'Struktur Data',
          sks: 4,
          semester: 2
        },
        { 
          id: 'MK003', 
          kode: 'IF2130', 
          nama: 'Sistem Basis Data',
          sks: 3,
          semester: 3
        },
        { 
          id: 'MK004', 
          kode: 'IF2140', 
          nama: 'Rekayasa Perangkat Lunak',
          sks: 3,
          semester: 4
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchMKById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getMKById(id)
      currentMK.value = response.data
      return response.data
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
      const response = await addMK(mkData)
      // Refresh list after adding
      await fetchAllMK()
      return response.data
    } catch (err) {
      console.error('Error creating Mata Kuliah:', err)
      error.value = 'Gagal menambahkan Mata Kuliah'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editMK(id, mkData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updateMK(id, mkData)
      // Refresh list after updating
      await fetchAllMK()
      return response.data
    } catch (err) {
      console.error(`Error updating Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal memperbarui Mata Kuliah'
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
      mataKuliahList.value = mataKuliahList.value.filter(mk => mk.id !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal menghapus Mata Kuliah'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
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
    removeMK
  }
})
