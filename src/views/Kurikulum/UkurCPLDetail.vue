<script setup>
import { ref, onMounted, computed } from 'vue'
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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend)

const route = useRoute()
const router = useRouter()

const nim = computed(() => String(route.params.nim || '').trim())

const selectedMahasiswa = ref(null)
const petaNilaiData = ref(null)
const cplPerGradesData = ref(null)
const isLoading = ref(false)
const isLoadingChart = ref(false)
const isLoadingTable = ref(false)
const error = ref('')

const chartData = computed(() => {
  if (!petaNilaiData.value || !Array.isArray(petaNilaiData.value)) return null

  const allCPL = Array.from({ length: 12 }, (_, i) => `CPL-${String(i + 1).padStart(2, '0')}`)
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

const avgCplValue = computed(() => {
  const values = chartData.value?.datasets?.[0]?.data
  if (!Array.isArray(values) || values.length === 0) return null

  const total = values.reduce((sum, value) => sum + Number(value || 0), 0)
  return total / values.length
})

const avgCplDisplay = computed(() => {
  if (avgCplValue.value == null || Number.isNaN(avgCplValue.value)) return '-'
  return avgCplValue.value.toFixed(2)
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

function getNilaiCPL(idCpl) {
  if (!petaNilaiData.value) return '0.00'
  const found = petaNilaiData.value.find((item) => item.id_cpl === idCpl)
  return found ? parseFloat(found.nilai_akhir_cpl).toFixed(2) : '0.00'
}

const groupedByCPL = computed(() => {
  if (!cplPerGradesData.value || !Array.isArray(cplPerGradesData.value)) return []

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

  return Object.values(grouped).sort((a, b) => a.id_cpl.localeCompare(b.id_cpl))
})

async function fetchMahasiswaInfo() {
  if (!nim.value) return
  isLoading.value = true
  try {
    const response = await getMahasiswaList()
    const data = response.data?.data || response.data || []
    selectedMahasiswa.value = data.find((mhs) => String(mhs.nim) === nim.value) || null
  } catch (err) {
    console.error('Error fetching mahasiswa info:', err)
    error.value = 'Gagal memuat informasi mahasiswa.'
  } finally {
    isLoading.value = false
  }
}

async function fetchPetaNilai() {
  if (!nim.value) return
  isLoadingChart.value = true
  try {
    const response = await getMahasiswaPetaNilai(nim.value)
    petaNilaiData.value = response.data?.data || response.data || []
  } catch (err) {
    console.error('Error fetching peta nilai:', err)
    error.value = 'Gagal memuat peta nilai mahasiswa.'
    petaNilaiData.value = []
  } finally {
    isLoadingChart.value = false
  }
}

async function fetchCplPerGrades() {
  if (!nim.value) return
  isLoadingTable.value = true
  try {
    const response = await getMahasiswaCplPerGrades(nim.value)
    cplPerGradesData.value = response.data?.data || response.data || []
  } catch (err) {
    console.error('Error fetching CPL per grades:', err)
    cplPerGradesData.value = []
  } finally {
    isLoadingTable.value = false
  }
}

onMounted(async () => {
  if (!nim.value) {
    router.replace(`/kurikulum/${route.params.id}/ukur-cpl`)
    return
  }
  await Promise.all([fetchMahasiswaInfo(), fetchPetaNilai(), fetchCplPerGrades()])
})
</script>

<template>
  <div class="ukur-cpl-detail-container">
    <div v-if="error" class="alert alert-warning" role="alert">
      <i class="ri-alert-line"></i> {{ error }}
    </div>

    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat data mahasiswa...</p>
    </div>

    <div v-else class="detail-layout">
      <div class="info-card">
        <div class="info-card-body">
          <div class="info-details">
            <div class="info-avatar">
              <i class="ri-user-3-fill"></i>
            </div>
            <div class="info-texts">
              <span class="info-label">Mahasiswa</span>
              <h5 class="info-name">{{ selectedMahasiswa?.nama || '-' }}</h5>
              <span class="info-nim">NIM: {{ selectedMahasiswa?.nim || nim }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-grid chart-section-grid">
        <div class="left-column">
          <div class="chart-card">
            <div class="chart-header">
              <h5 class="chart-title">
                <i class="ri-radar-line"></i>
                Capaian Pembelajaran Lulusan Mahasiswa
              </h5>
              <p class="chart-subtitle">
                Visualisasi capaian CPL mahasiswa berdasarkan nilai mata kuliah.
              </p>
            </div>
            <div class="chart-body">
              <div v-if="isLoadingChart" class="text-center my-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat radar chart...</p>
              </div>
              <template v-else-if="chartData">
                <div class="chart-meta">
                <div class="meta-icon">
                    <i class="ri-line-chart-line"></i>
                </div>
                <div class="meta-content">
                    <span class="meta-label">Rata-rata CPL</span>
                    <strong class="meta-value">{{ avgCplDisplay }}</strong>
                </div>
                </div>
                <div class="chart-container">
                  <Radar :data="chartData" :options="chartOptions" />
                </div>
              </template>
              <div v-else class="no-data-message-inline">
                <i class="ri-information-line"></i>
                <span>Data grafik tidak tersedia</span>
              </div>
            </div>
          </div>
        </div>

        <div class="right-column">
          <div class="cpl-detail-card">
            <div class="cpl-detail-header">
              <h5 class="cpl-detail-title">
                <i class="ri-table-line"></i>
                Detail Nilai CPL Per Mata Kuliah
              </h5>
              <p class="chart-subtitle">Rincian capaian CPL mahasiswa berdasarkan mata kuliah.</p>
            </div>
            <div class="cpl-detail-body">
              <div v-if="isLoadingTable" class="text-center my-4">
                <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Memuat detail nilai...</p>
              </div>

              <div v-else-if="groupedByCPL && groupedByCPL.length > 0" class="table-container">
                <div class="cpl-groups-list">
                  <div v-for="cplGroup in groupedByCPL" :key="cplGroup.id_cpl" class="cpl-card">
                    <div class="cpl-card-header">
                      <div class="cpl-info">
                        <div class="cpl-meta-left">
                          <span class="cpl-code-badge">{{ cplGroup.id_cpl }}</span>
                        </div>
                        <div class="cpl-meta-right">
                          <span class="cpl-nilai-badge">Nilai CPL: {{ cplGroup.nilai_cpl }}</span>
                        </div>
                      </div>
                    </div>
                    <div class="cpl-card-body">
                      <table class="cpl-table">
                        <thead>
                          <tr>
                            <th width="50">No</th>
                            <th>Nama Mata Kuliah</th>
                            <th width="120">Nilai Akhir MK</th>
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
              </div>

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
.ukur-cpl-detail-container {
  padding: 4px 0;
}

.detail-layout {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.chart-section-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
  gap: 1.5rem;
  align-items: stretch;
  --cards-max-height: calc(100vh - 270px);
}

.left-column {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.right-column {
  display: flex;
  min-width: 0;
}

.info-card,
.chart-card,
.cpl-detail-card {
  background: white;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}

.chart-card,
.cpl-detail-card {
  max-height: var(--cards-max-height);
}

.info-card-body {
  padding: 1rem 1.25rem;
}

.info-card {
  padding: 0.2rem;
}

.info-details {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.info-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #a6d600 0%, #d5ff5f 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.info-avatar i {
  font-size: 1.15rem;
  color: #2c3e50;
}

.info-texts {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.info-label {
  font-size: 0.73rem;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  color: #7a8696;
  margin-bottom: 0.18rem;
}

.info-name {
  margin: 0 0 0.28rem 0;
  font-weight: 700;
  font-size: 1.06rem;
  color: #2c3e50;
  line-height: 1.35;
}

.info-nim {
  display: inline-flex;
  width: fit-content;
  background: #f3f4f6;
  padding: 0.23rem 0.7rem;
  border-radius: 999px;
  font-family: 'Courier New', monospace;
  font-size: 0.76rem;
  color: #5f6c7b;
}

.chart-header,
.cpl-detail-header {
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
  padding: 0.8rem 1.2rem;
}

.chart-title,
.cpl-detail-title {
  font-weight: 600;
  font-size: 1rem;
  color: #2c3e50;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  line-height: 1.4;
  color: #43464b;
}

.chart-meta {
  /* Posisikan menggantung di sisi kiri atas chart */
  position: absolute;
  left: 25px;
  top: 25px;
  z-index: 10;
  
  display: flex;
  align-items: center;
  gap: 12px;
  background: white;
  padding: 10px 18px;
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;
}

.chart-meta:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.2);
}

.meta-icon {
  width: 38px;
  height: 38px;
  background: linear-gradient(135deg, #a6d600 0%, #d5ff5f 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #2c3e50;
  font-size: 1.2rem;
}

.meta-content {
  display: flex;
  flex-direction: column;
}

.meta-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.5px;
  color: #7a8696;
  margin-bottom: -2px;
}

.meta-value {
  font-size: 1.25rem;
  font-weight: 800;
  color: #2c3e50;
  font-family: 'Inter', sans-serif; /* atau font sans-serif favorit Anda */
}

/* Responsif: Pindahkan ke tengah atas jika di layar kecil */
@media (max-width: 768px) {
  .chart-meta {
    position: relative;
    left: 0;
    top: 0;
    margin-bottom: 1.5rem;
    width: fit-content;
  }
}

.chart-body {
  position: relative;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chart-card,
.cpl-detail-card {
  height: 100%;
}

.chart-container {
  position: relative;
  width: 100%;
  max-width: 680px;
  height: 420px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
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

.cpl-detail-card {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.cpl-detail-body {
  flex: 1;
  padding: 1rem;
  min-height: 0;
}

.table-container {
  max-height: 100%;
  overflow-y: auto;
  padding-right: 2px;
}

.cpl-groups-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cpl-card {
  border-radius: 8px;
  border: 1px solid #ddd;
  overflow: hidden;
}

.cpl-card-header {
  background: linear-gradient(90deg, #eef6d0 0%, #f7ffe6 100%);
  padding: 0.7rem 1rem;
  border-bottom: 1px solid #e7efd0;
}

.cpl-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  width: 100%;
}

.cpl-meta-left,
.cpl-meta-right {
  display: flex;
  align-items: center;
}

.cpl-code-badge,
.cpl-nilai-badge {
  display: inline-block;
  padding: 0.3rem 0.75rem;
  border-radius: 6px;
  font-size: 0.78rem;
  font-family: 'Courier New', monospace;
}

.cpl-code-badge {
  background: rgba(255, 255, 255, 0.95);
  color: #2c3e50;
  font-weight: 700;
  border: 1px solid #d0d0d0;
}

.cpl-nilai-badge {
  background: rgba(44, 62, 80, 0.1);
  color: #2c3e50;
  font-weight: 600;
}

.cpl-table {
  margin: 0;
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
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

.cpl-table tbody tr:hover {
  background-color: #f9fff4;
}

.mk-name {
  font-weight: 500;
  color: #2c3e50;
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
}

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

@media (max-width: 1024px) {
  .chart-section-grid {
    grid-template-columns: 1fr;
  }

  .chart-body {
    padding: 1rem 1.1rem 1.15rem;
  }

  .chart-container {
    max-width: 520px;
  }

  .cpl-detail-card {
    max-height: none;
  }

  .table-container {
    max-height: none;
    overflow: visible;
  }
}
</style>
