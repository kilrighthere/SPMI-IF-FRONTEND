import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getNilaiMkList, getMahasiswaList, getMKList, getPeriodeList, addNilaiMk, getMkPeriodeList, updateNilaiMk } from '@/api'

export const useNilaiMkStore = defineStore('nilaiMk', () => {
  const nilaiList = ref([])
  const periodeList = ref([]) // daftar periode
  const selectedPeriode = ref('') // periode yang dipilih
  const mahasiswaMap = ref({}) // untuk mapping nim ke nama mahasiswa
  const mataKuliahList = ref([]) // daftar mata kuliah
  const mataKuliahMap = ref({}) // untuk mapping kode_mk ke nama mata kuliah
  const mkPeriodeList = ref([]) // daftar mk-periode (mengandung id_mk_periode, kode_mk, id_periode, sks)
  const mkPeriodeMap = ref({}) // mapping id_mk_periode -> mk-periode object
  const isLoading = ref(false)
  const error = ref(null)

  // Actions untuk inisialisasi (tanpa fetch nilai)
  async function fetchInitialData() {
    isLoading.value = true
    error.value = null
    
    try {
      // Ambil data master yang diperlukan (kecuali nilai)
      const [mahasiswaResponse, mkResponse, periodeResponse, mkPeriodeResponse] = await Promise.all([
        getMahasiswaList(),
        getMKList(),
        getPeriodeList()
        , getMkPeriodeList()
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

      // Handle API response for mk-periode
      if (mkPeriodeResponse?.data && mkPeriodeResponse.data.success) {
        mkPeriodeList.value = mkPeriodeResponse.data.data
      } else if (mkPeriodeResponse?.data && Array.isArray(mkPeriodeResponse.data)) {
        mkPeriodeList.value = mkPeriodeResponse.data
      }

      // Build mkPeriodeMap for quick lookup
      mkPeriodeMap.value = {}
      mkPeriodeList.value.forEach((mp) => {
        // ensure id_mk_periode is numeric or string consistently
        const key = String(mp.id_mk_periode)
        mkPeriodeMap.value[key] = mp
      })
      
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
      // Ensure mk-periode list is available to enrich nilai data
      if (!mkPeriodeList.value || mkPeriodeList.value.length === 0) {
        try {
          const mpResp = await getMkPeriodeList()
          if (mpResp?.data && mpResp.data.success) mkPeriodeList.value = mpResp.data.data
          else if (mpResp?.data && Array.isArray(mpResp.data)) mkPeriodeList.value = mpResp.data
        } catch (err) {
          console.warn('Failed to load mk-periode list:', err)
        }
        mkPeriodeMap.value = {}
        mkPeriodeList.value.forEach((mp) => (mkPeriodeMap.value[String(mp.id_mk_periode)] = mp))
      }

      // Build query params - support kode_mk filter by mapping to id_mk_periode
      const params = { ...filters }
      // If kode_mk given, convert to id_mk_periode filter (respect selected id_periode and id_kurikulum if present)
      if (params.kode_mk) {
        const kode = params.kode_mk
        const periodeFilter = params.id_periode
        const kurikulumFilter = params.id_kurikulum
        const ids = mkPeriodeList.value
          .filter((mp) => mp.kode_mk === kode && (!periodeFilter || String(mp.id_periode) === String(periodeFilter)) && (!kurikulumFilter || String(mp.id_kurikulum) === String(kurikulumFilter)))
          .map((mp) => Number(mp.id_mk_periode))
        if (ids.length > 0) {
          params.id_mk_periode = ids
        }
        // Remove kode_mk to avoid inconsistency with backend expectations
        delete params.kode_mk
      }

      // If only id_periode is given, we can filter by id_mk_periode corresponding to that periode
      if (params.id_periode && !params.id_mk_periode) {
        const ids = mkPeriodeList.value
          .filter((mp) => String(mp.id_periode) === String(params.id_periode) && (!params.id_kurikulum || String(mp.id_kurikulum) === String(params.id_kurikulum)))
          .map((mp) => Number(mp.id_mk_periode))
        if (ids.length > 0) {
          params.id_mk_periode = ids
        }
        // Keep id_periode param as well for compatibility with backend that may accept it
      }

      // Prefer id_mk_periode only - remove id_periode to avoid server OR logic (some implementations do `id_periode = X OR id_mk_periode IN (...)`)
      if (params.id_mk_periode && params.id_periode) {
        delete params.id_periode
      }

      // Prepare params to send: prefer id_mk_periode (exclude id_periode if present)
      const paramsToSend = { ...params }
      if (paramsToSend.id_mk_periode && paramsToSend.id_periode) delete paramsToSend.id_periode

      // Ensure mk-periode list is not empty; if it is, try to fetch it and rebuild params
      if (!mkPeriodeList.value || mkPeriodeList.value.length === 0) {
        console.warn('mkPeriodeList is empty; fetching mk-periode list again')
        await fetchMkPeriodeList()
      }

      // Debug: log final params used for API request so we can inspect in network logs
      console.log('Fetching nilai list with params:', paramsToSend)
      console.log('mkPeriodeList length:', mkPeriodeList.value.length)
      const nilaiResponse = await getNilaiMkList(paramsToSend)
      
      // Handle API response untuk nilai MK
      if (nilaiResponse.data && nilaiResponse.data.success) {
        const rawList = nilaiResponse.data.data
        // Enrich nilai items by joining with mkPeriodeMap using id_mk_periode
        const allowedIds = new Set((paramsToSend.id_mk_periode && Array.isArray(paramsToSend.id_mk_periode)) ? paramsToSend.id_mk_periode.map(Number) : [])

        // Enforce client-side filtering: remove any rows that don't match requested id_mk_periode (if provided)
        const filteredRaw = rawList.filter((r) => {
          if (allowedIds.size === 0) return true
          return allowedIds.has(Number(r.id_mk_periode))
        })

        if (allowedIds.size > 0 && filteredRaw.length !== rawList.length) {
          console.warn('Server returned rows outside requested id_mk_periode. Filtering on client to show only requested entries.', {
            requested: Array.from(allowedIds),
            returnedCount: rawList.length,
            filteredCount: filteredRaw.length,
          })
        }

        nilaiList.value = filteredRaw.map((item) => {
          const idKey = String(item.id_mk_periode || item.id_mk_periode)
          const mp = mkPeriodeMap.value[idKey]
          if (mp) {
            const out = {
              ...item,
              kode_mk: mp.kode_mk || item.kode_mk,
              id_periode: mp.id_periode || item.id_periode,
              id_kurikulum: mp.id_kurikulum || item.id_kurikulum,
              sks: mp.sks || item.sks,
              jenis_mk: mp.jenis_mk || item.jenis_mk,
            }
            // Normalize any server-provided letter grade to our canonical A/B/C/D/E
            out.huruf_mutu = getHurufMutu(out.nilai_akhir)
            out.huruf = out.huruf_mutu // alias for compatibility
            return out
          }
          // If no mapping found, try to keep existing fields (backwards compatibility)
          const out = {
            ...item,
            kode_mk: item.kode_mk || undefined,
            id_periode: item.id_periode || undefined,
            id_kurikulum: item.id_kurikulum || undefined,
          }
          out.huruf_mutu = getHurufMutu(out.nilai_akhir)
          out.huruf = out.huruf_mutu
          return out
        })
      } else {
        const raw = nilaiResponse.data || []
        nilaiList.value = Array.isArray(raw) ? raw : [raw]
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
    // Standardized A/B/C/D/E mapping (per kurikulum K2020 style):
    // A: >= 80
    // B: 68 - 79.99
    // C: 56 - 67.99
    // D: 45 - 55.99
    // E: < 45
    if (num >= 80) return 'A'
    if (num >= 68) return 'B'
    if (num >= 56) return 'C'
    if (num >= 45) return 'D'
    return 'E'
  }

  // Computed untuk nilai yang sudah difilter berdasarkan periode dan map mk-periode
  const filteredNilaiByPeriode = computed(() => {
    // If no nilai available, return empty array
    if (!nilaiList.value || nilaiList.value.length === 0) return []

    // Determine allowed id_mk_periode values for the selectedPeriode
    const periode = selectedPeriode.value
    let allowedIds = null
    if (periode) {
      allowedIds = new Set(
        mkPeriodeList.value
          .filter((mp) => String(mp.id_periode) === String(periode))
          .map((mp) => Number(mp.id_mk_periode)),
      )
    }

    // Filter nilaiList by allowed id_mk_periode if available
    const result = nilaiList.value.filter((item) => {
      if (!periode) return true
      // item.id_mk_periode might be undefined if server didn't return it; fall back to item.id_periode
      if (item.id_mk_periode) {
        return allowedIds.has(Number(item.id_mk_periode))
      }
      // Fallback: check id_periode if present in item
      if (item.id_periode) {
        return String(item.id_periode) === String(periode)
      }
      // If no information, exclude to be safe
      return false
    })

    // Debug information
    try {
      const kurikulumSet = new Set(result.map((r) => r.id_kurikulum).filter(Boolean))
      console.debug('filteredNilaiByPeriode', {
        periode,
        mkPeriodeLen: mkPeriodeList.value.length,
        nilaiTotal: nilaiList.value.length,
        nilaiFiltered: result.length,
        kurikulumSet: Array.from(kurikulumSet).slice(0, 10),
      })
    } catch (e) {}

    return result
  })

  // Action untuk menambah nilai
  async function createNilai(nilaiData, refreshParams = null) {
    isLoading.value = true
    error.value = null
    
    try {
      const apiData = {
        nim: nilaiData.nim,
        nilai_akhir: parseFloat(nilaiData.nilai_akhir),
      }

      // Prefer id_mk_periode if provided directly
      if (nilaiData.id_mk_periode) {
        apiData.id_mk_periode = Number(nilaiData.id_mk_periode)
      } else {
        apiData.id_periode = nilaiData.id_periode
        apiData.kode_mk = nilaiData.kode_mk
      }

      // If we can derive id_mk_periode from kode_mk + id_periode, include it for backend that prefers id_mk_periode
      if (nilaiData.kode_mk && nilaiData.id_periode && mkPeriodeList.value.length > 0) {
        const match = mkPeriodeList.value.find(
          (mp) => mp.kode_mk === nilaiData.kode_mk && String(mp.id_periode) === String(nilaiData.id_periode),
        )
        if (match) {
          apiData.id_mk_periode = match.id_mk_periode
        }
      }
      
      // console.log('Creating nilai with data:', apiData)
      let response
      try {
        response = await addNilaiMk(apiData)
      } catch (err) {
        // If it's a 409 (already exists), try to update existing nilai instead
        const status = err.response?.status
        const errData = err.response?.data
          if (status === 409) {
          console.warn('409 Conflict detected while adding nilai, attempting to update existing record', errData)
          // Derive id_periode and kode_mk if possible to perform update
          let idPeriode = nilaiData.id_periode
          let kodeMk = nilaiData.kode_mk
          if (!idPeriode && nilaiData.id_mk_periode) {
            const mp = mkPeriodeMap.value[String(nilaiData.id_mk_periode)]
            if (mp) {
              idPeriode = mp.id_periode
              kodeMk = mp.kode_mk
            }
          }
          // If we have enough info to update, try updating
          if (idPeriode && kodeMk && nilaiData.nim) {
            try {
              console.log('Attempting updateNilaiMk for conflict:', { idPeriode, kodeMk, nim: nilaiData.nim, nilai_akhir: apiData.nilai_akhir })
              const upd = await updateNilaiMk(idPeriode, kodeMk, nilaiData.nim, { nilai_akhir: apiData.nilai_akhir })
              console.log('Update after conflict succeeded:', { idPeriode, kodeMk, nim: nilaiData.nim, response: upd })
              response = upd
            } catch (updateErr) {
              console.error('Update after conflict failed:', updateErr)
              throw updateErr
            }
          } else {
            // Not enough info to update
            throw err
          }
        } else {
          throw err
        }
      }
      // console.log('API response:', response)
      // console.log('API response.data:', response.data)
      // console.log('API response.data.success:', response.data?.success)
      
      // Refresh data after adding - refresh using provided params or selectedPeriode
      if (refreshParams) {
        await fetchNilaiByFilter(refreshParams)
      } else if (selectedPeriode.value) {
        await fetchNilaiByFilter({ id_periode: selectedPeriode.value })
      }
      
      // Handle berbagai format response dari API
      if (response.data && response.data.success) {
        return { success: true, data: response.data.data, message: response.data.message }
      } else if (response.data) {
        // Fallback untuk format response yang berbeda
        return { success: true, data: response.data }
      }
      
      return { success: false, message: 'Unexpected response format' }
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

  // Fetch mk-periode list and build map
  async function fetchMkPeriodeList() {
    try {
      const resp = await getMkPeriodeList()
      if (resp?.data && resp.data.success) mkPeriodeList.value = resp.data.data
      else if (resp?.data && Array.isArray(resp.data)) mkPeriodeList.value = resp.data
      mkPeriodeMap.value = {}
      mkPeriodeList.value.forEach((mp) => (mkPeriodeMap.value[String(mp.id_mk_periode)] = mp))
    } catch (err) {
      console.error('Error fetching mk-periode:', err)
    }
  }

  // Fetch specific mk-periode by kode_mk + id_periode (first, try resolve locally, otherwise call API with filters)
  async function fetchMkPeriodeByKodeAndPeriode(kode_mk, id_periode) {
    if (!kode_mk || !id_periode) return null
    // Try quick resolve using local list
    const local = resolveIdMkPeriode(kode_mk, id_periode)
    if (local) return local

    // Call API to fetch specific mk-periode
    try {
      const resp = await getMkPeriodeList({ kode_mk, id_periode })
      let data = null
      if (resp?.data && resp.data.success) data = resp.data.data
      else if (resp?.data && Array.isArray(resp.data)) data = resp.data

      if (!data) return null
      // Normalize to array
      const arr = Array.isArray(data) ? data : [data]
      if (arr.length === 0) return null
      // Try to find the one matching kode and periode using normalization
      const kodeNorm = String(kode_mk).trim().toUpperCase()
      const periodeNorm = String(id_periode).trim()
      const match = arr.find((mp) => {
        if (!mp) return false
        const mpKode = mp.kode_mk ? String(mp.kode_mk).trim().toUpperCase() : ''
        const mpPeriode = mp.id_periode ? String(mp.id_periode).trim() : ''
        return mpKode === kodeNorm && mpPeriode === periodeNorm
      })
      const first = match || arr[0]
      // Update mkPeriodeList and map so we can reuse it later
      // Ensure no duplicate
      const exists = mkPeriodeList.value.find((mp) => String(mp.id_mk_periode) === String(first.id_mk_periode))
      if (!exists) {
        mkPeriodeList.value.push(first)
        mkPeriodeMap.value[String(first.id_mk_periode)] = first
      }
      return Number(first.id_mk_periode)
    } catch (err) {
      console.warn('Error fetching mk-periode by kode/id_periode:', { kode_mk, id_periode, err })
      return null
    }
  }

  // Helper: return mk-periode objects for a given periode
  function getMkPeriodeByPeriode(id_periode) {
    if (!id_periode || !mkPeriodeList.value) return []
    return mkPeriodeList.value.filter((mp) => String(mp.id_periode) === String(id_periode))
  }

  // Helper: resolve id_mk_periode for kode and periode (returns first match or null)
  function resolveIdMkPeriode(kode_mk, id_periode) {
    if (!kode_mk || !id_periode) return null
    try {
      const kodeNorm = String(kode_mk).trim().toUpperCase()
      const periodeNorm = String(id_periode).trim()
      const match = mkPeriodeList.value.find((mp) => {
        if (!mp) return false
        const mpKode = mp.kode_mk ? String(mp.kode_mk).trim().toUpperCase() : ''
        const mpPeriode = mp.id_periode ? String(mp.id_periode).trim() : ''
        return mpKode === kodeNorm && mpPeriode === periodeNorm
      })
      return match ? Number(match.id_mk_periode) : null
    } catch (err) {
      console.warn('resolveIdMkPeriode error:', err)
      return null
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
    mkPeriodeList,
    fetchMkPeriodeList,
    getMkPeriodeByPeriode,
    fetchMkPeriodeByKodeAndPeriode,
    resolveIdMkPeriode,
    isLoading,
    error,
    fetchInitialData,
    fetchAllData: fetchInitialData, // Backward compatibility alias
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