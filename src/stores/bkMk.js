import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getBkMkList, addBkMk, deleteBkMk, getBKList, getMKList } from '@/api'

export const useBkMkStore = defineStore('bkMk', () => {
  const items = ref([])
  const bkList = ref([])
  const mkList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const itemsWithDetails = computed(() => {
    return items.value.map(item => {
      const bk = bkList.value.find(b => b.id_bk === item.id_bk)
      const mk = mkList.value.find(m => m.kode_mk === item.id_mk)
      return {
        ...item,
        bk: bk || { kode_bk: 'N/A', nama_bk: 'Tidak Ditemukan' },
        mk: mk || { kode_mk: 'N/A', nama_mk: 'Tidak Ditemukan' }
      }
    })
  })

  async function fetchAll() {
    isLoading.value = true
    error.value = null
    try {
      const [bkMkResponse, bkResponse, mkResponse] = await Promise.all([
        getBkMkList(),
        getBKList(),
        getMKList()
      ]);

      items.value = bkMkResponse.data?.data || bkMkResponse.data || []
      bkList.value = bkResponse.data?.data || bkResponse.data || []
      mkList.value = mkResponse.data?.data || mkResponse.data || []

    } catch (err) {
      console.error('Error fetching BK-MK data:', err)
      error.value = 'Gagal memuat data korelasi BK-MK.'
    } finally {
      isLoading.value = false
    }
  }

  async function create(data) {
    isLoading.value = true
    error.value = null
    try {
      await addBkMk(data)
      await fetchAll() // Refresh all data
    } catch (err) {
      console.error('Error creating BK-MK:', err)
      error.value = 'Gagal menambahkan korelasi.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  async function remove(id_bk, id_mk) {
    isLoading.value = true
    error.value = null
    try {
      await deleteBkMk(id_bk, id_mk)
      // Refresh data locally without hitting the server again
      items.value = items.value.filter((item) => !(item.id_bk === id_bk && item.id_mk === id_mk))
    } catch (err) {
      console.error('Error deleting BK-MK:', err)
      error.value = 'Gagal menghapus korelasi.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    items,
    bkList,
    mkList,
    isLoading,
    error,
    itemsWithDetails, // Expose the new computed property
    fetchAll,
    create,
    remove,
  }
})
