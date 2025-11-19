import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCplBkList, getCPLList, getBKList, updateCplBk as apiUpdateCplBk } from '@/api'

export const useCplBkStore = defineStore('cplBk', () => {
  const items = ref([])
  const cplList = ref([])
  const bkList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      // Fetch CPL list - global
      const cplResponse = await getCPLList()
      cplList.value = cplResponse.data?.data || cplResponse.data

      // Fetch BK list - global
      const bkResponse = await getBKList()
      bkList.value = bkResponse.data?.data || bkResponse.data

      // Fetch CPL-BK relationships - global
      const cplBkResponse = await getCplBkList()
      // Normalize relations: ensure id_cpl and id_bk are strings so frontend matching works
      const rawItems = cplBkResponse.data?.data || cplBkResponse.data || []
      items.value = rawItems.map((r) => ({ id_cpl: String(r.id_cpl), id_bk: String(r.id_bk) }))
    } catch (err) {
      console.error('Error fetching CPL-BK data:', err)
      error.value = 'Gagal memuat data.'
    } finally {
      isLoading.value = false
    }
  }

  async function updateCplBk(data) {
    isLoading.value = true
    error.value = null
    try {
      await apiUpdateCplBk(data)
      // Refresh the relationships after update - now global
      const cplBkResponse = await getCplBkList()
      const rawItems2 = cplBkResponse.data?.data || cplBkResponse.data || []
      items.value = rawItems2.map((r) => ({ id_cpl: String(r.id_cpl), id_bk: String(r.id_bk) }))
    } catch (err) {
      console.error('Error updating CPL-BK:', err)
      error.value = 'Gagal memperbarui korelasi.'
      throw err // re-throw error to be caught in component
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    cplList,
    bkList,
    isLoading,
    error,
    fetchAll,
    updateCplBk
  }
})
