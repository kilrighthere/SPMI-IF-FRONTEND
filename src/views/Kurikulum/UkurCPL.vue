<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js'
import { getMahasiswaList, getMahasiswaPetaNilai, getMahasiswaCplPerGrades } from '@/api'
import { useAuthStore } from '@/stores/auth'

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// Auth store
const auth = useAuthStore()

// Role-based logic
const userRole = computed(() => auth.user?.role?.toLowerCase())
const isMahasiswa = computed(() => userRole.value === 'mahasiswa')
const isDosen = computed(() => userRole.value === 'dosen' || userRole.value === 'admin')
const currentUserNim = computed(() => auth.user?.nim)

// State
const mahasiswaList = ref([])
const filteredMahasiswaList = ref([])
const searchQuery = ref('')
const selectedMahasiswa = ref(null)
const petaNilaiData = ref(null)
const cplPerGradesData = ref(null)
const isLoading = ref(false)
const isLoadingChart = ref(false)
const isLoadingTable = ref(false)
const error = ref(null)

// Chart data
const chartData = computed(() => {
  if (!petaNilaiData.value || !Array.isArray(petaNilaiData.value)) {
    return null
  }

  // Buat array untuk 12 CPL (CPL-01 sampai CPL-12)
  const allCPL = Array.from({ length: 12 }, (_, i) => `CPL-${String(i + 1).padStart(2, '0')}`)
  
  // Map nilai dari API ke array 12 CPL
  const nilaiArray = allCPL.map(cplCode => {
    const found = petaNilaiData.value.find(item => item.id_cpl === cplCode)
    return found ? parseFloat(found.nilai_akhir_cpl) : 0
  })

  return {
    labels: allCPL,
    datasets: [
      {
        label: 'Nilai CPL Prodi',
        data: nilaiArray,
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(255, 99, 132, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)'
      }
    ]
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      angleLines: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)'
      },
      suggestedMin: 0,
      suggestedMax: 100,
      ticks: {
        stepSize: 20,
        callback: function(value) {
          return value
        }
      },
      pointLabels: {
        font: {
          size: 12
        }
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom'
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          return context.dataset.label + ': ' + context.parsed.r.toFixed(2)
        }
      }
    }
  }
}

// Methods
async function fetchMahasiswaList() {
  isLoading.value = true
  try {
    const response = await getMahasiswaList()
    let allMahasiswa = []
    
    if (response.data && response.data.success) {
      allMahasiswa = response.data.data
    } else {
      allMahasiswa = response.data || []
    }

    // Filter berdasarkan role
    if (isMahasiswa.value && currentUserNim.value) {
      // Untuk mahasiswa, hanya tampilkan data mereka sendiri
      const currentUserData = allMahasiswa.find(mhs => mhs.nim === currentUserNim.value)
      mahasiswaList.value = currentUserData ? [currentUserData] : []
      filteredMahasiswaList.value = mahasiswaList.value
      
      // Auto-select mahasiswa jika mereka login
      if (currentUserData) {
        selectedMahasiswa.value = currentUserData
        await fetchPetaNilai(currentUserData.nim)
        await fetchCplPerGrades(currentUserData.nim)
      }
    } else {
      // Untuk dosen/admin, tampilkan semua mahasiswa
      mahasiswaList.value = allMahasiswa
      filteredMahasiswaList.value = allMahasiswa
    }
  } catch (err) {
    console.error('Error fetching mahasiswa:', err)
    error.value = 'Gagal memuat daftar mahasiswa'
  } finally {
    isLoading.value = false
  }
}

async function fetchPetaNilai(nim) {
  if (!nim) return

  isLoadingChart.value = true
  error.value = null
  
  try {
    const response = await getMahasiswaPetaNilai(nim)
    
    if (response.data && response.data.success) {
      petaNilaiData.value = response.data.data
    } else if (response.data && Array.isArray(response.data.data)) {
      petaNilaiData.value = response.data.data
    } else if (Array.isArray(response.data)) {
      petaNilaiData.value = response.data
    } else {
      throw new Error('Format data tidak sesuai')
    }
  } catch (err) {
    console.error('Error fetching peta nilai:', err)
    error.value = 'Gagal memuat peta nilai mahasiswa'
    petaNilaiData.value = []
  } finally {
    isLoadingChart.value = false
  }
}

