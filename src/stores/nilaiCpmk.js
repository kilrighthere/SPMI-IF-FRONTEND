import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getNilaiCpmkList, addNilaiCpmk, updateNilaiCpmk } from '@/api'
import { useNilaiMkStore } from '@/stores/nilaiMk'

export const useNilaiCpmkStore = defineStore('nilaiCpmk', () => {
  const nilaiCpmkList = ref([])
  const isLoading = ref(false)
  const error = ref(null)
  const nilaiMkStore = useNilaiMkStore()

  async function fetchAllNilaiCpmk() {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await getNilaiCpmkList()
      if (response.data && response.data.success) {
        nilaiCpmkList.value = response.data.data
      } else {
        nilaiCpmkList.value = response.data
      }
    } catch (err) {
      console.error('Error fetching Nilai CPMK:', err)
      error.value = 'Gagal memuat data Nilai CPMK'
      // Provide fallback data for development
      nilaiCpmkList.value = [
        { id_cpmk: 'CPMK001', nim: '24060120140001', nilai: 85 },
        { id_cpmk: 'CPMK001', nim: '24060120140002', nilai: 90 },
        { id_cpmk: 'CPMK002', nim: '24060120140001', nilai: 80 },
      ]
    } finally {
      isLoading.value = false
    }
  }

  // Fetch with filters and prefer id_mk_periode filter similar to nilaiMk store
  async function fetchNilaiByFilter(params = {}) {
    isLoading.value = true
    error.value = null
    const nilaiMkStore = useNilaiMkStore()

    try {
      // Ensure mk-periode is loaded so we can resolve ids
      if (!nilaiMkStore.mkPeriodeList || nilaiMkStore.mkPeriodeList.length === 0) {
        await nilaiMkStore.fetchMkPeriodeList()
      }

      // Build paramsToSend
      const paramsToSend = { ...params }

      // Prefer to map kode_mk to id_mk_periode(s) (respecting id_periode and optional id_kurikulum)
      if (paramsToSend.kode_mk) {
        const kode = paramsToSend.kode_mk
        const periodeFilter = paramsToSend.id_periode
        const kurikulumFilter = paramsToSend.id_kurikulum
        const ids = nilaiMkStore.mkPeriodeList
          .filter(
            (mp) =>
              mp.kode_mk === kode &&
              (!periodeFilter || String(mp.id_periode) === String(periodeFilter)) &&
              (!kurikulumFilter || String(mp.id_kurikulum) === String(kurikulumFilter)),
          )
          .map((mp) => Number(mp.id_mk_periode))
        if (ids.length > 0) {
          paramsToSend.id_mk_periode = ids
        }
        // Remove kode_mk to avoid server ambiguity
        delete paramsToSend.kode_mk
      }

      // If id_periode provided, and id_mk_periode not set, convert id_periode to list of id_mk_periode
      // Only do this as a last resort (e.g., for listing all MKs in the periode)
      if (paramsToSend.id_periode && !paramsToSend.id_mk_periode) {
        const ids = nilaiMkStore.mkPeriodeList
          .filter((mp) => String(mp.id_periode) === String(paramsToSend.id_periode))
          .map((mp) => Number(mp.id_mk_periode))
        paramsToSend.id_mk_periode = ids
      }

      // If id_mk_periode array was created but empty, remove it
      if (paramsToSend.id_mk_periode && Array.isArray(paramsToSend.id_mk_periode) && paramsToSend.id_mk_periode.length === 0) delete paramsToSend.id_mk_periode
      // Prepare to send: prefer id_mk_periode (remove id_periode to prevent server OR logic)
      if (paramsToSend.id_mk_periode && paramsToSend.id_periode) delete paramsToSend.id_periode

      // Call API
      const response = await getNilaiCpmkList(paramsToSend)
      let data = response.data && response.data.success ? response.data.data : response.data

      // Enforce client-side filtering if server returns rows outside requested id_mk_periode
      if (paramsToSend.id_mk_periode && Array.isArray(paramsToSend.id_mk_periode)) {
        const allowedIds = new Set(paramsToSend.id_mk_periode.map(Number))
        const returnedCount = Array.isArray(data) ? data.length : 0
        data = data.filter((r) => allowedIds.has(Number(r.id_mk_periode)))
        const filteredCount = Array.isArray(data) ? data.length : 0
        if (filteredCount !== returnedCount) {
          console.warn('Server returned rows outside requested id_mk_periode. Filtering on client to show only requested entries.', {
            requested: paramsToSend.id_mk_periode,
            returnedCount,
            filteredCount,
          })
        }
      }

      // Enrich rows with mk-periode info
      const mpMap = nilaiMkStore.mkPeriodeMap || {}
      const enriched = data.map((item) => {
        const idKey = String(item.id_mk_periode || '')
        const mp = mpMap[idKey]
        if (mp) {
          return { ...item, kode_mk: mp.kode_mk, id_periode: mp.id_periode, id_kurikulum: mp.id_kurikulum, sks: mp.sks }
        }
        // fallback: if item has kode_mk + id_periode, try to resolve
        if (item.kode_mk && item.id_periode) {
          const resolved = nilaiMkStore.resolveIdMkPeriode(item.kode_mk, item.id_periode)
          const mp2 = nilaiMkStore.mkPeriodeMap[String(resolved)]
          if (mp2) return { ...item, kode_mk: mp2.kode_mk, id_periode: mp2.id_periode, id_kurikulum: mp2.id_kurikulum, sks: mp2.sks, id_mk_periode: resolved }
        }
        return item
      })

      nilaiCpmkList.value = enriched
    } catch (err) {
      console.error('Error fetching Nilai CPMK:', err)
      error.value = 'Gagal memuat data Nilai CPMK'
      nilaiCpmkList.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Add nilai cpmk
  async function createNilaiCpmk(nilaiData, refreshParams = null) {
    isLoading.value = true
    error.value = null
    try {
      const apiData = { nim: nilaiData.nim, nilai: parseFloat(nilaiData.nilai) }
      if (nilaiData.id_cpmk) apiData.id_cpmk = nilaiData.id_cpmk

      // Prefer id_mk_periode if available
      if (nilaiData.id_mk_periode) {
        apiData.id_mk_periode = Number(nilaiData.id_mk_periode)
      } else if (nilaiData.kode_mk && nilaiData.id_periode) {
        // Try to resolve id_mk_periode using nilaiMk store
        const nilaiMkStore = useNilaiMkStore()
        // ensure mk-periode list loaded
        if (!nilaiMkStore.mkPeriodeList || nilaiMkStore.mkPeriodeList.length === 0) await nilaiMkStore.fetchMkPeriodeList()
        const resolved = nilaiMkStore.resolveIdMkPeriode(nilaiData.kode_mk, nilaiData.id_periode)
        if (resolved) apiData.id_mk_periode = resolved
      }

      let response
      try {
        response = await addNilaiCpmk(apiData)
      } catch (err) {
        const status = err.response?.status
        if (status === 409) {
          // try to update existing record
          console.warn('409 Conflict when adding nilai-cpmk, attempting to update')
          const idPeriode = nilaiData.id_periode || null
          let idMkPeriode = nilaiData.id_mk_periode
          if (!idMkPeriode && idPeriode && nilaiData.kode_mk) {
            const nilaiMkStore = useNilaiMkStore()
            idMkPeriode = nilaiMkStore.resolveIdMkPeriode(nilaiData.kode_mk, idPeriode)
          }
          if (idMkPeriode && nilaiData.id_cpmk && nilaiData.nim) {
            try {
              const upd = await updateNilaiCpmk(idMkPeriode, nilaiData.id_cpmk, nilaiData.nim, { nilai: apiData.nilai })
              response = upd
            } catch (updateErr) {
              console.error('Update after conflict failed for nilai-cpmk:', updateErr)
              throw updateErr
            }
          } else {
            throw err
          }
        } else {
          throw err
        }
      }

      // Refresh after create/update
      if (refreshParams) {
        await fetchNilaiByFilter(refreshParams)
      } else if (nilaiMkStore && nilaiMkStore.selectedPeriode) {
        await fetchNilaiByFilter({ id_periode: nilaiMkStore.selectedPeriode })
      }

      if (response?.data && (response.data.success || response.data.success === undefined)) {
        return { success: true, data: response.data.data, message: response.data.message }
      }
      return { success: false, message: 'Unexpected response format' }
    } catch (err) {
      console.error('Error creating nilai CPMK:', err)
      error.value = err.response?.data?.message || 'Gagal menambahkan nilai CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
      createNilaiCpmk,
    nilaiCpmkList,
    isLoading,
    error,
    fetchAllNilaiCpmk,
    fetchNilaiByFilter,
  }
})
