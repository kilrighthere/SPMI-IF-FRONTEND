import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getKorelasiCPLPLList, getKorelasiCPLPLById, addKorelasiCPLPL, updateKorelasiCPLPL, deleteKorelasiCPLPL } from '@/api'

export const useKorelasiCPLPLStore = defineStore('korelasiCPLPL', () => {
  const korelasiList = ref([])
  const currentKorelasi = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllKorelasi() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getKorelasiCPLPLList()
      // Handle new API response format
      if (response.data && response.data.success) {
        korelasiList.value = response.data.data
      } else {
        korelasiList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching Korelasi CPL-PL:', err)
      error.value = 'Gagal memuat data Korelasi CPL-PL'
      korelasiList.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function fetchKorelasiById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getKorelasiCPLPLById(id)
      currentKorelasi.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching Korelasi with id ${id}:`, err)
      error.value = 'Gagal memuat detail Korelasi CPL-PL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createKorelasi(data) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await addKorelasiCPLPL(data)
      // Refresh list after adding
      await fetchAllKorelasi()
      return response.data
    } catch (err) {
      console.error('Error creating Korelasi CPL-PL:', err)
      error.value = 'Gagal menambahkan Korelasi CPL-PL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editKorelasi(id, data) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updateKorelasiCPLPL(id, data)
      // Refresh list after updating
      await fetchAllKorelasi()
      return response.data
    } catch (err) {
      console.error(`Error updating Korelasi with id ${id}:`, err)
      error.value = 'Gagal memperbarui Korelasi CPL-PL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeKorelasi(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deleteKorelasiCPLPL(id)
      // Remove from local list
      korelasiList.value = korelasiList.value.filter(k => k.id !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting Korelasi with id ${id}:`, err)
      error.value = 'Gagal menghapus Korelasi CPL-PL'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  // Tambahkan fungsi khusus untuk menghapus korelasi berdasarkan id_cpl
  async function removeKorelasiByIdCPL(id_cpl) {
    isLoading.value = true
    error.value = null
    
    try {
      // Endpoint khusus ini perlu dibuat di API
      const response = await deleteKorelasiCPLPL(id_cpl)
      // Refresh data setelah penghapusan
      await fetchAllKorelasi()
      return response.data
    } catch (err) {
      console.error(`Error removing Korelasi for CPL id ${id_cpl}:`, err)
      error.value = 'Gagal menghapus korelasi CPL-PL'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    korelasiList,
    currentKorelasi,
    isLoading,
    error,
    fetchAllKorelasi,
    fetchKorelasiById,
    createKorelasi,
    editKorelasi,
    removeKorelasi,
    removeKorelasiByIdCPL
  }
})