async function fetchCplPerGrades(nim) {
  if (!nim) return

  isLoadingTable.value = true
  
  try {
    const response = await getMahasiswaCplPerGrades(nim)
    
    if (response.data && response.data.success) {
      cplPerGradesData.value = response.data.data
    } else if (response.data && Array.isArray(response.data.data)) {
      cplPerGradesData.value = response.data.data
    } else if (Array.isArray(response.data)) {
      cplPerGradesData.value = response.data
    } else {
      throw new Error('Format data tidak sesuai')
    }
  } catch (err) {
    console.error('Error fetching CPL per grades:', err)
    cplPerGradesData.value = []
  } finally {
    isLoadingTable.value = false
  }
}

function selectMahasiswa(mhs) {
  selectedMahasiswa.value = mhs
  fetchPetaNilai(mhs.nim)
  fetchCplPerGrades(mhs.nim)
  // Scroll to chart section
  setTimeout(() => {
    document.getElementById('chart-section')?.scrollIntoView({ behavior: 'smooth' })
  }, 100)
}

function clearSelection() {
  selectedMahasiswa.value = null
  petaNilaiData.value = null
  cplPerGradesData.value = null
  searchQuery.value = ''
  filteredMahasiswaList.value = mahasiswaList.value
}

// Get nilai CPL from petaNilaiData
function getNilaiCPL(idCpl) {
  if (!petaNilaiData.value) return '0.00'
  
  const found = petaNilaiData.value.find(item => item.id_cpl === idCpl)
  return found ? parseFloat(found.nilai_akhir_cpl).toFixed(2) : '0.00'
}

// Group data by CPL
const groupedByCPL = computed(() => {
  if (!cplPerGradesData.value || !Array.isArray(cplPerGradesData.value)) {
    return []
  }

  // Group by id_cpl
  const grouped = {}
  cplPerGradesData.value.forEach(item => {
    if (!grouped[item.id_cpl]) {
      grouped[item.id_cpl] = {
        id_cpl: item.id_cpl,
        nilai_cpl: getNilaiCPL(item.id_cpl),
        courses: []
      }
    }
    grouped[item.id_cpl].courses.push(item)
  })

  // Convert to array and sort by CPL code
  return Object.values(grouped).sort((a, b) => a.id_cpl.localeCompare(b.id_cpl))
})

// Watch untuk search query (AJAX-like filtering)
watch(searchQuery, (newQuery) => {
  if (newQuery.trim() === '') {
    filteredMahasiswaList.value = mahasiswaList.value
  } else {
    const query = newQuery.toLowerCase()
    filteredMahasiswaList.value = mahasiswaList.value.filter(mhs => 
      mhs.nim.toLowerCase().includes(query) || 
      mhs.nama.toLowerCase().includes(query)
    )
  }
})

onMounted(() => {
  fetchMahasiswaList()
})
</script>

