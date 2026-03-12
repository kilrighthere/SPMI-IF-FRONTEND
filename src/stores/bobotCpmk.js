import { defineStore } from 'pinia'
import { ref } from 'vue'
import {
  getBobotCpmkList,
  getMkPeriodeList,
  getMKList,
  getPeriodeList,
  addBobotCpmk,
  updateBobotCpmk,
  deleteBobotCpmk,
} from '@/api'

export const useBobotCpmkStore = defineStore('bobotCpmk', () => {
  const bobotCpmkList = ref([])
  const mkPeriodeList = ref([])
  const mkList = ref([])
  const periodeList = ref([])
  const mergedList = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  function normalizeListPayload(response) {
    if (!response) return []
    const payload = response.data?.data ?? response.data
    if (Array.isArray(payload)) return payload
    return payload ? [payload] : []
  }

  async function fetchPeriodeList() {
    try {
      const periodeRes = await getPeriodeList()
      periodeList.value = normalizeListPayload(periodeRes)
      return periodeList.value
    } catch (err) {
      return periodeList.value
    }
  }

  async function fetchAllBobotCpmk(selectedPeriode = null) {
    isLoading.value = true
    error.value = null

    try {
      // Load all data with partial-failure tolerance so filter options stay available.
      const [mkPeriodeRes, mkRes, bobotRes, periodeRes] = await Promise.allSettled([
        getMkPeriodeList(),
        getMKList(),
        getBobotCpmkList(),
        getPeriodeList(),
      ])

      if (mkPeriodeRes.status === 'fulfilled') {
        mkPeriodeList.value = normalizeListPayload(mkPeriodeRes.value)
      }
      if (mkRes.status === 'fulfilled') {
        mkList.value = normalizeListPayload(mkRes.value)
      }
      if (bobotRes.status === 'fulfilled') {
        bobotCpmkList.value = normalizeListPayload(bobotRes.value)
      }
      if (periodeRes.status === 'fulfilled') {
        periodeList.value = normalizeListPayload(periodeRes.value)
      }

      // Build mergedList combining mkPeriode, mkList, and bobotCpmkList
      // Filter mkPeriode by selectedPeriode if provided
      const filteredMkPeriode = selectedPeriode
        ? mkPeriodeList.value.filter((m) => String(m.id_periode) === String(selectedPeriode))
        : mkPeriodeList.value

      mergedList.value = filteredMkPeriode.map((m) => {
        const mkInfo = mkList.value.find((x) => x.kode_mk === m.kode_mk) || {}
        const bobots = bobotCpmkList.value
          .filter((b) => String(b.id_mk_periode) === String(m.id_mk_periode))
          .map((b) => ({ id_cpmk: b.id_cpmk, bobot: b.bobot ?? b.bobot_persen }))
        return {
          id_mk_periode: m.id_mk_periode,
          kode_mk: m.kode_mk,
          nama_mk: mkInfo.nama_mk || mkInfo.nama || '',
          sks: m.sks,
          id_periode: m.id_periode,
          bobots,
        }
      })

      if (
        mkPeriodeRes.status === 'rejected' ||
        mkRes.status === 'rejected' ||
        bobotRes.status === 'rejected'
      ) {
        error.value =
          'Sebagian data Bobot CPMK gagal dimuat. Coba muat ulang jika data belum lengkap.'
      }
    } catch (err) {
      error.value = 'Gagal memuat data Bobot CPMK'
      // Provide fallback data for development
      // Provide fallback data for development
      bobotCpmkList.value = [
        { id_cpmk: 'CPMK001', bobot: 0.4 },
        { id_cpmk: 'CPMK002', bobot: 0.6 },
      ]
      // fallback merged data
      mergedList.value = []
    } finally {
      isLoading.value = false
    }
  }

  async function createBobotCpmk(data) {
    isLoading.value = true
    error.value = null
    try {
      const resp = await addBobotCpmk(data)
      // Refresh list after create
      await fetchAllBobotCpmk(data.id_periode || data.id_periode)
      return resp.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal menambahkan bobot CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function editBobotCpmk(id_mk_periode, id_cpmk, data) {
    isLoading.value = true
    error.value = null
    try {
      const resp = await updateBobotCpmk(id_mk_periode, id_cpmk, data)
      await fetchAllBobotCpmk()
      return resp.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal memperbarui bobot CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  async function removeBobotCpmk(id_mk_periode, id_cpmk) {
    isLoading.value = true
    error.value = null
    try {
      const resp = await deleteBobotCpmk(id_mk_periode, id_cpmk)
      await fetchAllBobotCpmk()
      return resp.data
    } catch (err) {
      error.value = err.response?.data?.message || 'Gagal menghapus bobot CPMK'
      return null
    } finally {
      isLoading.value = false
    }
  }

  return {
    bobotCpmkList,
    mkPeriodeList,
    mkList,
    periodeList,
    mergedList,
    isLoading,
    error,
    fetchPeriodeList,
    fetchAllBobotCpmk,
    createBobotCpmk,
    editBobotCpmk,
    removeBobotCpmk,
  }
})
