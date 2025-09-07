import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCPMKList, getCPMKById, addCPMK, updateCPMK, deleteCPMK } from '@/api'

export const useCPMKStore = defineStore('cpmk', () => {
  const cpmkList = ref([])
  const currentCPMK = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllCPMK() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getCPMKList()
      // Handle new API response format
      if (response.data && response.data.success) {
        cpmkList.value = response.data.data
      } else {
        cpmkList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching CPMK:', err)
      error.value = 'Gagal memuat data Capaian Pembelajaran Mata Kuliah'
      
      // Fallback data sesuai dengan format baru
      cpmkList.value = [
        { 
          id_cpmk: "CPMK001",
          deskripsi: "Mampu menerapkan struktur data dasar.",
          id_cpl: "CPL001"
        },
        { 
          id_cpmk: "CPMK002",
          deskripsi: "Mampu memahami konsep pemrograman berorientasi objek.",
          id_cpl: "CPL001"
        },
        { 
          id_cpmk: "CPMK003",
          deskripsi: "Mampu membuat diagram alir dan pseudocode.",
          id_cpl: "CPL001"
        },
        { 
          id_cpmk: "CPMK004",
          deskripsi: "Mampu merancang antarmuka pengguna.",
          id_cpl: "CPL002"
        },
        { 
          id_cpmk: "CPMK005",
          deskripsi: "Mampu mengidentifikasi kebutuhan sistem.",
          id_cpl: "CPL002"
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCPMKById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getCPMKById(id)
      currentCPMK.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching CPMK with id ${id}:`, err)
      error.value = 'Gagal memuat detail CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createCPMK(cpmkData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await addCPMK(cpmkData)
      // Refresh list after adding
      await fetchAllCPMK()
      return response.data
    } catch (err) {
      console.error('Error creating CPMK:', err)
      error.value = 'Gagal menambahkan CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editCPMK(id, cpmkData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updateCPMK(id, cpmkData)
      // Refresh list after updating
      await fetchAllCPMK()
      return response.data
    } catch (err) {
      console.error(`Error updating CPMK with id ${id}:`, err)
      error.value = 'Gagal memperbarui CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeCPMK(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deleteCPMK(id)
      // Remove from local list - sesuaikan dengan id_cpmk
      cpmkList.value = cpmkList.value.filter(cpmk => cpmk.id_cpmk !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting CPMK with id ${id}:`, err)
      error.value = 'Gagal menghapus CPMK'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    cpmkList,
    currentCPMK,
    isLoading,
    error,
    fetchAllCPMK,
    fetchCPMKById,
    createCPMK,
    editCPMK,
    removeCPMK
  }
})
