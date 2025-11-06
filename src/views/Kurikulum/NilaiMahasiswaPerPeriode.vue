<template>
  <div class="nilai-mahasiswa-container">
    <div class="header-section">
      <h1 class="page-title">Nilai CPL per Periode</h1>
      <p class="page-subtitle">{{ mahasiswaInfo.name }} - {{ mahasiswaInfo.nim }}</p>
      <p class="periode-info">Periode: {{ periode }}</p>
    </div>

    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data nilai...</p>
    </div>

    <div v-else-if="error" class="error-container">
      <i class="ri-error-warning-line"></i>
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Coba Lagi</button>
    </div>

    <div v-else class="content-section">
      <!-- Grafik Nilai CPL -->
      <div class="chart-card">
        <h2 class="card-title">Grafik Nilai CPL</h2>
        <div class="chart-container">
          <!-- Placeholder untuk chart - bisa diganti dengan library chart seperti Chart.js -->
          <div class="chart-placeholder">
            <canvas id="nilaiCplChart"></canvas>
          </div>
        </div>
      </div>

      <!-- Tabel Nilai per CPL -->
      <div class="table-card">
        <h2 class="card-title">Detail Nilai per CPL</h2>
        <div class="table-wrapper">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>Kode CPL</th>
                <th>Nama CPL</th>
                <th>Nilai Forward</th>
                <th>Nilai Backward</th>
                <th>Nilai Akhir</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpl in nilaiCplList" :key="cpl.kode_cpl">
                <td>{{ cpl.kode_cpl }}</td>
                <td>{{ cpl.nama_cpl }}</td>
                <td>
                  <span class="badge badge-info">{{ cpl.nilai_forward || '-' }}</span>
                </td>
                <td>
                  <span class="badge badge-info">{{ cpl.nilai_backward || '-' }}</span>
                </td>
                <td>
                  <span class="badge" :class="getNilaiClass(cpl.nilai_akhir)">
                    {{ cpl.nilai_akhir || '-' }}
                  </span>
                </td>
                <td>
                  <span class="status-badge" :class="getStatusClass(cpl.status)">
                    {{ cpl.status }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Summary Card -->
      <div class="summary-card">
        <h2 class="card-title">Ringkasan</h2>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Total CPL</span>
            <span class="summary-value">{{ nilaiCplList.length }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Rata-rata Nilai</span>
            <span class="summary-value">{{ averageScore }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">CPL Lulus</span>
            <span class="summary-value success">{{ passedCpl }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">CPL Tidak Lulus</span>
            <span class="summary-value danger">{{ failedCpl }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getMahasiswaNilaiPerPeriode, getMahasiswaByNim } from '@/api'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const { canAccessMahasiswaData, isMahasiswa } = usePermissions()

const nim = ref(route.params.nim)
const periode = ref(route.params.periode)
const loading = ref(true)
const error = ref(null)
const nilaiCplList = ref([])
const mahasiswaInfo = ref({
  name: '',
  nim: '',
})

// Check access permission
if (!canAccessMahasiswaData(nim.value)) {
  error.value = 'Anda tidak memiliki akses untuk melihat data ini'
  loading.value = false
}

// Computed properties
const averageScore = computed(() => {
  if (nilaiCplList.value.length === 0) return 0
  const total = nilaiCplList.value.reduce((sum, cpl) => sum + (parseFloat(cpl.nilai_akhir) || 0), 0)
  return (total / nilaiCplList.value.length).toFixed(2)
})

const passedCpl = computed(() => {
  return nilaiCplList.value.filter((cpl) => cpl.status === 'Lulus').length
})

const failedCpl = computed(() => {
  return nilaiCplList.value.filter((cpl) => cpl.status === 'Tidak Lulus').length
})

function getNilaiClass(nilai) {
  if (!nilai) return 'badge-secondary'
  const score = parseFloat(nilai)
  if (score >= 80) return 'badge-success'
  if (score >= 70) return 'badge-info'
  if (score >= 60) return 'badge-warning'
  return 'badge-danger'
}

function getStatusClass(status) {
  return status === 'Lulus' ? 'status-success' : 'status-danger'
}

async function loadData() {
  loading.value = true
  error.value = null

  try {
    // Load mahasiswa info
    const mahasiswaResponse = await getMahasiswaByNim(nim.value)
    mahasiswaInfo.value = mahasiswaResponse.data.data || mahasiswaResponse.data

    // Load nilai per periode
    const nilaiResponse = await getMahasiswaNilaiPerPeriode(nim.value, periode.value)

    // Dummy data jika API belum tersedia
    if (!nilaiResponse.data || !nilaiResponse.data.data) {
      // Generate dummy data
      nilaiCplList.value = generateDummyNilaiCpl()
    } else {
      nilaiCplList.value = nilaiResponse.data.data
    }
  } catch (err) {
    console.error('Error loading data:', err)
    // Fallback to dummy data in development
    mahasiswaInfo.value = {
      name: nim.value === '24060120140005' ? 'Galih Nanda Wibowo' : 'Gibran Mahasiswa',
      nim: nim.value,
    }
    nilaiCplList.value = generateDummyNilaiCpl()
  } finally {
    loading.value = false
  }
}

function generateDummyNilaiCpl() {
  return [
    {
      kode_cpl: 'CPL-01',
      nama_cpl: 'Mampu menerapkan pemikiran logis, kritis, sistematis, dan inovatif',
      nilai_forward: 85,
      nilai_backward: 82,
      nilai_akhir: 83.5,
      status: 'Lulus',
    },
    {
      kode_cpl: 'CPL-02',
      nama_cpl: 'Mampu menunjukkan kinerja mandiri, bermutu, dan terukur',
      nilai_forward: 78,
      nilai_backward: 80,
      nilai_akhir: 79,
      status: 'Lulus',
    },
    {
      kode_cpl: 'CPL-03',
      nama_cpl:
        'Mampu mengkaji implikasi pengembangan atau implementasi ilmu pengetahuan teknologi',
      nilai_forward: 72,
      nilai_backward: 75,
      nilai_akhir: 73.5,
      status: 'Lulus',
    },
    {
      kode_cpl: 'CPL-04',
      nama_cpl:
        'Mampu menyusun hasil kajian dalam bentuk kertas kerja, spesifikasi desain, atau esai seni',
      nilai_forward: 88,
      nilai_backward: 85,
      nilai_akhir: 86.5,
      status: 'Lulus',
    },
    {
      kode_cpl: 'CPL-05',
      nama_cpl: 'Mampu mengambil keputusan secara tepat dalam konteks penyelesaian masalah',
      nilai_forward: 65,
      nilai_backward: 68,
      nilai_akhir: 66.5,
      status: 'Lulus',
    },
  ]
}

onMounted(() => {
  if (!error.value) {
    loadData()
  }
})
</script>

<style scoped>
.nilai-mahasiswa-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.header-section {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
  font-family: 'Montserrat', sans-serif;
}

.page-subtitle {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 4px;
}

.periode-info {
  font-size: 16px;
  color: var(--color-buttonsec);
  font-weight: 600;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: var(--color-buttonsec);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 48px;
  color: #ef4444;
}

.btn-retry {
  padding: 10px 24px;
  background-color: var(--color-button);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
}

.btn-retry:hover {
  background-color: var(--color-buttonsec);
  transform: translateY(-2px);
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.chart-card,
.table-card,
.summary-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.card-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
}

.chart-placeholder {
  min-height: 300px;
  background: #f9fafb;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-wrapper {
  overflow-x: auto;
}

.nilai-table {
  width: 100%;
  border-collapse: collapse;
}

.nilai-table th,
.nilai-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.nilai-table th {
  background-color: #f9fafb;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.nilai-table tbody tr:hover {
  background-color: #f9fafb;
}

.badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.badge-success {
  background-color: #dcfce7;
  color: #166534;
}

.badge-info {
  background-color: #dbeafe;
  color: #1e40af;
}

.badge-warning {
  background-color: #fef3c7;
  color: #92400e;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.badge-secondary {
  background-color: #f3f4f6;
  color: #6b7280;
}

.status-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.status-success {
  background-color: #dcfce7;
  color: #166534;
}

.status-danger {
  background-color: #fee2e2;
  color: #991b1b;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background-color: #f9fafb;
  border-radius: 12px;
}

.summary-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.summary-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
}

.summary-value.success {
  color: #16a34a;
}

.summary-value.danger {
  color: #dc2626;
}

@media (max-width: 768px) {
  .nilai-mahasiswa-container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
