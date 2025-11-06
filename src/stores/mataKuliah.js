import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMKList, getMKById, addMK, updateMK, deleteMK } from '@/api'

export const useMKStore = defineStore('mataKuliah', () => {
  const mataKuliahList = ref([])
  const currentMK = ref(null)
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllMK() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getMKList()
      // Handle API response format
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // New API format with nested data
        mataKuliahList.value = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array format
        mataKuliahList.value = response.data
      } else {
        console.warn('Unexpected response format:', response.data)
        // Handle unexpected format, use fallback data
        useFallbackData()
      }
    } catch (err) {
      console.error('Error fetching Mata Kuliah:', err)
      error.value = 'Gagal memuat data Mata Kuliah'
      useFallbackData()
    } finally {
      isLoading.value = false
    }
  }
  
  // Helper function to use fallback data
  function useFallbackData() {
    console.log('Using fallback data for Mata Kuliah')
    mataKuliahList.value = [
      { 
        id: 'MKE401', 
        kode: 'MKE401', 
        nama: 'Sistem Informasi Manajemen',
        deskripsi: null
      },
      { 
        id: 'IF2110', 
        kode: 'IF2110', 
        nama: 'Algoritma dan Pemrograman',
        deskripsi: 'Mata kuliah tentang dasar-dasar algoritma dan pemrograman'
      },
      { 
        id: 'IF2120', 
        kode: 'IF2120', 
        nama: 'Struktur Data',
        deskripsi: 'Mata kuliah tentang struktur data dan implementasinya'
      },
      { 
        id: 'IF2130', 
        kode: 'IF2130', 
        nama: 'Sistem Basis Data',
        deskripsi: 'Mata kuliah tentang desain dan implementasi basis data'
      },
      { 
        id: 'IF2140', 
        kode: 'IF2140', 
        nama: 'Rekayasa Perangkat Lunak',
        deskripsi: 'Mata kuliah tentang metodologi pengembangan perangkat lunak'
      }
    ]
  }

  async function fetchMKById(id) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getMKById(id)
      if (response.data && response.data.success) {
        const item = response.data.data;
        // Map API data format to our internal format
        currentMK.value = {
          id: item.kode_mk || item.id,
          kode: item.kode_mk,
          nama: item.nama_mk,
          deskripsi: item.deskripsi
        }
      } else {
        currentMK.value = response.data;
      }
      return currentMK.value;
    } catch (err) {
      console.error(`Error fetching Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal memuat detail Mata Kuliah'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function createMK(mkData) {
    isLoading.value = true
    error.value = null
    
    try {
      // Format data for API - handle both old and new format
      const apiData = {
        kode_mk: mkData.kode_mk || mkData.kode,
        nama_mk: mkData.nama_mk || mkData.nama,
        deskripsi: mkData.deskripsi || '-'
      };
      
      console.log('Creating MK with API data:', apiData)
      const response = await addMK(apiData)
      console.log('API response:', response)
      
      // Refresh list after adding
      await fetchAllMK()
      
      // Return the success response
      if (response.data && response.data.success) {
        return { success: true, data: response.data.data }
      }
      return response.data
    } catch (err) {
      console.error('Error creating Mata Kuliah:', err)
      console.error('Error details:', err.response?.data || err.message)
      error.value = 'Gagal menambahkan Mata Kuliah: ' + (err.response?.data?.message || err.message)
      
      // Add to local list if in development/offline mode
      if (import.meta.env.DEV) {
        const newMk = {
          id: mkData.kode_mk || mkData.kode,
          kode_mk: mkData.kode_mk || mkData.kode,
          nama_mk: mkData.nama_mk || mkData.nama,
          deskripsi: mkData.deskripsi || '-'
        };
        mataKuliahList.value.push(newMk);
        return { success: true, data: newMk };
      }
      
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editMK(id, mkData) {
    isLoading.value = true
    error.value = null
    
    try {
      // Format data for API - handle both old and new format
      const apiData = {
        kode_mk: mkData.kode_mk || mkData.kode || id,
        nama_mk: mkData.nama_mk || mkData.nama,
        deskripsi: mkData.deskripsi || '-'
      };
      
      const response = await updateMK(id, apiData)
      // Refresh list after updating
      await fetchAllMK()
      return response.data
    } catch (err) {
      console.error(`Error updating Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal memperbarui Mata Kuliah'
      
      // Update local list if in development/offline mode
      if (import.meta.env.DEV) {
        const index = mataKuliahList.value.findIndex(item => item.id === id);
        if (index !== -1) {
          mataKuliahList.value[index] = { 
            ...mataKuliahList.value[index], 
            ...mkData 
          };
          return { success: true, data: mataKuliahList.value[index] };
        }
      }
      
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeMK(id) {
    isLoading.value = true
    error.value = null
    
    try {
      await deleteMK(id)
      // Remove from local list
      mataKuliahList.value = mataKuliahList.value.filter(mk => mk.id !== id)
      return { success: true }
    } catch (err) {
      console.error(`Error deleting Mata Kuliah with id ${id}:`, err)
      error.value = 'Gagal menghapus Mata Kuliah'
      
      // Still remove from local list if in development/offline mode
      if (import.meta.env.DEV) {
        mataKuliahList.value = mataKuliahList.value.filter(mk => mk.id !== id)
        return { success: true }
      }
      
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  return {
    mataKuliahList,
    currentMK,
    isLoading,
    error,
    fetchAllMK,
    fetchMKById,
    createMK,
    editMK,
    removeMK
  }
})
