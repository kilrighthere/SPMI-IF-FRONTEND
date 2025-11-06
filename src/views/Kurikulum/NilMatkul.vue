<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()

// Initialize stores
const nilaiMkStore = useNilaiMkStore()
const auth = useAuthStore()

// Role-based logic
const userRole = computed(() => auth.user?.role?.toLowerCase())
const isMahasiswa = computed(() => userRole.value === 'mahasiswa')
const isDosen = computed(() => userRole.value === 'dosen' || userRole.value === 'admin')
const currentUserNim = computed(() => auth.user?.nim)

// Data untuk mata kuliah
const isLoading = computed(() => nilaiMkStore.isLoading)
const error = computed(() => nilaiMkStore.error)

// Hanya tampilkan mata kuliah yang sudah ada nilainya
const mataKuliahList = computed(() => {
  if (isMahasiswa.value && currentUserNim.value) {
    // Untuk mahasiswa, hanya tampilkan mata kuliah yang ada nilainya untuk mereka
    return nilaiMkStore.mataKuliahList.filter(mk => 
      nilaiMkStore.nilaiList.some(nilai => 
        nilai.kode_mk === mk.kode_mk && nilai.nim === currentUserNim.value
      )
    )
  } else {
    // Untuk dosen/admin, tampilkan semua mata kuliah yang ada nilainya
    return nilaiMkStore.mataKuliahList.filter(mk => 
      nilaiMkStore.nilaiList.some(nilai => nilai.kode_mk === mk.kode_mk)
    )
  }
})

// Filter
const searchQuery = ref('')
const filteredMataKuliahList = computed(() => {
  if (!searchQuery.value) return mataKuliahList.value
  
  const query = searchQuery.value.toLowerCase()
  return mataKuliahList.value.filter(mk => 
    mk.nama_mk.toLowerCase().includes(query) ||
    mk.kode_mk.toLowerCase().includes(query)
  )
})

// Load data saat komponen dimuat
onMounted(() => {
  nilaiMkStore.fetchAllData()
})

// Buka halaman detail nilai mata kuliah
const viewNilaiMatkul = (kodeMk) => {
  router.push({
    name: 'DetailNilaiMatkul',
    params: {
      id: route.params.id,
      kodeMk
    }
  })
}

// Hitung jumlah mahasiswa untuk mata kuliah tertentu (untuk dosen/admin)
// Untuk mahasiswa, return 1 jika ada nilai untuk mereka
const getJumlahMahasiswa = (kodeMk) => {
  if (isMahasiswa.value && currentUserNim.value) {
    return nilaiMkStore.nilaiList.some(nilai => 
      nilai.kode_mk === kodeMk && nilai.nim === currentUserNim.value
    ) ? 1 : 0
  } else {
    return nilaiMkStore.nilaiList.filter(nilai => nilai.kode_mk === kodeMk).length
  }
}

// Get nilai mahasiswa untuk mata kuliah tertentu (khusus untuk mahasiswa)
const getNilaiMahasiswa = (kodeMk) => {
  if (isMahasiswa.value && currentUserNim.value) {
    const nilai = nilaiMkStore.nilaiList.find(nilai => 
      nilai.kode_mk === kodeMk && nilai.nim === currentUserNim.value
    )
    return nilai ? parseFloat(nilai.nilai_akhir) : null
  }
  return null
}

// Convert nilai angka ke huruf mutu
const getHurufMutu = (nilai) => {
  if (!nilai) return '-'
  if (nilai >= 85) return 'A'
  if (nilai >= 80) return 'A-'
  if (nilai >= 75) return 'B+'
  if (nilai >= 70) return 'B'
  if (nilai >= 65) return 'B-'
  if (nilai >= 60) return 'C+'
  if (nilai >= 55) return 'C'
  if (nilai >= 50) return 'C-'
  if (nilai >= 45) return 'D+'
  if (nilai >= 40) return 'D'
  return 'E'
}

// Get CSS class untuk huruf mutu
const getHurufMutuClass = (huruf) => {
  if (huruf === 'A' || huruf === 'A-') return 'huruf-a'
  if (huruf === 'B+' || huruf === 'B' || huruf === 'B-') return 'huruf-b'
  if (huruf === 'C+' || huruf === 'C' || huruf === 'C-') return 'huruf-c'
  if (huruf === 'D+' || huruf === 'D') return 'huruf-d'
  if (huruf === 'E') return 'huruf-e'
  return 'huruf-default'
}

