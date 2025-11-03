import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getKurikulumList,
  getKurikulumById,
  addKurikulum,
  updateKurikulum,
  deleteKurikulum,
} from '@/api'

export const useKurikulumStore = defineStore('kurikulum', () => {
  const kurikulumList = ref([])
  const currentKurikulum = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllKurikulum() {
    isLoading.value = true
    error.value = null

    try {
      const response = await getKurikulumList()
      // Handle new API response format
      if (response.data && response.data.success) {
        kurikulumList.value = response.data.data
      } else {
        kurikulumList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching kurikulum:', err)
      error.value = 'Gagal memuat data kurikulum'

      // Fallback data sesuai format API
      kurikulumList.value = [
        {
          id_kurikulum: '2020',
          nama: 'Kurikulum 2020',
          tahun_berlaku: '2020',
          min_sks: 144,
        },
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchKurikulumById(id) {
    isLoading.value = true
    error.value = null

    try {
      const response = await getKurikulumById(id)
      if (response.data && response.data.success) {
        currentKurikulum.value = response.data.data
      } else {
        currentKurikulum.value = response.data
      }
      return currentKurikulum.value
    } catch (err) {
      console.error(`Error fetching kurikulum with id ${id}:`, err)
      error.value = 'Gagal memuat detail kurikulum'

      // Fallback data
      currentKurikulum.value = {
        id_kurikulum: id,
        nama: 'Kurikulum 2020',
        tahun_berlaku: '2020',
        min_sks: 144,
      }
      return currentKurikulum.value
    } finally {
      isLoading.value = false
    }
  }

  async function createKurikulum(kurikulumData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await addKurikulum(kurikulumData)
      // Refresh list after adding
      await fetchAllKurikulum()
      return response.data
    } catch (err) {
      console.error('Error creating kurikulum:', err)
      error.value = 'Gagal menambahkan kurikulum'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editKurikulum(id, kurikulumData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await updateKurikulum(id, kurikulumData)
      // Refresh list after updating
      await fetchAllKurikulum()
      return response.data
    } catch (err) {
      console.error(`Error updating kurikulum with id ${id}:`, err)
      error.value = 'Gagal memperbarui kurikulum'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeKurikulum(id) {
    isLoading.value = true
    error.value = null

    try {
      await deleteKurikulum(id)
      // Remove from local list
      kurikulumList.value = kurikulumList.value.filter((k) => k.id_kurikulum !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting kurikulum with id ${id}:`, err)
      error.value = 'Gagal menghapus kurikulum'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    kurikulumList,
    currentKurikulum,
    isLoading,
    error,
    fetchAllKurikulum,
    fetchKurikulumById,
    createKurikulum,
    editKurikulum,
    removeKurikulum,
  }
})
