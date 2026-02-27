<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Radar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js'
import { getMahasiswaList, getMahasiswaPetaNilai, getMahasiswaCplPerGrades } from '@/api'
import { usePermissions } from '@/composables/usePermissions'

// Register Chart.js components
ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, userId, userRole } = usePermissions()
const route = useRoute()
const router = useRouter()
const targetNim = computed(() => route.query?.nim || null)
const currentUserNim = userId

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
  const nilaiArray = allCPL.map((cplCode) => {
    const found = petaNilaiData.value.find((item) => item.id_cpl === cplCode)
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
        pointHoverBorderColor: 'rgba(255, 99, 132, 1)',
      },
    ],
  }
})

const chartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  scales: {
    r: {
      angleLines: {
        display: true,
        color: 'rgba(0, 0, 0, 0.1)',
      },
      suggestedMin: 0,
      suggestedMax: 100,
      ticks: {
        stepSize: 20,
        callback: function (value) {
          return value
        },
      },
      pointLabels: {
        font: {
          size: 12,
        },
      },
    },
  },
  plugins: {
    legend: {
      display: true,
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: function (context) {
          return context.dataset.label + ': ' + context.parsed.r.toFixed(2)
        },
      },
    },
  },
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
      const currentUserData = allMahasiswa.find((mhs) => mhs.nim === currentUserNim.value)
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

      // Auto-select jika ada nim di query
      if (targetNim.value) {
        const target = allMahasiswa.find((mhs) => mhs.nim === targetNim.value)
        if (target) {
          selectMahasiswa(target)
        }
      }
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

// Listen to query change (e.g., from DosenWali link)
watch(
  () => route.query.nim,
  (nim) => {
    if (!nim) return
    const target = mahasiswaList.value.find((mhs) => mhs.nim === nim)
    if (target) {
      selectMahasiswa(target)
    } else {
      // If data belum ada, fetch list then select
      fetchMahasiswaList().then(() => {
        const refreshed = mahasiswaList.value.find((mhs) => mhs.nim === nim)
        if (refreshed) selectMahasiswa(refreshed)
      })
    }
  },
  { immediate: false },
)

function clearSelection() {
  selectedMahasiswa.value = null
  petaNilaiData.value = null
  cplPerGradesData.value = null
  searchQuery.value = ''
  filteredMahasiswaList.value = mahasiswaList.value
}

// Handle back button - dosen goes to DosenWali, admin goes to mahasiswa list
function handleBack() {
  if (isDosen.value && !isAdmin.value) {
    // Dosen (non-admin) kembali ke halaman Dosen Wali
    router.push('/admin/dosen-wali')
  } else {
    // Admin kembali ke daftar mahasiswa di halaman ini
    clearSelection()
  }
}

// Get nilai CPL from petaNilaiData
function getNilaiCPL(idCpl) {
  if (!petaNilaiData.value) return '0.00'

  const found = petaNilaiData.value.find((item) => item.id_cpl === idCpl)
  return found ? parseFloat(found.nilai_akhir_cpl).toFixed(2) : '0.00'
}

