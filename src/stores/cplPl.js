import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCPLList, getPLList, addCplPl, getCplPlList, deleteCplPl } from '@/api'

export const useCplPlStore = defineStore('cplPl', () => {
  const cplList = ref([])
  const plList = ref([])
  const cplPlRelations = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed untuk membuat data untuk tabel matriks
  const matrixData = computed(() => {
    const matrix = {}
    
    // Inisialisasi matriks kosong
    cplList.value.forEach(cpl => {
      matrix[cpl.id_cpl] = {}
      plList.value.forEach(pl => {
        matrix[cpl.id_cpl][pl.kode_pl] = false
      })
    })
    
    // Isi matriks berdasarkan relasi
    cplPlRelations.value.forEach(relation => {
      if (matrix[relation.id_cpl]) {
        matrix[relation.id_cpl][relation.id_pl] = true
      }
    })
    
    return matrix
  })

  // Actions
  async function fetchAllData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Ambil semua data yang diperlukan untuk halaman ini
      const [cplResponse, plResponse, relationResponse] = await Promise.all([
        getCPLList(),
        getPLList(),
        getCplPlList()
      ])
      
      // Handle API response format
      if (cplResponse.data && cplResponse.data.success) {
        cplList.value = cplResponse.data.data
      } else {
        cplList.value = cplResponse.data || []
      }
      
      if (plResponse.data && plResponse.data.success) {
        plList.value = plResponse.data.data
      } else {
        plList.value = plResponse.data || []
      }
      
      if (relationResponse.data && relationResponse.data.success) {
        cplPlRelations.value = relationResponse.data.data
      } else {
        cplPlRelations.value = relationResponse.data || []
      }
    } catch (err) {
      console.error('Error fetching CPL-PL data:', err)
      error.value = 'Gagal memuat data korelasi CPL-PL'
      
      // Fallback data
      cplList.value = [
        { id_cpl: 'CPL-01', deskripsi: 'Bertakwa kepada Tuhan YME, menjunjung tinggi nilai kemanusiaan, etika, dan berperan aktif sebagai warga negara yang menjunjung Pancasila.' },
        { id_cpl: 'CPL-02', deskripsi: 'Mampu menerapkan konsep dasar matematika dan algoritma dalam pengembangan perangkat lunak.' },
        { id_cpl: 'CPL-03', deskripsi: 'Mampu merancang dan mengembangkan aplikasi berbasis web dengan metode yang sistematis.' }
      ]
      
      plList.value = [
        { kode_pl: 'PL-01', deskripsi: 'Software Developer' },
        { kode_pl: 'PL-02', deskripsi: 'Data Scientist' },
        { kode_pl: 'PL-03', deskripsi: 'System Analyst' }
      ]
      
      cplPlRelations.value = [
        { id_cpl: 'CPL-01', id_pl: 'PL-01' },
        { id_cpl: 'CPL-02', id_pl: 'PL-01' },
        { id_cpl: 'CPL-02', id_pl: 'PL-02' },
        { id_cpl: 'CPL-03', id_pl: 'PL-01' },
        { id_cpl: 'CPL-03', id_pl: 'PL-03' }
      ]
    } finally {
      isLoading.value = false
    }
  }

  async function toggleRelation(cplId, plId, isChecked) {
    isLoading.value = true
    error.value = null
    
    try {
      if (isChecked) {
        // Tambah relasi
        await addCplPl({ id_cpl: cplId, id_pl: plId })
        cplPlRelations.value.push({ id_cpl: cplId, id_pl: plId })
      } else {
        // Hapus relasi
        await deleteCplPl(cplId, plId)
        cplPlRelations.value = cplPlRelations.value.filter(
          relation => !(relation.id_cpl === cplId && relation.id_pl === plId)
        )
      }
      return true
    } catch (err) {
      console.error(`Error ${isChecked ? 'adding' : 'removing'} CPL-PL relation:`, err)
      error.value = `Gagal ${isChecked ? 'menambahkan' : 'menghapus'} relasi CPL-PL`
      return false
    } finally {
      isLoading.value = false
    }
  }

  return {
    cplList,
    plList,
    cplPlRelations,
    matrixData,
    isLoading,
    error,
    fetchAllData,
    toggleRelation
  }
})