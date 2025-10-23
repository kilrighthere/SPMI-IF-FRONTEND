import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getBKList, getBKById, addBK, updateBK, deleteBK } from '@/api'

export const useBKStore = defineStore('bk', () => {
  const bkList = ref([])
  const currentBK = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllBK() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getBKList()
      // Handle API response format
      if (response.data && response.data.success) {
        bkList.value = response.data.data
      } else {
        bkList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching BK:', err)
      error.value = 'Gagal memuat data Bahan Kajian'
      
      // Fallback data sesuai format API
      bkList.value = [
        {
          id_bk: 'BK001',
          deskripsi: 'Pemrograman Dasar'
        },
        {
          id_bk: 'BK002',
          deskripsi: 'Struktur Data dan Algoritma'
        },
        {
          id_bk: 'BK003',
          deskripsi: 'Basis Data'
        },
        {
          id_bk: 'BK004',
          deskripsi: 'Rekayasa Perangkat Lunak'
        },
        {
          id_bk: 'BK005',
          deskripsi: 'Jaringan Komputer'
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchBKById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getBKById(id)
      currentBK.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching BK with id ${id}:`, err)
      error.value = 'Gagal memuat detail Bahan Kajian'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createBK(bkData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await addBK(bkData)
      // Refresh list after adding
      await fetchAllBK()
      return response.data
    } catch (err) {
      console.error('Error creating BK:', err)
      error.value = 'Gagal menambahkan Bahan Kajian'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editBK(id, bkData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updateBK(id, bkData)
      // Refresh list after updating
      await fetchAllBK()
      return response.data
    } catch (err) {
      console.error(`Error updating BK with id ${id}:`, err)
      error.value = 'Gagal memperbarui Bahan Kajian'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeBK(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deleteBK(id)
      // Remove from local list
      bkList.value = bkList.value.filter(bk => bk.id_bk !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting BK with id ${id}:`, err)
      error.value = 'Gagal menghapus Bahan Kajian'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    bkList,
    currentBK,
    isLoading,
    error,
    fetchAllBK,
    fetchBKById,
    createBK,
    editBK,
    removeBK
  }
})