// Group data by CPL
const groupedByCPL = computed(() => {
  if (!cplPerGradesData.value || !Array.isArray(cplPerGradesData.value)) {
    return []
  }

  // Group by id_cpl
  const grouped = {}
  cplPerGradesData.value.forEach((item) => {
    if (!grouped[item.id_cpl]) {
      grouped[item.id_cpl] = {
        id_cpl: item.id_cpl,
        nilai_cpl: getNilaiCPL(item.id_cpl),
        courses: [],
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
    filteredMahasiswaList.value = mahasiswaList.value.filter(
      (mhs) => mhs.nim.toLowerCase().includes(query) || mhs.nama.toLowerCase().includes(query),
    )
  }
})

onMounted(() => {
  // Dosen (non-admin) tanpa nim query harus kembali ke DosenWali
  if (isDosen.value && !isAdmin.value && !targetNim.value) {
    router.replace('/admin/dosen-wali')
    return
  }
  fetchMahasiswaList()
})
</script>

<template>
  <div class="ukur-cpl-container">
    <h1 class="page-title">
      {{ isMahasiswa ? 'Pengukuran CPL Saya' : 'Pengukuran CPL Mahasiswa' }}
    </h1>

    <!-- Loading State -->
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat daftar mahasiswa...</p>
    </div>

    <!-- Mahasiswa Catalog - Table (Hanya untuk Admin) -->
    <div v-else-if="isAdmin && !selectedMahasiswa" class="table-container">
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
            <tr v-for="(mhs, index) in filteredMahasiswaList" :key="mhs.nim" class="mahasiswa-row">
              <td class="text-center">{{ index + 1 }}</td>
              <td>
                <span class="nim-text">{{ mhs.nim }}</span>
              </td>
              <td>
                <span class="mahasiswa-name">{{ mhs.nama }}</span>
              </td>
              <td class="text-center">
                <button class="btn btn-view" @click="selectMahasiswa(mhs)">
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

    <!-- Chart Section - Two Column Grid Layout -->
    <div v-else-if="selectedMahasiswa || isMahasiswa" id="chart-section">
      <!-- Error Message -->
      <div v-if="error" class="alert alert-warning" role="alert">
        <i class="ri-alert-line"></i> {{ error }}
      </div>

      <!-- Loading State -->
      <div v-if="isLoadingChart && isLoadingTable" class="text-center my-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Memuat data CPL...</p>
      </div>

      <!-- Two Column Grid -->
      <div v-else class="chart-section-grid">
        <!-- LEFT COLUMN -->
        <div class="left-column">
          <!-- Info Mahasiswa Card -->
          <div class="info-card">
            <div class="info-card-body">
              <div class="info-card-top">
                <div class="info-details">
                  <div class="info-avatar">
                    <i class="ri-user-3-fill"></i>
                  </div>
                  <div>
                    <h5 class="info-name">{{ selectedMahasiswa?.nama || '-' }}</h5>
                    <span class="info-nim">NIM: {{ selectedMahasiswa?.nim || '-' }}</span>
                  </div>
                </div>
                <button v-if="isDosen || isAdmin" class="btn btn-back-compact" @click="handleBack">
                  <i class="ri-arrow-left-line"></i> Kembali
                </button>
              </div>
            </div>
          </div>

          <!-- Radar Chart Card -->
          <div class="chart-card">
            <div class="chart-header">
              <h5 class="chart-title">
                <i class="ri-radar-line"></i>
                Capaian Pembelajaran Lulusan Program Studi
              </h5>
            </div>
            <div class="chart-body">
              <div v-if="isLoadingChart" class="text-center my-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat radar chart...</p>
              </div>
              <div v-else-if="chartData" class="chart-container">
                <Radar :data="chartData" :options="chartOptions" />
              </div>
              <div v-else class="no-data-message-inline">
                <i class="ri-information-line"></i>
                <span>Data grafik tidak tersedia</span>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN -->
        <div class="right-column">
          <!-- Detail Nilai CPL Card -->
          <div class="cpl-detail-card">
            <div class="cpl-detail-header">
              <h5 class="cpl-detail-title">
                <i class="ri-table-line"></i>
                Detail Nilai CPL Per Mata Kuliah
              </h5>
            </div>
            <div class="cpl-detail-body">
              <!-- Loading Table -->
              <div v-if="isLoadingTable" class="text-center my-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat detail nilai...</p>
              </div>

              <!-- CPL Groups -->
              <div v-else-if="groupedByCPL && groupedByCPL.length > 0" class="cpl-groups-list">
                <div v-for="cplGroup in groupedByCPL" :key="cplGroup.id_cpl" class="cpl-card">
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
                          <th width="50">NO</th>
                          <th>NAMA MATA KULIAH</th>
                          <th width="120">NILAI AKHIR MK</th>
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
                            <span class="badge-nilai">{{
                              parseFloat(course.nilai_akhir).toFixed(2)
                            }}</span>
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

/* ============================================
   TWO-COLUMN GRID LAYOUT
   ============================================ */
.chart-section-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.25rem;
  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.right-column {
  display: flex;
  flex-direction: column;
}

/* ============================================
   INFO MAHASISWA CARD (compact, top-left)
   ============================================ */
.info-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.info-card-body {
  padding: 1rem 1.25rem;
}

.info-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.info-details {
  display: flex;
  align-items: center;
  gap: 0.85rem;
}

.info-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a6d600 0%, #d5ff5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.info-avatar i {
  font-size: 1.25rem;
  color: #2c3e50;
}

.info-name {
  margin: 0 0 0.15rem 0;
  font-weight: 600;
  font-size: 0.95rem;
  color: #2c3e50;
  line-height: 1.3;
}

.info-nim {
  display: inline-block;
  background: #f0f0f0;
  padding: 0.2rem 0.65rem;
  border-radius: 12px;
  font-family: 'Courier New', monospace;
  font-weight: 500;
  font-size: 0.78rem;
  color: #666;
}

.btn-back-compact {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(44, 62, 80, 0.08);
  border: 1.5px solid rgba(44, 62, 80, 0.2);
  color: #2c3e50;
  font-weight: 500;
  padding: 0.4rem 0.9rem;
  border-radius: 20px;
  font-size: 0.8rem;
  transition: all 0.2s;
  white-space: nowrap;
  cursor: pointer;
}

.btn-back-compact:hover {
  background: rgba(44, 62, 80, 0.15);
  border-color: rgba(44, 62, 80, 0.4);
}

/* ============================================
   CHART CARD (Radar)
   ============================================ */
.chart-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.chart-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 0.9rem 1.25rem;
}

.chart-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-title i {
  font-size: 1.15rem;
}

.chart-body {
  padding: 1rem 0.75rem;
  background: white;
}

.chart-container {
  position: relative;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  padding: 0.5rem 0;
}

.no-data-message-inline {
  text-align: center;
  padding: 2rem 1rem;
  color: #999;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.no-data-message-inline i {
  font-size: 1.2rem;
}

/* ============================================
   CPL DETAIL CARD (right column, scrollable)
   ============================================ */
.cpl-detail-card {
  background: white;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 180px);
}

