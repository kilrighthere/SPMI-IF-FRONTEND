import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNilaiMkList, getMahasiswaList, getMKList, getPeriodeList, addNilaiMk } from '@/api'

export const useNilaiMkStore = defineStore('nilaiMk', () => {
  const nilaiList = ref([])
  const periodeList = ref([]) // daftar periode
  const selectedPeriode = ref('') // periode yang dipilih
  const mahasiswaMap = ref({}) // untuk mapping nim ke nama mahasiswa
  const mataKuliahList = ref([]) // daftar mata kuliah
  const mataKuliahMap = ref({}) // untuk mapping kode_mk ke nama mata kuliah
  const isLoading = ref(false)
  const error = ref(null)

  // Actions untuk inisialisasi (tanpa fetch nilai)
  async function fetchInitialData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Ambil data master yang diperlukan (kecuali nilai)
      const [mahasiswaResponse, mkResponse, periodeResponse] = await Promise.all([
        getMahasiswaList(),
        getMKList(),
        getPeriodeList()
      ])
      
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
          mataKuliahMap.value[mk.kode_mk] = mk.nama_mk
        })
      } else if (mkResponse.data && Array.isArray(mkResponse.data)) {
        // Handle direct array format
        mataKuliahList.value = mkResponse.data
        mataKuliahList.value.forEach(mk => {
          mataKuliahMap.value[mk.kode_mk] = mk.nama_mk
        })
      }
      
      // Handle API response untuk periode
      if (periodeResponse.data && periodeResponse.data.success) {
        periodeList.value = periodeResponse.data.data
        // Jangan set default periode - biarkan user memilih
      } else if (periodeResponse.data && Array.isArray(periodeResponse.data)) {
        periodeList.value = periodeResponse.data
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

  // Fetch nilai berdasarkan filter
  async function fetchNilaiByFilter(filters = {}) {
    isLoading.value = true
    error.value = null
    
    try {
      const nilaiResponse = await getNilaiMkList(filters)
      
      // Handle API response untuk nilai MK
      if (nilaiResponse.data && nilaiResponse.data.success) {
        nilaiList.value = nilaiResponse.data.data
      } else {
        nilaiList.value = nilaiResponse.data || []
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal mengambil data nilai'
      console.error('Error fetching nilai:', err)
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

  // Utility functions
  function formatNilai(nilai) {
    const num = parseFloat(nilai)
    return isNaN(num) ? '0.00' : num.toFixed(2)
  }

  function getHurufMutu(nilai) {
    const num = parseFloat(nilai)
    if (isNaN(num)) return '-'
    
    if (num >= 85) return 'A'
    else if (num >= 80) return 'A-'
    else if (num >= 75) return 'B+'
    else if (num >= 70) return 'B'
    else if (num >= 65) return 'B-'
    else if (num >= 60) return 'C+'
    else if (num >= 55) return 'C'
    else if (num >= 50) return 'C-'
    else if (num >= 45) return 'D+'
    else if (num >= 40) return 'D'
    else return 'E'
  }

  // Computed untuk nilai yang sudah difilter dari backend
  const filteredNilaiByPeriode = computed(() => {
    return nilaiList.value
  })

  // Action untuk menambah nilai
  async function createNilai(nilaiData) {
    isLoading.value = true
    error.value = null
    
    try {
      const apiData = {
        id_periode: nilaiData.id_periode,
        kode_mk: nilaiData.kode_mk,
        nim: nilaiData.nim,
        nilai_akhir: parseFloat(nilaiData.nilai_akhir)
      }
      
      console.log('Creating nilai with data:', apiData)
      const response = await addNilaiMk(apiData)
      console.log('API response:', response)
      
      // Refresh data after adding
      await fetchAllData()
      
      if (response.data && response.data.success) {
        return { success: true, data: response.data.data }
      }
      return response.data
    } catch (err) {
      console.error('Error creating nilai:', err)
      console.error('Error details:', err.response?.data || err.message)
      error.value = 'Gagal menambahkan nilai: ' + (err.response?.data?.message || err.message)
      return null
    } finally {
      isLoading.value = false
    }
  }

  // Action untuk set periode yang dipilih
  function setPeriode(periode) {
    selectedPeriode.value = periode
  }

  // Action untuk fetch dengan filter periode dan mata kuliah
  async function fetchWithFilters(filters) {
    await fetchNilaiByFilter(filters)
  }

  // Fetch hanya periode list
  async function fetchPeriodeList() {
    isLoading.value = true
    error.value = null
    
    try {
      const periodeResponse = await getPeriodeList()
      
      if (periodeResponse.data && periodeResponse.data.success) {
        periodeList.value = periodeResponse.data.data
      } else if (periodeResponse.data && Array.isArray(periodeResponse.data)) {
        periodeList.value = periodeResponse.data
      }
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal mengambil data periode'
      console.error('Error fetching periode:', err)
    } finally {
      isLoading.value = false
    }
  }

  // Fetch hanya data mahasiswa untuk mapping
  async function fetchMahasiswaData() {
    try {
      const mahasiswaResponse = await getMahasiswaList()
      
      if (mahasiswaResponse.data && mahasiswaResponse.data.success) {
        const mahasiswaData = mahasiswaResponse.data.data
        mahasiswaData.forEach(mhs => {
          mahasiswaMap.value[mhs.nim] = mhs.nama
        })
      }
    } catch (err) {
      console.error('Error fetching mahasiswa:', err)
      // Fallback data jika API error
      mahasiswaMap.value = {
        '24060120140001': 'Nurul Saputra',
        '24060120140002': 'Dewi Wijaya'
      }
    }
  }

  return {
    nilaiList,
    periodeList,
    selectedPeriode,
    filteredNilaiByPeriode,
    mahasiswaMap,
    mataKuliahMap,
    mataKuliahList,
    mataKuliahDenganNilai,
    isLoading,
    error,
    fetchInitialData,
    fetchNilaiByFilter,
    fetchWithFilters,
    fetchPeriodeList,
    fetchMahasiswaData,
    createNilai,
    setPeriode,
    formatNilai,
    getHurufMutu,
    getMahasiswaNama,
    getMataKuliahNama,
    getNilaiByMataKuliah
  }
})