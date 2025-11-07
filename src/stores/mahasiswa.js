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
      
      // Extract specific error message from API response
      let errorMessage = 'Gagal memuat data mahasiswa'
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const serverMessage = err.response.data?.message || err.response.data?.error
        
        switch (status) {
          case 401:
            errorMessage = 'Sesi Anda telah berakhir. Silakan login kembali'
            break
          case 403:
            errorMessage = 'Anda tidak memiliki akses untuk melihat data mahasiswa'
            break
          case 404:
            errorMessage = 'Endpoint data mahasiswa tidak ditemukan'
            break
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Silakan refresh halaman'
            break
          default:
            errorMessage = serverMessage || `Gagal memuat data mahasiswa (Error ${status})`
        }
      } else if (err.request) {
        // Network error or no response
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
      } else {
        // Other errors
        errorMessage = err.message || 'Terjadi kesalahan yang tidak diketahui'
      }
      
      error.value = errorMessage
      
      // Fallback data hanya jika bukan error autentikasi
      if (!err.response || err.response.status !== 401) {
        mahasiswaList.value = [
          { nim: '24060120140001', nama: 'Nurul Saputra' },
          { nim: '24060120140002', nama: 'Dewi Wijaya' }
        ]
      }
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
      return { success: true, data: response.data }
    } catch (err) {
      console.error('Error creating mahasiswa:', err)
      
      // Extract specific error message from API response
      let errorMessage = 'Gagal menambahkan mahasiswa'
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const serverMessage = err.response.data?.message || err.response.data?.error
        
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Data yang dimasukkan tidak valid'
            break
          case 401:
            errorMessage = 'Anda tidak memiliki akses untuk menambahkan mahasiswa'
            break
          case 403:
            errorMessage = 'Akses ditolak. Hubungi administrator'
            break
          case 409:
            errorMessage = serverMessage || 'NIM sudah terdaftar'
            break
          case 422:
            errorMessage = serverMessage || 'Data tidak sesuai format yang diharapkan'
            break
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi'
            break
          default:
            errorMessage = serverMessage || `Gagal menambahkan mahasiswa (Error ${status})`
        }
      } else if (err.request) {
        // Network error or no response
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
      } else {
        // Other errors
        errorMessage = err.message || 'Terjadi kesalahan yang tidak diketahui'
      }
      
      error.value = errorMessage
      return { success: false, error: errorMessage }
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
      return { success: true, data: response.data }
    } catch (err) {
      console.error(`Error updating mahasiswa with nim ${nim}:`, err)
      
      // Extract specific error message from API response
      let errorMessage = 'Gagal memperbarui mahasiswa'
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const serverMessage = err.response.data?.message || err.response.data?.error
        
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Data yang dimasukkan tidak valid'
            break
          case 401:
            errorMessage = 'Anda tidak memiliki akses untuk memperbarui mahasiswa'
            break
          case 403:
            errorMessage = 'Akses ditolak. Hubungi administrator'
            break
          case 404:
            errorMessage = 'Data mahasiswa tidak ditemukan'
            break
          case 422:
            errorMessage = serverMessage || 'Data tidak sesuai format yang diharapkan'
            break
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi'
            break
          default:
            errorMessage = serverMessage || `Gagal memperbarui mahasiswa (Error ${status})`
        }
      } else if (err.request) {
        // Network error or no response
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
      } else {
        // Other errors
        errorMessage = err.message || 'Terjadi kesalahan yang tidak diketahui'
      }
      
      error.value = errorMessage
      return { success: false, error: errorMessage }
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
      
      // Extract specific error message from API response
      let errorMessage = 'Gagal menghapus mahasiswa'
      
      if (err.response) {
        // Server responded with error status
        const status = err.response.status
        const serverMessage = err.response.data?.message || err.response.data?.error
        
        switch (status) {
          case 400:
            errorMessage = serverMessage || 'Permintaan tidak valid'
            break
          case 401:
            errorMessage = 'Anda tidak memiliki akses untuk menghapus mahasiswa'
            break
          case 403:
            errorMessage = 'Akses ditolak. Hubungi administrator'
            break
          case 404:
            errorMessage = 'Data mahasiswa tidak ditemukan'
            break
          case 409:
            errorMessage = serverMessage || 'Mahasiswa tidak dapat dihapus karena masih memiliki data terkait'
            break
          case 500:
            errorMessage = 'Terjadi kesalahan pada server. Silakan coba lagi'
            break
          default:
            errorMessage = serverMessage || `Gagal menghapus mahasiswa (Error ${status})`
        }
      } else if (err.request) {
        // Network error or no response
        errorMessage = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda'
      } else {
        // Other errors
        errorMessage = err.message || 'Terjadi kesalahan yang tidak diketahui'
      }
      
      error.value = errorMessage
      return { success: false, error: errorMessage }
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
