import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMahasiswaList } from '@/api'

export const useMahasiswaStore = defineStore('mahasiswa', () => {
  const mahasiswaList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  async function fetchMahasiswa() {
    isLoading.value = true
    error.value = null
    try {
      const response = await getMahasiswaList()
      if (response.data && response.data.success) {
        mahasiswaList.value = response.data.data
      } else {
        // Fallback for inconsistent API response
        mahasiswaList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching mahasiswa:', err)
      error.value = 'Gagal memuat data mahasiswa'
      // Fallback data
      mahasiswaList.value = [
        { nim: '24060120140001', nama: 'Nurul Saputra' },
        { nim: '24060120140002', nama: 'Dewi Wijaya' }
      ]
    } finally {
      isLoading.value = false
    }
  }

  return {
    mahasiswaList,
    isLoading,
    error,
    fetchMahasiswa
  }
})
