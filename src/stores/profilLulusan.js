import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPLList, getPLById, addPL, updatePL, deletePL } from '@/api'

export const usePLStore = defineStore('profilLulusan', () => {
  const profilLulusanList = ref([])
  const currentPL = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllPL() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getPLList()
      // Respon API baru: response.data berisi array objek dengan format {id_pl, deskripsi}
      if (response.data && response.data.success) {
        profilLulusanList.value = response.data.data
      } else {
        profilLulusanList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching profil lulusan:', err)
      error.value = 'Gagal memuat data profil lulusan'
      
      // Fallback data jika API belum tersedia - sesuai format response baru
      profilLulusanList.value = [
        {
          id_pl: 'PL-1',
          deskripsi: 'Mampu menerapkan prinsip rekayasa perangkat lunak dalam pengembangan produk.',
        },
        {
          id_pl: 'PL001',
          deskripsi: 'Lulusan yang kompeten dan berdaya saing global dalam bidang Ilmu Komputer.',
        },
        {
          id_pl: 'PL002',
          deskripsi: 'Lulusan yang memiliki kemampuan kewirausahaan berbasis teknologi.',
        },
        {
          id_pl: 'PL003',
          deskripsi: 'Lulusan yang berkontribusi pada pengembangan masyarakat melalui teknologi informasi.',
        }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchPLById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getPLById(id)
      currentPL.value = response.data
      return response.data
    } catch (err) {
      console.error(`Error fetching profil lulusan with id ${id}:`, err)
      error.value = 'Gagal memuat detail profil lulusan'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createPL(plData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await addPL(plData)
      // Refresh list after adding
      await fetchAllPL()
      return response.data
    } catch (err) {
      console.error('Error creating profil lulusan:', err)
      error.value = 'Gagal menambahkan profil lulusan'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editPL(id, plData) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await updatePL(id, plData)
      // Refresh list after updating
      await fetchAllPL()
      return response.data
    } catch (err) {
      console.error(`Error updating profil lulusan with id ${id}:`, err)
      error.value = 'Gagal memperbarui profil lulusan'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removePL(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deletePL(id)
      // Remove from local list - menggunakan id_pl
      profilLulusanList.value = profilLulusanList.value.filter(pl => pl.id_pl !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting profil lulusan with id ${id}:`, err)
      error.value = 'Gagal menghapus profil lulusan'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    profilLulusanList,
    currentPL,
    isLoading,
    error,
    fetchAllPL,
    fetchPLById,
    createPL,
    editPL,
    removePL
  }
})
