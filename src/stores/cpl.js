import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCPLList, getCPLById, addCPL, updateCPL, deleteCPL } from '@/api'

export const useCPLStore = defineStore('cpl', () => {
  const cplList = ref([])
  const currentCPL = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllCPL() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getCPLList()
      // Handle new API response format
      if (response.data && response.data.success) {
        cplList.value = response.data.data
      } else {
        cplList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching CPL:', err)
      error.value = 'Gagal memuat data Capaian Pembelajaran Lulusan'
      
      // Fallback data sesuai format API
      cplList.value = [
        {
          id_cpl: 'CPL001',
          deskripsi: 'Mampu menguasai konsep dasar matematika dan algoritma.',
          id_pl: 'PL001'
        },
        {
          id_cpl: 'CPL002',
          deskripsi: 'Mampu merancang solusi sistem informasi berbasis teknologi.',
          id_pl: 'PL001'
        },
        {
          id_cpl: 'CPL003',
          deskripsi: 'Mampu mengimplementasikan perangkat lunak sesuai spesifikasi.',
          id_pl: 'PL001'
        },
        {
          id_cpl: 'CPL004',
          deskripsi: 'Mampu menganalisis dan menginterpretasi data kompleks.',
          id_pl: 'PL001'
        },
        {
          id_cpl: 'CPL005',
          deskripsi: 'Mampu beradaptasi dengan teknologi baru dan belajar mandiri.',
          id_pl: 'PL001'
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCPLById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getCPLById(id)
      currentCPL.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching CPL with id ${id}:`, err)
      error.value = 'Gagal memuat detail CPL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createCPL(cplData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await addCPL(cplData)
      // Refresh list after adding
      await fetchAllCPL()
      return response.data
    } catch (err) {
      console.error('Error creating CPL:', err)
      error.value = 'Gagal menambahkan CPL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editCPL(id, cplData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updateCPL(id, cplData)
      // Refresh list after updating
      await fetchAllCPL()
      return response.data
    } catch (err) {
      console.error(`Error updating CPL with id ${id}:`, err)
      error.value = 'Gagal memperbarui CPL'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeCPL(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deleteCPL(id)
      // Remove from local list - sesuaikan dengan id_cpl
      cplList.value = cplList.value.filter(cpl => cpl.id_cpl !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting CPL with id ${id}:`, err)
      error.value = 'Gagal menghapus CPL'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    cplList,
    currentCPL,
    isLoading,
    error,
    fetchAllCPL,
    fetchCPLById,
    createCPL,
    editCPL,
    removeCPL
  }
})
