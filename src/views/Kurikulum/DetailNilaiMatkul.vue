<template>
  <div class="detail-nilai-container">
    <div class="section-box">
      <div class="section-header">
        <div>
          <h3>
            {{ isMahasiswa ? 'Nilai Saya:' : 'Nilai Mata Kuliah:' }}
            {{ mataKuliah ? mataKuliah.nama : kodeMk }}
          </h3>
          <p class="mk-info" v-if="mataKuliah">
            {{ mataKuliah.kode_mk }}
          </p>
        </div>
        <button class="back-button" @click="goBack">
          <i class="ri-arrow-left-line"></i>
          Kembali
        </button>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading data nilai...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Content -->
      <div v-if="!isLoading && !error" class="nilai-content">
        <!-- Search & Filter -->
        <div class="search-filter">
          <div class="search-box">
            <i class="ri-search-line"></i>
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="isMahasiswa ? 'Cari periode...' : 'Cari mahasiswa...'"
              class="search-input"
            />
          </div>
        </div>

        <div v-if="nilaiMahasiswa.length === 0" class="empty-state">
          Belum ada data nilai untuk mata kuliah ini.
        </div>

        <!-- Nilai Table -->
        <div v-else class="table-responsive">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>NIM</th>
                <th>Nama Mahasiswa</th>
                <th>Semester</th>
                <th>Nilai Akhir</th>
                <th>Huruf Mutu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="nilai in filteredNilai" :key="nilai.nim">
                <td>{{ nilai.nim }}</td>
                <td>{{ nilaiMkStore.getMahasiswaNama(nilai.nim) }}</td>
                <td>{{ nilai.id_periode }}</td>
                <td class="nilai-cell">{{ formatNilai(nilai.nilai_akhir) }}</td>
                <td
                  class="nilai-huruf"
                  :class="`huruf-${String(nilaiMkStore.getHurufMutu(nilai.nilai_akhir)).toLowerCase()}`"
                >
                  {{ nilaiMkStore.getHurufMutu(nilai.nilai_akhir) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Info table results -->
        <div v-if="filteredNilai.length > 0" class="table-info">
          Menampilkan {{ filteredNilai.length }} dari {{ nilaiMahasiswa.length }} data nilai
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const router = useRouter()
const kodeMk = route.params.kodeMk

// Initialize stores
const nilaiMkStore = useNilaiMkStore()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, userId } = usePermissions()
const currentUserNim = userId

// Data untuk nilai mata kuliah
const isLoading = computed(() => nilaiMkStore.isLoading)
const error = computed(() => nilaiMkStore.error)
const nilaiMahasiswa = ref([])
const mataKuliah = computed(() => {
  return nilaiMkStore.mataKuliahList.find((mk) => mk.kode_mk === kodeMk)
})

// Filter
const searchQuery = ref('')
const filteredNilai = computed(() => {
  if (!searchQuery.value) return nilaiMahasiswa.value

  const query = searchQuery.value.toLowerCase()
  return nilaiMahasiswa.value.filter((nilai) => {
    // Get mahasiswa name for search
    const mahasiswaNama = nilaiMkStore.getMahasiswaNama(nilai.nim).toLowerCase()

    return (
      mahasiswaNama.includes(query) ||
      nilai.nim.toLowerCase().includes(query) ||
      nilai.id_periode.toLowerCase().includes(query)
    )
  })
})

// Ambil data nilai untuk mata kuliah ini
const loadNilaiData = () => {
  if (nilaiMkStore.nilaiList.length === 0) {
    // Jika belum ada data, fetch semua data terlebih dahulu
    nilaiMkStore.fetchAllData().then(() => {
      const allNilai = nilaiMkStore.getNilaiByMataKuliah(kodeMk)

      if (isMahasiswa.value && currentUserNim.value) {
        // Untuk mahasiswa, hanya tampilkan nilai mereka sendiri
        nilaiMahasiswa.value = allNilai.filter((nilai) => nilai.nim === currentUserNim.value)
      } else {
        // Untuk dosen/admin, tampilkan semua nilai
        nilaiMahasiswa.value = allNilai
      }
    })
  } else {
    // Jika sudah ada data, langsung filter untuk mata kuliah ini
    const allNilai = nilaiMkStore.getNilaiByMataKuliah(kodeMk)

    if (isMahasiswa.value && currentUserNim.value) {
      // Untuk mahasiswa, hanya tampilkan nilai mereka sendiri
      nilaiMahasiswa.value = allNilai.filter((nilai) => nilai.nim === currentUserNim.value)
    } else {
      // Untuk dosen/admin, tampilkan semua nilai
      nilaiMahasiswa.value = allNilai
    }
  }
}

// Load data saat komponen dimuat
onMounted(() => {
  loadNilaiData()
})

// Helper untuk format nilai
const formatNilai = (nilai) => {
  if (!nilai) return '-'

  // Convert to number and display with 2 decimal places
  const num = parseFloat(nilai)
  if (isNaN(num)) return nilai

  return num.toFixed(2)
}

// Use centralized mapping from store so grading thresholds are consistent
// across the application. This ensures we only display A/B/C/D/E.
// The store's getHurufMutu handles parsing and numeric thresholds.
// We'll call nilaiMkStore.getHurufMutu(nilai) directly from the template.

// Kembali ke halaman daftar mata kuliah
const goBack = () => {
  router.push(`/kurikulum/${route.params.id}/nilai-matkul`)
}
</script>

<style scoped>
.detail-nilai-container {
  width: 100%;
  margin: 0 auto;
}

.section-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-box h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
  color: var(--color-button);
}

.mk-info {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.back-button {
  display: flex;
  align-items: center;
  gap: 5px;
  background-color: #f1f1f1;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-button:hover {
  background-color: #e5e5e5;
}

.back-button i {
  font-size: 16px;
}

.search-filter {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  position: relative;
  width: 350px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #666;
}

.search-input {
  width: 100%;
  padding: 10px 10px 10px 35px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 14px;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 10px;
}

.nilai-table {
  width: 100%;
  border-collapse: collapse;
}

.nilai-table th,
.nilai-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.nilai-table th {
  background-color: #f5f5f5;
  font-weight: bold;
  color: #333;
}

.nilai-table tr:hover {
  background-color: #f9f9f9;
}

.nilai-cell {
  font-weight: 600;
  text-align: right;
}

.nilai-huruf {
  font-weight: 700;
  text-align: center;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.table-info {
  text-align: right;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}
</style>