// Cek apakah mata kuliah memiliki nilai
const hasMataKuliahNilai = (kodeMk) => {
  return nilaiMkStore.nilaiList.some(nilai => nilai.kode_mk === kodeMk)
}
</script>

<template>
  <div class="nilai-matkul-container">
    <div class="section-box">
      <div class="section-header">
        <h3>{{ isMahasiswa ? 'Nilai Mata Kuliah Saya' : 'Daftar Mata Kuliah' }}</h3>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading data mata kuliah...</div>

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
              placeholder="Cari mata kuliah..." 
              class="search-input"
            />
          </div>
        </div>

        <div v-if="mataKuliahList.length === 0" class="empty-state">
          Belum ada data nilai mata kuliah yang tersedia.
        </div>

        <!-- Mata Kuliah Table untuk Dosen/Admin -->
        <div v-if="isDosen" class="table-responsive">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>Kode MK</th>
                <th>Nama Mata Kuliah</th>
                <th>Semester</th>
                <th>SKS</th>
                <th>Jumlah Mahasiswa</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mk in filteredMataKuliahList" :key="mk.kode_mk">
                <td>{{ mk.kode_mk }}</td>
                <td>{{ mk.nama_mk }}</td>
                <td>{{ mk.semester || '-' }}</td>
                <td>{{ mk.sks || '-' }}</td>
                <td class="jumlah-mhs">{{ getJumlahMahasiswa(mk.kode_mk) }}</td>
                <td class="action-cell">
                  <button 
                    @click="viewNilaiMatkul(mk.kode_mk)" 
                    class="btn-action"
                    title="Lihat detail nilai"
                  >
                    <i class="ri-file-list-3-line"></i>
                    Lihat Nilai
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mata Kuliah Table untuk Mahasiswa (Simple View) -->
        <div v-else class="table-responsive">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>Kode MK</th>
                <th>Nama Mata Kuliah</th>
                <th>Semester</th>
                <th>SKS</th>
                <th>Nilai Akhir</th>
                <th>Huruf Mutu</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mk in filteredMataKuliahList" :key="mk.kode_mk">
                <td>{{ mk.kode_mk }}</td>
                <td>{{ mk.nama_mk }}</td>
                <td>{{ mk.semester || '-' }}</td>
                <td>{{ mk.sks || '-' }}</td>
                <td class="nilai-cell">{{ getNilaiMahasiswa(mk.kode_mk) || '-' }}</td>
                <td class="huruf-mutu">
                  <span class="huruf-badge" :class="getHurufMutuClass(getHurufMutu(getNilaiMahasiswa(mk.kode_mk)))">
                    {{ getHurufMutu(getNilaiMahasiswa(mk.kode_mk)) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Info table results -->
        <div v-if="filteredMataKuliahList.length > 0" class="table-info">
          Menampilkan {{ filteredMataKuliahList.length }} dari {{ mataKuliahList.length }} mata kuliah
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nilai-matkul-container {
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
  margin-bottom: 0;
  color: var(--color-button);
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

.jumlah-mhs {
  font-weight: 600;
  text-align: center;
}

.action-cell {
  text-align: center;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-action:hover {
  background-color: var(--color-button-hover);
  transform: translateY(-1px);
}

.btn-action:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-action i {
  font-size: 16px;
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
  border-radius: 5px;
  margin-bottom: 15px;
}

.status-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
}

.status-ada {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
}

.table-info {
  text-align: right;
  font-size: 14px;
  color: #666;
  margin-top: 10px;
}

.huruf-mutu {
  text-align: center;
}

.huruf-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
  min-width: 30px;
}

.huruf-a {
  background-color: #16a34a;
  color: white;
}

.huruf-b {
  background-color: #2563eb;
  color: white;
}

.huruf-c {
  background-color: #eab308;
  color: white;
}

.huruf-d {
  background-color: #ea580c;
  color: white;
}

.huruf-e {
  background-color: #dc2626;
  color: white;
}

.huruf-default {
  background-color: #6b7280;
  color: white;
}
</style>