<template>
  <div class="ukur-cpl-container">
    <h1 class="page-title">{{ isMahasiswa ? 'Pengukuran CPL Saya' : 'Pengukuran CPL Mahasiswa' }}</h1>
          
        <!-- Search Bar - Hanya untuk Dosen/Admin -->
        <div v-if="isDosen" class="search-section">
          <div class="search-box">
            <i class="ri-search-line search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Cari mahasiswa berdasarkan NIM atau nama..." 
              class="search-input"
            />
          </div>
        </div>        <!-- Loading State -->
        <div v-if="isLoading" class="text-center my-5">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2">Memuat daftar mahasiswa...</p>
        </div>

        <!-- Mahasiswa Catalog - Table (Hanya untuk Dosen/Admin) -->
        <div v-else-if="isDosen && !selectedMahasiswa" class="table-container">
          <div class="table-header">
            <h5 class="table-title">
              <i class="ri-user-line"></i>
              Daftar Mahasiswa
            </h5>
          </div>
          <div class="table-responsive">
            <table class="table mahasiswa-table">
              <thead>
                <tr>
                  <th width="80">NO</th>
                  <th>NIM</th>
                  <th>NAMA MAHASISWA</th>
                  <th width="180" class="text-center">AKSI</th>
                </tr>
              </thead>
              <tbody>
                <tr 
                  v-for="(mhs, index) in filteredMahasiswaList" 
                  :key="mhs.nim"
                  class="mahasiswa-row"
                >
                  <td class="text-center">{{ index + 1 }}</td>
                  <td>
                    <span class="nim-text">{{ mhs.nim }}</span>
                  </td>
                  <td>
                    <span class="mahasiswa-name">{{ mhs.nama }}</span>
                  </td>
                  <td class="text-center">
                    <button 
                      class="btn btn-view"
                      @click="selectMahasiswa(mhs)"
                    >
                      <i class="ri-eye-line"></i> Lihat Peta CPL
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- No Results -->
            <div v-if="filteredMahasiswaList.length === 0" class="no-results">
              <i class="ri-search-line"></i>
              <p>Tidak ada mahasiswa yang ditemukan dengan kata kunci "{{ searchQuery }}"</p>
              <button class="btn btn-outline-primary btn-sm" @click="searchQuery = ''">
                Reset Pencarian
              </button>
            </div>
          </div>
        </div>

        <!-- Chart Section -->
        <div v-else-if="selectedMahasiswa || isMahasiswa" id="chart-section">
          <!-- Selected Mahasiswa Info (Hanya untuk Dosen/Admin) -->
          <div v-if="isDosen" class="selected-mahasiswa-banner">
            <div class="selected-info-content">
              <div class="selected-details">
                <h4>{{ selectedMahasiswa.nama }}</h4>
                <p class="nim-display">NIM: {{ selectedMahasiswa.nim }}</p>
              </div>
            </div>
            <button class="btn btn-back" @click="clearSelection">
              <i class="ri-arrow-left-line"></i> Kembali ke Daftar
            </button>
          </div>
          
          <!-- Mahasiswa Profile (Untuk Mahasiswa) -->
          <div v-else-if="isMahasiswa && selectedMahasiswa" class="mahasiswa-profile-banner">
            <div class="profile-content">
              <div class="profile-details">
                <h4>{{ selectedMahasiswa.nama }}</h4>
                <p class="nim-display">NIM: {{ selectedMahasiswa.nim }}</p>
              </div>
            </div>
          </div>

          <!-- Error Message -->
          <div v-if="error" class="alert alert-warning" role="alert">
            <i class="ri-alert-line"></i> {{ error }}
          </div>

          <!-- Loading Chart -->
          <div v-if="isLoadingChart" class="text-center my-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Memuat peta nilai CPL...</p>
          </div>

          <!-- Chart -->
          <div v-else-if="chartData" class="chart-card">
            <div class="chart-header">
              <h5 class="chart-title">
                <i class="ri-radar-line"></i>
                Capaian Pembelajaran Lulusan Program Studi
              </h5>
            </div>
            <div class="chart-body">
              <div class="chart-container">
                <Radar :data="chartData" :options="chartOptions" />
              </div>
            </div>
          </div>

          <!-- No Chart Data -->
          <div v-else class="alert alert-info">
            <i class="ri-information-line"></i> Data grafik tidak tersedia
          </div>

          <!-- Detail Table Section -->
          <div v-if="!isLoadingChart && !isLoadingTable" class="detail-section">
            <h5 class="section-title">
              <i class="ri-table-line"></i>
              Detail Nilai CPL Per Mata Kuliah
            </h5>

            <!-- Loading Table -->
            <div v-if="isLoadingTable" class="text-center my-4">
              <div class="spinner-border" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
              <p class="mt-2">Memuat detail nilai...</p>
            </div>

            <!-- CPL Cards -->
            <div v-else-if="groupedByCPL && groupedByCPL.length > 0" class="cpl-cards-container">
              <div 
                v-for="cplGroup in groupedByCPL" 
                :key="cplGroup.id_cpl"
                class="cpl-card"
              >
                <div class="cpl-card-header">
                  <div class="cpl-info">
                    <span class="cpl-code-badge">{{ cplGroup.id_cpl }}</span>
                    <span class="cpl-nilai-badge">Nilai CPL: {{ cplGroup.nilai_cpl }}</span>
                  </div>
                </div>
                <div class="cpl-card-body">
                  <table class="table cpl-table">
                    <thead>
                      <tr>
                        <th width="60">NO</th>
                        <th>NAMA MATA KULIAH</th>
                        <th width="150">NILAI AKHIR MK</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr 
                        v-for="(course, index) in cplGroup.courses" 
                        :key="`${cplGroup.id_cpl}-${course.nama_mk}-${index}`"
                      >
                        <td class="text-center">{{ index + 1 }}</td>
                        <td>
                          <span class="mk-name">{{ course.nama_mk }}</span>
                        </td>
                        <td class="text-center">
                          <span class="badge-nilai">{{ parseFloat(course.nilai_akhir).toFixed(2) }}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <!-- No Data -->
            <div v-else class="no-data-message">
              <i class="ri-file-list-3-line"></i>
              <p>Tidak ada data nilai mata kuliah yang tersedia</p>
            </div>
          </div>
        </div>
  </div>
