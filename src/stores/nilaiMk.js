import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNilaiMkList, getMahasiswaList, getMKList } from '@/api'

export const useNilaiMkStore = defineStore('nilaiMk', () => {
  const nilaiList = ref([])
  const mahasiswaMap = ref({}) // untuk mapping nim ke nama mahasiswa
  const mataKuliahList = ref([]) // daftar mata kuliah
  const mataKuliahMap = ref({}) // untuk mapping kode_mk ke nama mata kuliah
  const isLoading = ref(false)
  const error = ref(null)

  // Actions
  async function fetchAllData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Ambil semua data yang diperlukan
      const [nilaiResponse, mahasiswaResponse, mkResponse] = await Promise.all([
        getNilaiMkList(),
        getMahasiswaList(),
        getMKList()
      ])
      
      // Handle API response untuk nilai MK
      if (nilaiResponse.data && nilaiResponse.data.success) {
        nilaiList.value = nilaiResponse.data.data
      } else {
        nilaiList.value = nilaiResponse.data || []
      }
      
      // Buat mapping mahasiswa (NIM -> Nama)
      if (mahasiswaResponse.data && mahasiswaResponse.data.success) {
        const mahasiswaData = mahasiswaResponse.data.data
        mahasiswaData.forEach(mhs => {
          mahasiswaMap.value[mhs.nim] = mhs.nama
        })
      }
      
      // Set daftar mata kuliah dan buat mapping kode_mk ke nama MK
      if (mkResponse.data && mkResponse.data.success) {
        mataKuliahList.value = mkResponse.data.data
        mataKuliahList.value.forEach(mk => {
          mataKuliahMap.value[mk.kode_mk] = mk.nama
        })
      }
      
    } catch (err) {
      console.error('Error fetching nilai data:', err)
      error.value = 'Gagal memuat data nilai mata kuliah'
      
      // Fallback data if needed
      nilaiList.value = [
        { id_periode: '20201', kode_mk: 'MKU101', nim: '24060120140001', nilai_akhir: '96.09' },
        { id_periode: '20201', kode_mk: 'MKU101', nim: '24060120140002', nilai_akhir: '85.50' },
        { id_periode: '20201', kode_mk: 'MKU102', nim: '24060120140001', nilai_akhir: '78.25' }
      ]
      
      // Sample mahasiswa mapping
      mahasiswaMap.value = {
        '24060120140001': 'Nurul Saputra',
        '24060120140002': 'Dewi Wijaya'
      }
      
      // Sample mata kuliah mapping
      mataKuliahMap.value = {
        'MKU101': 'Pemrograman Web',
        'MKU102': 'Struktur Data'
      }
    } finally {
      isLoading.value = false
    }
  }

  // Helper untuk mendapatkan nama mahasiswa dari NIM
  function getMahasiswaNama(nim) {
    return mahasiswaMap.value[nim] || nim
  }
  
  // Helper untuk mendapatkan nama mata kuliah dari kode MK
  function getMataKuliahNama(kodeMk) {
    return mataKuliahMap.value[kodeMk] || kodeMk
  }
  
  // Helper untuk mendapatkan semua nilai untuk mata kuliah tertentu
  function getNilaiByMataKuliah(kodeMk) {
    return nilaiList.value.filter(nilai => nilai.kode_mk === kodeMk)
  }
  
  // Computed untuk mendapatkan daftar unik mata kuliah yang memiliki nilai
  const mataKuliahDenganNilai = computed(() => {
    const mkSet = new Set()
    nilaiList.value.forEach(nilai => mkSet.add(nilai.kode_mk))
    
    // Filter mata kuliah yang ada di nilai
    return mataKuliahList.value.filter(mk => mkSet.has(mk.kode_mk))
  })

  return {
    nilaiList,
    mahasiswaMap,
    mataKuliahMap,
    mataKuliahList,
    mataKuliahDenganNilai,
    isLoading,
    error,
    fetchAllData,
    getMahasiswaNama,
    getMataKuliahNama,
    getNilaiByMataKuliah
  }
})