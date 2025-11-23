<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { useKurikulumStore } from '@/stores/kurikulum'
import { useMKStore } from '@/stores/mataKuliah'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const route = useRoute()

// Initialize stores
const nilaiMkStore = useNilaiMkStore()
const kurikulumStore = useKurikulumStore()
const mkStore = useMKStore()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, userId, canManageKurikulumMk } = usePermissions()
const currentUserNim = userId

// Data
const isLoading = computed(() => nilaiMkStore.isLoading)
const error = computed(() => nilaiMkStore.error)
const selectedKurikulum = ref(route.params.id || '')

// Modal dan form
const showModal = ref(false)
const formData = ref({
  id_periode: '',
  kode_mk: '',
  nim: '',
  nilai_akhir: '',
})

// Filter dan pencarian
const searchQuery = ref('')

// Computed
const periodeList = computed(() => nilaiMkStore.periodeList)
const selectedPeriode = computed({
  get: () => nilaiMkStore.selectedPeriode,
  set: (value) => nilaiMkStore.setPeriode(value),
})

// Data nilai yang difilter berdasarkan periode yang dipilih
const filteredNilaiList = computed(() => {
  let filtered = nilaiMkStore.filteredNilaiByPeriode

  // Filter berdasarkan kurikulum jika ada
  if (selectedKurikulum.value) {
    filtered = filtered.filter((nilai) => nilai.id_kurikulum === selectedKurikulum.value)
  }

  // Filter berdasarkan pencarian
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (nilai) =>
        nilai.kode_mk.toLowerCase().includes(query) ||
        nilai.nim.toLowerCase().includes(query) ||
        nilaiMkStore.getMataKuliahNama(nilai.kode_mk).toLowerCase().includes(query) ||
        nilaiMkStore.getMahasiswaNama(nilai.nim).toLowerCase().includes(query),
    )
  }

  // Filter untuk mahasiswa (hanya tampilkan nilai mereka sendiri)
  if (isMahasiswa.value && currentUserNim.value) {
    filtered = filtered.filter((nilai) => nilai.nim === currentUserNim.value)
  }

  return filtered
})

// Available mata kuliah untuk dropdown
const availableMataKuliah = computed(() => mkStore.mataKuliahList)

// Get current kurikulum name
function getCurrentKurikulumName() {
  if (!selectedKurikulum.value) return 'Semua Kurikulum'
  const kurikulum = kurikulumStore.kurikulumList.find(
    (k) => k.id_kurikulum === selectedKurikulum.value,
  )
  return kurikulum
    ? `${kurikulum.nama_kurikulum} (${kurikulum.id_kurikulum})`
    : `Kurikulum ${selectedKurikulum.value}`
}

// Modal functions
function openAddModal() {
  formData.value = {
    id_periode: selectedPeriode.value,
    kode_mk: '',
    nim: '',
    nilai_akhir: '',
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formData.value = {
    id_periode: '',
    kode_mk: '',
    nim: '',
    nilai_akhir: '',
  }
}

// Submit form
async function submitForm() {
  try {
    if (!formData.value.kode_mk || !formData.value.nim || !formData.value.nilai_akhir) {
      alert('Mohon lengkapi semua field yang diperlukan')
      return
    }

    // Validasi nilai range 0-100
    const nilai = parseFloat(formData.value.nilai_akhir)
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Nilai harus berupa angka antara 0-100')
      return
    }

    // Format nilai dengan 2 desimal
    formData.value.nilai_akhir = nilai.toFixed(2)

    console.log('Submitting nilai:', formData.value)

    const result = await nilaiMkStore.createNilai(formData.value)

    if (result && result.success) {
      alert(
        `Nilai berhasil ditambahkan!\nNilai: ${formData.value.nilai_akhir}\nHuruf Mutu: ${nilaiMkStore.getHurufMutu(formData.value.nilai_akhir)}`,
      )
      closeModal()
    } else {
      alert('Gagal menambahkan nilai')
    }
  } catch (err) {
    console.error('Error submitting nilai:', err)
    alert('Terjadi kesalahan saat menyimpan nilai: ' + (err.message || err))
  }
}

// Load data
async function loadData() {
  await Promise.all([
    nilaiMkStore.fetchAllData(),
    kurikulumStore.fetchAllKurikulum(),
    mkStore.fetchAllMK(),
  ])
}

// Get CSS class untuk huruf mutu
function getHurufMutuClass(huruf) {
  // Only expect A/B/C/D/E values from the centralized store mapping
  if (huruf === 'A') return 'huruf-a'
  if (huruf === 'B') return 'huruf-b'
  if (huruf === 'C') return 'huruf-c'
  if (huruf === 'D') return 'huruf-d'
  if (huruf === 'E') return 'huruf-e'
  return 'huruf-default'
}