</template>

<style scoped>
.ukur-cpl-container {
  padding: 20px;
  background-color: #fff;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 1.25rem;
}

/* Search Section */
.search-section {
  margin-bottom: 1.25rem;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 700px;
  margin-bottom: 0.5rem;
}

.search-input {
  width: 100%;
  padding: 12px 20px 12px 3rem;
  height: 30px;
  border-radius: 25px;
  border: 2px solid #e0e0e0;
  font-size: 1rem;
  transition: all 0.3s;
  background-color: #f9f9f9;
}

.search-input:focus {
  border-color: #a6d600;
  box-shadow: 0 0 0 0.2rem rgba(166, 214, 0, 0.15);
  outline: none;
  background-color: #fff;
}

.search-icon {
  position: absolute;
  left: 1.2rem;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  color: #999;
}

.search-info {
  font-size: 0.9rem;
  color: #666;
  padding-left: 0.5rem;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.table-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 1.25rem 1.75rem;
}

.table-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.table-title i {
  font-size: 1.3rem;
}

.table-responsive {
  background: white;
}

.mahasiswa-table {
  margin: 0;
  width: 100%;
}

.mahasiswa-table thead {
  background-color: #f5f5f5;
}

.mahasiswa-table thead th {
  padding: 0.95rem 1.5rem;
  font-weight: 600;
  color: #5a5a5a;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e0e0e0;
  text-align: left;
}

.mahasiswa-table tbody td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.mahasiswa-row {
  transition: background-color 0.2s ease;
}

.mahasiswa-row:hover {
  background-color: #f9fff4;
}

.mahasiswa-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.nim-text {
  display: inline-block;
  background: #efefef;
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
  font-size: 0.85rem;
  color: #666;
}

