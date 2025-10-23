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
      // Handle new API response format
      if (response.data && response.data.success) {
        // Map API data format to our internal format
        mataKuliahList.value = response.data.data.map(item => ({
          id: item.kode_mk || item.id,
          kode: item.kode_mk,
          nama: item.nama_mk,
          sks: item.sks || 0
        }))
      } else if (Array.isArray(response.data)) {
        mataKuliahList.value = response.data.map(item => ({
          id: item.kode_mk || item.id,
          kode: item.kode_mk,
          nama: item.nama_mk,
          sks: item.sks || 0
        }))
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
        id: 'IF2110', 
        kode: 'IF2110', 
        nama: 'Algoritma dan Pemrograman',
        sks: 4
      },
      { 
        id: 'IF2120', 
        kode: 'IF2120', 
        nama: 'Struktur Data',
        sks: 4
      },
      { 
        id: 'IF2130', 
        kode: 'IF2130', 
        nama: 'Sistem Basis Data',
        sks: 3
      },
      { 
        id: 'IF2140', 
        kode: 'IF2140', 
        nama: 'Rekayasa Perangkat Lunak',
        sks: 3
      },
      { 
        id: 'IF2150', 
        kode: 'IF2150', 
        nama: 'Pemrograman Web',
        sks: 3
      },
      { 
        id: 'IF2160', 
        kode: 'IF2160', 
        nama: 'Pemrograman Berorientasi Objek',
        sks: 3
      },
      { 
        id: 'IF2170', 
        kode: 'IF2170', 
        nama: 'Keamanan Informasi',
        sks: 3
      },
      { 
        id: 'IF2180', 
        kode: 'IF2180', 
        nama: 'Pengembangan Aplikasi Mobile',
        sks: 3
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
          nama: item.nama,
          sks: item.sks || 0
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
      // Format data for API
      const apiData = {
        kode_mk: mkData.kode,
        nama: mkData.nama,
        sks: mkData.sks
      };
      
      const response = await addMK(apiData)
      // Refresh list after adding
      await fetchAllMK()
      return response.data
    } catch (err) {
      console.error('Error creating Mata Kuliah:', err)
      error.value = 'Gagal menambahkan Mata Kuliah'
      
      // Add to local list if in development/offline mode
      if (import.meta.env.DEV) {
        const newMk = {
          id: mkData.kode,
          kode: mkData.kode,
          nama: mkData.nama,
          sks: mkData.sks || 0
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
      // Format data for API
      const apiData = {
        kode_mk: mkData.kode || id,
        nama: mkData.nama,
        sks: mkData.sks
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