.cpl-detail-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 0.9rem 1.25rem;
  flex-shrink: 0;
}

.cpl-detail-title {
  font-weight: 600;
  font-size: 0.95rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.cpl-detail-title i {
  font-size: 1.15rem;
  color: #2c3e50;
}

.cpl-detail-body {
  overflow-y: auto;
  flex: 1;
  padding: 0.75rem;
}

/* Custom scrollbar for CPL detail body */
.cpl-detail-body::-webkit-scrollbar {
  width: 6px;
}

.cpl-detail-body::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 3px;
}

.cpl-detail-body::-webkit-scrollbar-thumb {
  background: #c0c0c0;
  border-radius: 3px;
}

.cpl-detail-body::-webkit-scrollbar-thumb:hover {
  background: #a0a0a0;
}

/* CPL Groups list inside detail body */
.cpl-groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Individual CPL Card */
.cpl-card {
  background: white;
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.cpl-card-header {
  background: linear-gradient(90deg, #eef6d0 0%, #f7ffe6 100%);
  padding: 0.65rem 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.cpl-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.cpl-code-badge {
  display: inline-block;
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-weight: 700;
  font-size: 0.8rem;
  font-family: 'Courier New', monospace;
  letter-spacing: 0.5px;
  border: 1px solid #d0d0d0;
}

.cpl-nilai-badge {
  display: inline-block;
  background: rgba(44, 62, 80, 0.1);
  color: #2c3e50;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.78rem;
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
  background-color: #f8f8f8;
}

.cpl-table thead th {
  padding: 0.6rem 0.85rem;
  font-weight: 600;
  color: #5a5a5a;
  font-size: 0.72rem;
  letter-spacing: 0.3px;
  border-bottom: 1.5px solid #e0e0e0;
  text-align: left;
}

.cpl-table tbody td {
  padding: 0.55rem 0.85rem;
  vertical-align: middle;
  border-bottom: 1px solid #f0f0f0;
  color: #333;
  font-size: 0.82rem;
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
  font-size: 0.82rem;
}

.badge-nilai {
  display: inline-block;
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  color: #2c3e50;
  padding: 0.25rem 0.6rem;
  border-radius: 5px;
  font-weight: 600;
  font-size: 0.78rem;
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

/* ============================================
   ALERTS & UTILITIES
   ============================================ */
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

.my-4 {
  margin: 1.5rem 0;
}

.mt-2 {
  margin-top: 0.5rem;
}

/* ============================================
   RESPONSIVE
   ============================================ */
@media (max-width: 1200px) {
  .chart-container {
    max-width: 400px;
  }
}

@media (max-width: 992px) {
  .ukur-cpl-container {
    padding: 15px;
  }

  .chart-section-grid {
    grid-template-columns: 1fr;
  }

  .cpl-detail-card {
    max-height: none;
  }

  .chart-container {
    max-width: 450px;
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

  .info-card-top {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .chart-body {
    padding: 1rem 0.5rem;
  }

  .chart-container {
    padding: 0.5rem 0;
    max-width: 100%;
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
    padding: 0.5rem 0.4rem;
    font-size: 0.75rem;
  }

  .cpl-card-header {
    padding: 0.6rem 0.75rem;
  }

  .cpl-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.4rem;
  }

  .cpl-code-badge,
  .cpl-nilai-badge {
    font-size: 0.72rem;
    padding: 0.25rem 0.6rem;
  }

  .badge-nilai {
    font-size: 0.7rem;
    padding: 0.2rem 0.4rem;
  }

  .info-details {
    gap: 0.5rem;
  }

  .info-avatar {
    width: 36px;
    height: 36px;
  }

  .info-avatar i {
    font-size: 1rem;
  }

  .info-name {
    font-size: 0.85rem;
  }

  .info-nim {
    font-size: 0.72rem;
  }
}
</style>

