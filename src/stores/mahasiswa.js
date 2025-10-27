import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMahasiswaList, addMahasiswa, updateMahasiswa, deleteMahasiswa } from '@/api'

export const useMahasiswaStore = defineStore('mahasiswa', () => {
  const mahasiswaList = ref([])
  const currentMahasiswa = ref(null)
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

  async function createMahasiswa(mahasiswaData) {
    isLoading.value = true
    error.value = null
    try {
      const response = await addMahasiswa(mahasiswaData)
      await fetchMahasiswa()
      return response.data
    } catch (err) {
      console.error('Error creating mahasiswa:', err)
      error.value = 'Gagal menambahkan mahasiswa'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editMahasiswa(nim, mahasiswaData) {
    isLoading.value = true
    error.value = null
    try {
      const response = await updateMahasiswa(nim, mahasiswaData)
      await fetchMahasiswa()
      return response.data
    } catch (err) {
      console.error(`Error updating mahasiswa with nim ${nim}:`, err)
      error.value = 'Gagal memperbarui mahasiswa'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeMahasiswa(nim) {
    isLoading.value = true
    error.value = null
    try {
      await deleteMahasiswa(nim)
      mahasiswaList.value = mahasiswaList.value.filter((m) => m.nim !== nim)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting mahasiswa with nim ${nim}:`, err)
      error.value = 'Gagal menghapus mahasiswa'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    mahasiswaList,
    currentMahasiswa,
    isLoading,
    error,
    fetchMahasiswa,
    createMahasiswa,
    editMahasiswa,
    removeMahasiswa
  }
})
