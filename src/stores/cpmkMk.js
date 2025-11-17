import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCpmkMkList, addCpmkMk, updateCpmkMk, deleteCpmkMk, getCPMKList, getMKList } from '@/api'

export const useCpmkMkStore = defineStore('cpmkMk', () => {
  const items = ref([])
  const cpmkList = ref([])
  const mkList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      const response = await getCpmkMkList()
      if (response.data && response.data.success) {
        items.value = response.data.data
      } else {
        items.value = response.data
      }
    } catch (err) {
      console.error('Error fetching CPMK-MK list:', err)
      error.value = 'Gagal memuat data korelasi CPMK-MK.'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCpmkList() {
    try {
      const response = await getCPMKList()
      if (response.data && response.data.success) {
        cpmkList.value = response.data.data
      } else {
        cpmkList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching CPMK list:', err)
    }
  }

  async function fetchMkList() {
    try {
      const response = await getMKList()
      if (response.data && response.data.success) {
        mkList.value = response.data.data
      } else {
        mkList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching MK list:', err)
    }
  }

  async function create(data) {
    isLoading.value = true
    error.value = null
    try {
      await addCpmkMk(data)
      await fetchAll() // Refresh list
    } catch (err) {
      console.error('Error creating CPMK-MK:', err)
      error.value = 'Gagal menambahkan korelasi.'
    } finally {
      isLoading.value = false
    }
  }

  async function edit(id_cpmk, id_mk, data) {
    isLoading.value = true
    error.value = null
    try {
      await updateCpmkMk(id_cpmk, id_mk, data)
      await fetchAll() // Refresh list
    } catch (err) {
      console.error(`Error updating CPMK-MK:`, err)
      error.value = 'Gagal memperbarui korelasi.'
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id_cpmk, id_mk) {
    isLoading.value = true
    error.value = null
    try {
      await deleteCpmkMk(id_cpmk, id_mk)
      items.value = items.value.filter(item => !(item.id_cpmk === id_cpmk && item.id_mk === id_mk))
    } catch (err) {
      console.error(`Error deleting CPMK-MK:`, err)
      error.value = 'Gagal menghapus korelasi.'
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    cpmkList,
    mkList,
    isLoading,
    error,
    fetchAll,
    fetchCpmkList,
    fetchMkList,
    create,
    edit,
    remove
  }
})