.btn-view {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  color: #2c3e50;
  border: none;
  padding: 0.5rem 1.1rem;
  border-radius: 6px;
  font-weight: 500;
  font-size: 0.9rem;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-view:hover {
  background: linear-gradient(90deg, #92bf00 0%, #c3ec4a 100%);
  transform: translateY(-1px);
  box-shadow: 0 3px 8px rgba(166, 214, 0, 0.3);
  color: #2c3e50;
}

.btn-view i {
  font-size: 1rem;
}

/* No Results */
.no-results {
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  background: white;
}

.no-results i {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.no-results p {
  font-size: 1rem;
  margin-bottom: 1.25rem;
  color: #666;
}

/* Selected Mahasiswa Banner */
.selected-mahasiswa-banner {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  color: #2c3e50;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(166, 214, 0, 0.2);
  margin-bottom: 1.25rem;
}

.selected-info-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.selected-details h4 {
  margin: 0 0 0.4rem 0;
  font-weight: 600;
  font-size: 1.4rem;
}

.nim-display {
  display: inline-block;
  background: rgba(255, 255, 255, 0.25);
  padding: 0.35rem 1rem;
  border-radius: 18px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
  margin: 0;
  font-size: 0.9rem;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(44, 62, 80, 0.1);
  border: 2px solid rgba(44, 62, 80, 0.3);
  color: #2c3e50;
  font-weight: 600;
  padding: 0.6rem 1.4rem;
  border-radius: 24px;
  transition: all 0.2s;
}

.btn-back:hover {
  background: rgba(44, 62, 80, 0.2);
  border-color: #2c3e50;
  color: #2c3e50;
}

/* Mahasiswa Profile Banner */
.mahasiswa-profile-banner {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  border-radius: 8px;
  padding: 1.25rem 1.5rem;
  color: #2c3e50;
  text-align: center;
  box-shadow: 0 2px 8px rgba(166, 214, 0, 0.2);
  margin-bottom: 1.25rem;
}

.profile-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.profile-details h4 {
  margin: 0 0 0.4rem 0;
  font-weight: 600;
  font-size: 1.4rem;
}

/* Chart Card */
.chart-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.chart-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 1.25rem 1.75rem;
}

.chart-title {
  font-weight: 600;
  font-size: 1.1rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.chart-title i {
  font-size: 1.3rem;
}

.chart-body {
  padding: 1.5rem 1.25rem;
  background: white;
}

.chart-container {
  position: relative;
  width: 100%;
  max-width: 650px;
  margin: 0 auto;
  padding: 1rem 0;
}

/* Alert */
.alert {
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.875rem 1.125rem;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}

/* Loading */
.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
  color: #a6d600;
}

.text-center {
  text-align: center;
}

.my-5 {
  margin: 3rem 0;
}

/* Responsive */
@media (max-width: 992px) {
  .ukur-cpl-container {
    padding: 15px;
  }
}

@media (max-width: 768px) {
  .ukur-cpl-container {
    padding: 12px;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .search-box {
    max-width: 100%;
  }

  .selected-mahasiswa-banner {
    flex-direction: column;
    gap: 0.875rem;
    text-align: center;
    padding: 1rem 1.25rem;
  }

  .selected-info-content {
    flex-direction: column;
    text-align: center;
  }

  .selected-details h4 {
    font-size: 1.125rem;
  }

  .chart-body {
    padding: 1.25rem 0.875rem;
  }

  .chart-container {
    padding: 0.75rem 0;
  }

  .mahasiswa-table thead th {
    padding: 0.8rem 1rem;
    font-size: 0.75rem;
  }

  .mahasiswa-table tbody td {
    padding: 0.8rem 1rem;
    font-size: 0.9rem;
  }

  .btn-view {
    padding: 0.45rem 0.8rem;
    font-size: 0.85rem;
  }
}

@media (max-width: 576px) {
  .ukur-cpl-container {
    padding: 10px;
  }

  .mahasiswa-table thead th:first-child,
  .mahasiswa-table tbody td:first-child {
    display: none;
  }

  .mahasiswa-table thead th,
  .mahasiswa-table tbody td {
    padding: 0.7rem 0.6rem;
  }

  .nim-text {
    font-size: 0.75rem;
    padding: 0.3rem 0.6rem;
  }

  .btn-view span {
    display: none;
  }

  .btn-view {
    padding: 0.4rem 0.7rem;
  }

  .btn-view i {
    margin: 0;
  }

  .cpl-table thead th:first-child,
  .cpl-table tbody td:first-child {
    display: none;
  }

  .cpl-table thead th,
  .cpl-table tbody td {
    padding: 0.7rem 0.5rem;
    font-size: 0.8rem;
  }

  .cpl-card-header {
    padding: 0.85rem 1rem;
  }

  .cpl-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .cpl-code-badge,
  .cpl-nilai-badge {
    font-size: 0.8rem;
    padding: 0.35rem 0.75rem;
  }

  .badge-nilai {
    font-size: 0.75rem;
    padding: 0.3rem 0.5rem;
  }
}

/* Detail Section */
.detail-section {
  margin-top: 1.25rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  font-size: 1.3rem;
  color: #a6d600;
}

/* CPL Cards Container */
.cpl-cards-container {
  display: grid;
  gap: 1rem;
  margin-top: 0.75rem;
}

/* Individual CPL Card */
.cpl-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.cpl-card-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 0.875rem 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cpl-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.cpl-code-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-weight: 700;
  font-size: 0.95rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
}

.cpl-nilai-badge {
  display: inline-block;
  background: rgba(44, 62, 80, 0.15);
  color: #2c3e50;
  padding: 0.45rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.cpl-card-body {
  padding: 0;
}

.cpl-table {
  margin: 0;
  width: 100%;
}

.cpl-table thead {
  background-color: #f5f5f5;
}

.cpl-table thead th {
  padding: 0.95rem 1.5rem;
  font-weight: 600;
  color: #5a5a5a;
  font-size: 0.8rem;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #e0e0e0;
  text-align: left;
}

.cpl-table tbody td {
  padding: 1rem 1.5rem;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
}

.cpl-table tbody tr {
  transition: background-color 0.2s ease;
}

.cpl-table tbody tr:hover {
  background-color: #f9fff4;
}

.cpl-table tbody tr:last-child td {
  border-bottom: none;
}

.mk-name {
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.95rem;
}

.badge-nilai {
  display: inline-block;
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  color: #2c3e50;
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9rem;
  font-family: 'Courier New', monospace;
}

.no-data-message {
  text-align: center;
  padding: 3rem 2rem;
  color: #999;
  background: white;
}

.no-data-message i {
  font-size: 3.5rem;
  margin-bottom: 1rem;
  opacity: 0.4;
}

.no-data-message p {
  font-size: 1rem;
  margin: 0;
  color: #666;
}

.my-4 {
  margin: 1.5rem 0;
}
</style>
