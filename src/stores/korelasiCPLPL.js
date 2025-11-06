import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getCPLList, getPLList, addCPL, updateCPL, getCPLById } from '@/api'

export const useKorelasiCPLPLStore = defineStore('korelasiCPLPL', () => {
  const cplList = ref([])
  const plList = ref([])
  const cplPlRelations = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  // Computed untuk membuat data untuk tabel matriks
  const matrixData = computed(() => {
    const matrix = {}

    // Inisialisasi matriks kosong
    cplList.value.forEach((cpl) => {
      if (!cpl.id_cpl) return // Skip jika tidak ada ID

      matrix[cpl.id_cpl] = {}
      plList.value.forEach((pl) => {
        if (!pl.kode_pl) return // Skip jika tidak ada kode PL

        matrix[cpl.id_cpl][pl.kode_pl] = false
      })
    })

    // Isi matriks berdasarkan relasi
    // Gunakan kode_pl yang sama dengan key matrix
    cplPlRelations.value.forEach((relation) => {
      if (matrix[relation.id_cpl] && relation.id_pl) {
        // relation.id_pl seharusnya sama dengan kode_pl
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
      const [cplResponse, plResponse] = await Promise.all([getCPLList(), getPLList()])

      // Handle API response format
      if (cplResponse.data && cplResponse.data.success) {
        // Map API response sesuai dengan format yang diharapkan di frontend
        cplList.value = cplResponse.data.data.map((cpl) => ({
          id_cpl: cpl.kode_cpl || cpl.id_cpl, // Gunakan kode_cpl jika ada
          deskripsi: cpl.deskripsi,
        }))

        // Ekstrak relasi CPL-PL dari response CPL
        cplPlRelations.value = []
        cplResponse.data.data.forEach((cpl) => {
          if (cpl.id_pl) {
            // Jika data CPL mengandung id_pl, tambahkan ke relasi
            cplPlRelations.value.push({
              id_cpl: cpl.kode_cpl || cpl.id_cpl,
              id_pl: cpl.id_pl,
            })
          }
        })
      } else {
        cplList.value = cplResponse.data || []
        cplPlRelations.value = []
      }

      if (plResponse.data && plResponse.data.success) {
        // Map API response sesuai dengan format yang diharapkan di frontend
        plList.value = plResponse.data.data.map((pl) => ({
          kode_pl: pl.kode_pl || pl.id_pl, // Gunakan kode_pl jika ada
          deskripsi: pl.deskripsi,
        }))
      } else {
        plList.value = plResponse.data || []
      }
    } catch (err) {
      console.error('Error fetching CPL-PL data:', err)
      error.value = 'Gagal memuat data korelasi CPL-PL'

      // Fallback data
      cplList.value = [
        {
          id_cpl: 'CPL-01',
          deskripsi:
            'Bertakwa kepada Tuhan YME, menjunjung tinggi nilai kemanusiaan, etika, dan berperan aktif sebagai warga negara yang menjunjung Pancasila.',
        },
        {
          id_cpl: 'CPL-02',
          deskripsi:
            'Mampu menerapkan konsep dasar matematika dan algoritma dalam pengembangan perangkat lunak.',
        },
        {
          id_cpl: 'CPL-03',
          deskripsi:
            'Mampu merancang dan mengembangkan aplikasi berbasis web dengan metode yang sistematis.',
        },
      ]

      plList.value = [
        { kode_pl: 'PL-01', deskripsi: 'Software Developer' },
        { kode_pl: 'PL-02', deskripsi: 'Data Scientist' },
        { kode_pl: 'PL-03', deskripsi: 'System Analyst' },
      ]

      cplPlRelations.value = [
        { id_cpl: 'CPL-01', id_pl: 'PL-01' },
        { id_cpl: 'CPL-02', id_pl: 'PL-01' },
        { id_cpl: 'CPL-02', id_pl: 'PL-02' },
        { id_cpl: 'CPL-03', id_pl: 'PL-01' },
        { id_cpl: 'CPL-03', id_pl: 'PL-03' },
      ]
    } finally {
      isLoading.value = false
    }
  }

  // Toggle relation akan memperbarui relasi di server dan juga di state lokal
  async function toggleRelation(cplId, plId, isChecked) {
    isLoading.value = true
    error.value = null

    try {
      // Pertama, dapatkan data CPL saat ini
      const cplResponse = await getCPLById(cplId)
      const cplData = cplResponse.data.data

      if (isChecked) {
        // Tambah relasi dengan mengupdate data CPL
        // Jika CPL sudah memiliki id_pl, kita perlu mempertahankannya
        const updatedData = {
          ...cplData,
          id_pl: plId,
        }

        // Update CPL dengan menambahkan relasi PL
        await updateCPL(cplId, updatedData)

        // Update state lokal
        cplPlRelations.value.push({ id_cpl: cplId, id_pl: plId })
      } else {
        // Hapus relasi dengan mengupdate data CPL
        // Kita menghapus id_pl dari CPL
        const { id_pl, ...updatedData } = cplData

        // Update CPL dengan menghapus relasi PL
        await updateCPL(cplId, updatedData)

        // Update state lokal
        cplPlRelations.value = cplPlRelations.value.filter(
          (relation) => !(relation.id_cpl === cplId && relation.id_pl === plId),
        )
      }

      // Setelah berhasil update di server, reload data untuk memastikan konsistensi
      await fetchAllData()

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
    toggleRelation,
  }
})