// Load data saat komponen dimuat
onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="nilai-matkul-container">
    <div class="page-header">
      <h1 class="page-title">Nilai Mata Kuliah</h1>
      <p class="page-subtitle">{{ getCurrentKurikulumName() }}</p>
    </div>

    <!-- Period Selection -->
    <div class="period-section">
      <div class="period-filter">
        <label for="periode" class="period-label">Periode:</label>
        <select id="periode" v-model="selectedPeriode" class="period-select">
          <option value="">Pilih Periode</option>
          <option
            v-for="periode in periodeList"
            :key="periode.id_periode"
            :value="periode.id_periode"
          >
            {{ periode.id_periode }}
          </option>
        </select>
      </div>

      <!-- Action Button -->
      <div class="action-section" v-if="canManageKurikulumMk">
        <button
          @click="openAddModal"
          class="btn-primary"
          :disabled="!selectedPeriode"
          :title="!selectedPeriode ? 'Pilih periode terlebih dahulu' : 'Tambah nilai baru'"
        >
          <i class="ri-add-line"></i>
          Tambah Nilai
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="error-container">
      <i class="ri-error-warning-line"></i>
      <p>{{ error }}</p>
      <button @click="loadData" class="btn-retry">Coba Lagi</button>
    </div>

    <!-- Search & Content -->
    <div v-else-if="selectedPeriode" class="content-section">
      <!-- Search -->
      <div class="search-section">
        <div class="search-box">
          <i class="ri-search-line"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Cari berdasarkan kode MK, NIM, atau nama..."
            class="search-input"
          />
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <div class="table-header">
          <h2>Daftar Nilai - Periode {{ selectedPeriode }}</h2>
          <div class="table-info">
            <span class="total-items">Total: {{ filteredNilaiList.length }} data nilai</span>
          </div>
        </div>

        <div v-if="filteredNilaiList.length === 0" class="empty-state">
          <i class="ri-file-list-3-line"></i>
          <h3>Belum ada data nilai</h3>
          <p>Periode {{ selectedPeriode }} belum memiliki data nilai</p>
        </div>

        <div v-else class="table-wrapper">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode MK</th>
                <th>Mata Kuliah</th>
                <th>NIM</th>
                <th>Nama Mahasiswa</th>
                <th>Nilai Akhir</th>
                <th>Huruf Mutu</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(nilai, index) in filteredNilaiList"
                :key="`${nilai.id_periode}-${nilai.kode_mk}-${nilai.nim}`"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <span class="kode-mk">{{ nilai.kode_mk }}</span>
                </td>
                <td>
                  <span class="nama-mk">{{ nilaiMkStore.getMataKuliahNama(nilai.kode_mk) }}</span>
                </td>
                <td>
                  <span class="nim">{{ nilai.nim }}</span>
                </td>
                <td>
                  <span class="nama-mhs">{{ nilaiMkStore.getMahasiswaNama(nilai.nim) }}</span>
                </td>
                <td>
                  <span class="nilai-akhir">{{ nilaiMkStore.formatNilai(nilai.nilai_akhir) }}</span>
                </td>
                <td>
                  <span
                    class="huruf-mutu"
                    :class="getHurufMutuClass(nilaiMkStore.getHurufMutu(nilai.nilai_akhir))"
                  >
                    {{ nilaiMkStore.getHurufMutu(nilai.nilai_akhir) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State for No Period Selected -->
    <div v-else class="no-period-state">
      <i class="ri-calendar-line"></i>
      <h3>Pilih Periode</h3>
      <p>Silakan pilih periode untuk melihat data nilai mata kuliah</p>
    </div>

    <!-- Add Nilai Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Tambah Nilai Mata Kuliah</h3>
          <button class="modal-close" @click="closeModal">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="periode" class="form-label">Periode</label>
            <input
              type="text"
              id="periode"
              :value="selectedPeriode"
              class="form-input"
              disabled
              readonly
            />
          </div>

          <div class="form-group">
            <label for="mata-kuliah" class="form-label">Mata Kuliah *</label>
            <select id="mata-kuliah" v-model="formData.kode_mk" class="form-select" required>
              <option value="">Pilih Mata Kuliah</option>
              <option v-for="mk in availableMataKuliah" :key="mk.kode_mk" :value="mk.kode_mk">
                {{ mk.kode_mk }} - {{ mk.nama_mk }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="nim" class="form-label">NIM Mahasiswa *</label>
            <input
              type="text"
              id="nim"
              v-model="formData.nim"
              class="form-input"
              placeholder="Masukkan NIM mahasiswa"
              required
            />
          </div>

          <div class="form-group">
            <label for="nilai" class="form-label">Nilai Akhir *</label>
            <input
              type="number"
              id="nilai"
              v-model="formData.nilai_akhir"
              class="form-input"
              placeholder="0-100"
              min="0"
              max="100"
              step="0.01"
              required
            />
            <small class="form-help">
              Masukkan nilai 0-100. Contoh: 80 akan menjadi 80.00
              <br />Huruf mutu:
              {{ formData.nilai_akhir ? nilaiMkStore.getHurufMutu(formData.nilai_akhir) : '-' }}
            </small>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Batal</button>
          <button type="button" class="btn-primary" @click="submitForm">
            <i class="ri-save-line"></i>
            Simpan Nilai
          </button>
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
