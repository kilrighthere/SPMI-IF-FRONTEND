import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getCplSndiktiList,
  getCplSndiktiById,
  addCplSndikti,
  updateCplSndikti,
  deleteCplSndikti,
} from '@/api'

export const useCplSndiktiStore = defineStore('cplSndikti', () => {
  const cplSndiktiList = ref([])
  const currentCplSndikti = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllCplSndikti() {
    isLoading.value = true
    error.value = null

    try {
      const response = await getCplSndiktiList()
      // Handle new API response format
      if (response.data && response.data.success) {
        cplSndiktiList.value = response.data.data
      } else {
        cplSndiktiList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching CPL SNDIKTI:', err)
      error.value = 'Gagal memuat data CPL SNDIKTI'

      // Fallback data sesuai format API
      cplSndiktiList.value = [
        {
          id_sn: 'KK1',
          aspek: 'Keterampilan Khusus',
          deskripsi:
            'Mampu mengidentifikasi, merumuskan, dan menyelesaikan masalah kompleks di bidang keilmuan secara terukur menggunakan pendekatan/alat yang sesuai (level 6). (Kemnaker SKKNI)',
          id_cpl: 'CPL-08',
        },
        {
          id_sn: 'KK2',
          aspek: 'Keterampilan Khusus',
          deskripsi:
            'Mampu merancang, mengimplementasi, mengelola dan memelihara sistem jaringan komputer dengan memanfaatkan Teknologi Informasi dan Komunikasi (TIK).',
          id_cpl: 'CPL-09',
        },
        {
          id_sn: 'KU1',
          aspek: 'Keterampilan Umum',
          deskripsi:
            'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif dalam konteks pengembangan atau implementasi ilmu pengetahuan dan teknologi.',
          id_cpl: 'CPL-01',
        },
        {
          id_sn: 'P1',
          aspek: 'Pengetahuan',
          deskripsi:
            'Menguasai konsep teoritis bidang pengetahuan tertentu secara umum dan konsep teoritis bagian khusus dalam bidang pengetahuan tersebut secara mendalam.',
          id_cpl: 'CPL-02',
        },
        {
          id_sn: 'S1',
          aspek: 'Sikap',
          deskripsi: 'Bertakwa kepada Tuhan Yang Maha Esa dan mampu menunjukkan sikap religius.',
          id_cpl: 'CPL-03',
        },
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function fetchCplSndiktiById(id) {
    isLoading.value = true
    error.value = null

    try {
      const response = await getCplSndiktiById(id)
      if (response.data && response.data.success) {
        currentCplSndikti.value = response.data.data
      } else {
        currentCplSndikti.value = response.data
      }
      return currentCplSndikti.value
    } catch (err) {
      console.error(`Error fetching CPL SNDIKTI with id ${id}:`, err)
      error.value = 'Gagal memuat detail CPL SNDIKTI'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createCplSndikti(cplSndiktiData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await addCplSndikti(cplSndiktiData)
      // Refresh list after adding
      await fetchAllCplSndikti()
      return response.data
    } catch (err) {
      console.error('Error creating CPL SNDIKTI:', err)
      error.value = 'Gagal menambahkan CPL SNDIKTI'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editCplSndikti(id, cplSndiktiData) {
    isLoading.value = true
    error.value = null

    try {
      const response = await updateCplSndikti(id, cplSndiktiData)
      // Refresh list after updating
      await fetchAllCplSndikti()
      return response.data
    } catch (err) {
      console.error(`Error updating CPL SNDIKTI with id ${id}:`, err)
      error.value = 'Gagal memperbarui CPL SNDIKTI'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeCplSndikti(id) {
    isLoading.value = true
    error.value = null

    try {
      await deleteCplSndikti(id)
      // Remove from local list
      cplSndiktiList.value = cplSndiktiList.value.filter((item) => item.id_sn !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting CPL SNDIKTI with id ${id}:`, err)
      error.value = 'Gagal menghapus CPL SNDIKTI'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    cplSndiktiList,
    currentCplSndikti,
    isLoading,
    error,
    fetchAllCplSndikti,
    fetchCplSndiktiById,
    createCplSndikti,
    editCplSndikti,
    removeCplSndikti,
  }
})
