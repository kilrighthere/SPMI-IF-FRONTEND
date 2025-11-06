import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getAllKurikulumMk, createKurikulumMk, updateKurikulumMk, deleteKurikulumMk } from '@/api'

export const useKurikulumMkStore = defineStore('kurikulumMk', () => {
  // State
  const kurikulumMkList = ref([])
  const loading = ref(false)
  const error = ref(null)

  // Getters
  const getKurikulumMkByKurikulum = computed(() => {
    return (idKurikulum) => kurikulumMkList.value.filter(item => item.id_kurikulum === idKurikulum)
  })

  const totalKurikulumMk = computed(() => kurikulumMkList.value.length)

  // Actions
  async function fetchKurikulumMk() {
    loading.value = true
    error.value = null
    
    try {
      const response = await getAllKurikulumMk()
      kurikulumMkList.value = response.data.data || response.data || []
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal memuat data kurikulum mata kuliah'
      console.error('Error fetching kurikulum mk:', err)
    } finally {
      loading.value = false
    }
  }

  async function addKurikulumMk(kurikulumMkData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await createKurikulumMk(kurikulumMkData)
      const newKurikulumMk = response.data.data || response.data
      kurikulumMkList.value.push(newKurikulumMk)
      return { success: true, data: newKurikulumMk }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal menambah kurikulum mata kuliah'
      console.error('Error adding kurikulum mk:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function editKurikulumMk(id, kurikulumMkData) {
    loading.value = true
    error.value = null
    
    try {
      const response = await updateKurikulumMk(id, kurikulumMkData)
      const updatedKurikulumMk = response.data.data || response.data
      
      const index = kurikulumMkList.value.findIndex(item => item.id === id)
      if (index !== -1) {
        kurikulumMkList.value[index] = updatedKurikulumMk
      }
      
      return { success: true, data: updatedKurikulumMk }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal mengubah kurikulum mata kuliah'
      console.error('Error updating kurikulum mk:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  async function removeKurikulumMk(id) {
    loading.value = true
    error.value = null
    
    try {
      await deleteKurikulumMk(id)
      kurikulumMkList.value = kurikulumMkList.value.filter(item => item.id !== id)
      return { success: true }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal menghapus kurikulum mata kuliah'
      console.error('Error deleting kurikulum mk:', err)
      return { success: false, error: error.value }
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    // State
    kurikulumMkList,
    loading,
    error,
    
    // Getters
    getKurikulumMkByKurikulum,
    totalKurikulumMk,
    
    // Actions
    fetchKurikulumMk,
    addKurikulumMk,
    editKurikulumMk,
    removeKurikulumMk,
    clearError
  }
})