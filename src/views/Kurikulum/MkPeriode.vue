<template>
  <div class="mk-periode-container">
    <!-- Page Header -->
    <div class="page-title">
      <h2>Manajemen MK - Periode</h2>
      <p class="subtitle">Kelola mata kuliah per periode untuk Kurikulum: {{ idKurikulum }}</p>
    </div>

    <!-- Filters Section -->
    <div class="filters-container">
      <div class="filter-item">
        <label class="filter-label">
          <i class="ri-calendar-line"></i>
          Periode Akademik
        </label>
        <select v-model="selectedPeriode" @change="loadMkPeriode" class="filter-select">
          <option value="">Pilih Periode</option>
          <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">
            {{ p.id_periode }}
          </option>
        </select>
      </div>
      <div class="filter-actions">
        <button
          v-if="canManageKurikulumMk"
          class="btn-add"
          @click="openAddModal"
          :disabled="!selectedPeriode"
        >
          <i class="ri-add-circle-line"></i>
          Tambah MK
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="ri-loader-4-line spin-icon"></i>
      <span>Memuat data MK-Periode...</span>
    </div>

    <!-- Table Section -->
    <div v-else-if="filteredList.length > 0" class="table-section">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>
                <div class="th-content">No.</div>
              </th>
              <th>
                <div class="th-content">Kode MK</div>
              </th>
              <th>
                <div class="th-content">Nama Mata Kuliah</div>
              </th>
              <th>
                <div class="th-content">SKS</div>
              </th>
              <th>
                <div class="th-content">Jenis MK</div>
              </th>
              <th v-if="canManageKurikulumMk">
                <div class="th-content">Aksi</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mp, idx) in paginatedList" :key="mp.id_mk_periode" class="table-row">
              <td>
                <div class="td-content">
                  <span class="row-number">{{ (currentPage - 1) * itemsPerPage + idx + 1 }}</span>
                </div>
              </td>
              <td>
                <div class="td-content">
                  <span class="mk-code">{{ mp.kode_mk }}</span>
                </div>
              </td>
              <td>
                <div class="td-content">
                  <span class="mk-name">{{ getMataKuliahNama(mp.kode_mk) }}</span>
                </div>
              </td>
              <td>
                <div class="td-content">
                  <input
                    type="number"
                    class="input-sks"
                    v-model.number="mp._editable_sks"
                    min="0"
                    :disabled="!canManageKurikulumMk"
                  />
                </div>
              </td>
              <td>
                <div class="td-content">
                  <select
                    class="select-jenis"
                    v-model="mp._editable_jenis"
                    :disabled="!canManageKurikulumMk"
                  >
                    <option value="Wajib">Wajib</option>
                    <option value="Pilihan">Pilihan</option>
                  </select>
                </div>
              </td>
              <td v-if="canManageKurikulumMk">
                <div class="td-content">
                  <div class="action-buttons">
                    <button class="btn-action btn-save" @click="saveRow(mp)">
                      <i class="ri-save-line"></i>
                    </button>
                    <button class="btn-action btn-delete" @click="deleteRow(mp)">
                      <i class="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination Controls -->
      <div v-if="filteredList.length > itemsPerPage" class="pagination-container">
        <div class="pagination-info">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, filteredList.length) }} dari
          {{ filteredList.length }} mata kuliah
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" @click="previousPage" :disabled="currentPage === 1">
            <i class="ri-arrow-left-s-line"></i>
            Sebelumnya
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in totalPages"
              :key="page"
              class="pagination-page"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
            Selanjutnya
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="!isLoading" class="empty-state">
      <i class="ri-inbox-line"></i>
      <h3>Belum Ada Data</h3>
      <p>Belum ada MK-periode untuk periode ini.</p>
    </div>

    <!-- Modal for add MK-periode -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <i class="ri-add-circle-line"></i>
            <h3>Tambah MK-Periode</h3>
          </div>
          <button class="modal-close" @click="closeAddModal">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              <i class="ri-book-line"></i>
              Kode Mata Kuliah
            </label>
            <input
              class="form-input"
              v-model="newMK.kode_mk"
              placeholder="Masukkan kode MK atau pilih dari list"
            />
            <select
              v-if="availableMKForAdd.length"
              class="form-input"
              v-model="selectedNewKodeMk"
              @change="onSelectNewKode"
              style="margin-top: 8px"
            >
              <option value="">Pilih MK yang belum terdaftar di periode ini</option>
              <option v-for="mk in availableMKForAdd" :key="mk.kode_mk" :value="mk.kode_mk">
                {{ mk.kode_mk }} - {{ mk.nama_mk }}
              </option>
            </select>
            <div v-else class="form-help">
              <i class="ri-information-line"></i>
              Semua mata kuliah sudah terdaftar di periode ini atau tidak ada MK tersedia.
            </div>
          </div>
          <div v-if="!mkStore.getMKByKode(newMK.kode_mk)" class="form-group">
            <label class="form-label">
              <i class="ri-text"></i>
              Nama MK (baru)
            </label>
            <input
              class="form-input"
              v-model="newMK.nama_mk"
              placeholder="Masukkan nama mata kuliah jika kode baru"
            />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="ri-numbers-line"></i>
              SKS
            </label>
            <input class="form-input" type="number" v-model.number="newMK.sks" min="0" />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="ri-list-check"></i>
              Jenis MK
            </label>
            <select class="form-input" v-model="newMK.jenis_mk">
              <option value="Wajib">Wajib</option>
              <option value="Pilihan">Pilihan</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeAddModal">
            <i class="ri-close-line"></i>
            Batal
          </button>
          <button class="btn-save" @click="addMkPeriode">
            <i class="ri-add-line"></i>
            Tambah MK
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { usePermissions } from '@/composables/usePermissions'
import { useMKStore } from '@/stores/mataKuliah'
import {
  getMkPeriodeList,
  addMkPeriode as apiAddMkPeriode,
  updateMkPeriode,
  deleteMkPeriode,
  getPeriodeList,
} from '@/api'

const route = useRoute()
const idKurikulum = route.params.id
const nilaiMkStore = useNilaiMkStore()
const mkStore = useMKStore()

const isLoading = ref(false)
const showAddModal = ref(false)
const selectedPeriode = ref('')
const newMK = ref({ kode_mk: '', nama_mk: '', sks: 3, jenis_mk: 'Wajib' })
const selectedNewKodeMk = ref('')

const periodeList = ref([])

const mataKuliahList = computed(() => mkStore.mataKuliahList)
const availableMKForAdd = computed(() => {
  if (!mataKuliahList.value || mataKuliahList.value.length === 0) return []
  const existingKode = new Set(
    mkPeriodeList.value.map((mp) => String(mp.kode_mk).trim().toUpperCase()),
  )
  // Filter mataKuliahList to those not already in mkPeriode for selectedPeriode (and same kurikulum)
  return mataKuliahList.value.filter((mk) => {
    const kode = String(mk.kode_mk || mk.kode || mk.id)
      .trim()
      .toUpperCase()
    return !existingKode.has(kode)
  })
})

async function loadPeriode() {
  try {
    const resp = await getPeriodeList()
    if (resp?.data && resp.data.success) periodeList.value = resp.data.data
    else if (resp?.data && Array.isArray(resp.data)) periodeList.value = resp.data
  } catch (err) {
    console.error('Error loading periode list', err)
  }
}

const mkPeriodeList = ref([])
const filteredList = computed(() =>
  mkPeriodeList.value.filter(
    (mp) =>
      String(mp.id_kurikulum) === String(idKurikulum) &&
      String(mp.id_periode) === String(selectedPeriode.value),
  ),
)

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(filteredList.value.length / itemsPerPage))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredList.value.slice(start, end)
})

// Pagination functions
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function getMataKuliahNama(kode_mk) {
  return mkStore.getMataKuliahNama(kode_mk)
}

async function loadMkPeriode() {
  if (!idKurikulum || !selectedPeriode.value) {
    mkPeriodeList.value = []
    return
  }
  currentPage.value = 1
  isLoading.value = true
  try {
    // Use API to fetch filtered list by id_kurikulum + id_periode if supported
    const resp = await getMkPeriodeList({
      id_kurikulum: idKurikulum,
      id_periode: selectedPeriode.value,
    })
    let data = null
    if (resp?.data && resp.data.success) data = resp.data.data
    else if (resp?.data && Array.isArray(resp.data)) data = resp.data
    mkPeriodeList.value = Array.isArray(data) ? data : data ? [data] : []
    // Prepare editable fields
    mkPeriodeList.value.forEach((mp) => {
      mp._editable_sks = mp.sks || 0
      mp._editable_jenis = mp.jenis_mk || 'Wajib'
    })
    // Optionally, refresh global store list
    await nilaiMkStore.fetchMkPeriodeList()
  } catch (err) {
    console.error('Error loading mk-periode:', err)
    mkPeriodeList.value = []
  } finally {
    isLoading.value = false
  }
}

function openAddModal() {
  showAddModal.value = true
  newMK.value = { kode_mk: '', nama_mk: '', sks: 3, jenis_mk: 'Wajib' }
}

function closeAddModal() {
  showAddModal.value = false
  selectedNewKodeMk.value = ''
}

function onSelectNewKode() {
  if (selectedNewKodeMk.value) newMK.value.kode_mk = selectedNewKodeMk.value
}

async function addMkPeriode() {
  if (!selectedPeriode.value) {
    alert('Pilih periode terlebih dahulu')
    return
  }
  if (!newMK.value.kode_mk) {
    alert('Masukkan kode MK')
    return
  }
  try {
    const payload = {
      id_kurikulum: idKurikulum,
      kode_mk: newMK.value.kode_mk,
      id_periode: selectedPeriode.value,
      sks: Number(newMK.value.sks),
      jenis_mk: newMK.value.jenis_mk,
    }
    // If MK not found in MK store, optionally create MK first
    const existingMk = mkStore.getMKByKode(newMK.value.kode_mk)
    if (!existingMk) {
      if (!newMK.value.nama_mk) {
        if (
          !confirm(
            'MK dengan kode ini tidak ditemukan. Apakah Anda ingin membuat MK baru tanpa nama?',
          )
        ) {
          return
        }
      }
      // Create MK in MK store to register it
      await mkStore.createMK({
        kode_mk: newMK.value.kode_mk,
        nama_mk: newMK.value.nama_mk || newMK.value.kode_mk,
      })
      // Refresh MK list so it is available in dropdowns
      await mkStore.fetchAllMK()
    }
    const resp = await apiAddMkPeriode(payload)
    if (resp.data && resp.data.success) {
      await loadMkPeriode()
      closeAddModal()
      alert('MK-periode berhasil ditambahkan')
    } else {
      alert('Gagal menambahkan MK-periode: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error adding mk-periode:', err)
    alert('Terjadi kesalahan saat menambahkan MK-periode')
  }
}

async function saveRow(mp) {
  try {
    const payload = { sks: Number(mp._editable_sks), jenis_mk: mp._editable_jenis }
    const resp = await updateMkPeriode(mp.id_mk_periode, payload)
    if (resp.data && resp.data.success) {
      mp.sks = payload.sks
      mp.jenis_mk = payload.jenis_mk
      alert('Perubahan disimpan')
      await loadMkPeriode()
    } else {
      alert('Gagal menyimpan perubahan: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error updating mk-periode:', err)
    alert('Terjadi kesalahan saat menyimpan perubahan')
  }
}

async function deleteRow(mp) {
  if (!confirm('Hapus MK-periode ini?')) return
  try {
    const resp = await deleteMkPeriode(mp.id_mk_periode)
    if (resp.data && resp.data.success) {
      await loadMkPeriode()
      alert('MK-periode dihapus')
    } else {
      alert('Gagal menghapus: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error deleting mk-periode:', err)
    alert('Terjadi kesalahan saat menghapus MK-periode')
  }
}

onMounted(async () => {
  await loadPeriode()
  await mkStore.fetchAllMK()
  await nilaiMkStore.fetchMkPeriodeList()
})

const { canManageKurikulumMk, isAdmin, isDosen } = usePermissions()
</script>

<style scoped>
/* Container */
.mk-periode-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Montserrat', sans-serif;
}

/* Page Title */
.page-title {
  margin-bottom: 24px;
}

.page-title h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
  font-family: 'Montserrat', sans-serif;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

/* Filters */
.filters-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.filter-label i {
  font-size: 18px;
  color: var(--spmi-c-green2);
}

.filter-select {
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:hover {
  border-color: var(--spmi-c-green2);
}

.filter-select:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn-add {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.4);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-add i {
  font-size: 18px;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  font-size: 16px;
}

.loading-state i {
  font-size: 32px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Table Section */
.table-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
}

.data-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 0;
  text-align: left;
  font-weight: 600;
  color: var(--spmi-c-dgray);
  border: none;
}

.th-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.data-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.data-table tbody tr:hover {
  background-color: #f9fafb;
}

.data-table td {
  padding: 0;
  border: none;
}

.td-content {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--color-text);
}

.row-number {
  font-weight: 600;
  color: #6b7280;
}

.mk-code {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.mk-name {
  font-weight: 500;
  color: var(--color-text);
}

/* Form Inputs in Table */
.input-sks,
.select-jenis {
  width: 100%;
  padding: 8px 12px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  background: white;
  transition: all 0.3s ease;
}

.input-sks:hover:not(:disabled),
.select-jenis:hover:not(:disabled) {
  border-color: var(--spmi-c-green2);
}

.input-sks:focus,
.select-jenis:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.1);
}

.input-sks:disabled,
.select-jenis:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.input-sks {
  max-width: 80px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1.5px solid var(--color-text);
  color: var(--color-text);
}

.btn-action:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  transform: scale(1.05);
}

.btn-action i {
  font-size: 16px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  color: #9ca3af;
  font-family: 'Montserrat', sans-serif;
}

.empty-state i {
  font-size: 64px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 2px solid var(--color-border2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title i {
  font-size: 28px;
  color: var(--spmi-c-green2);
}

.modal-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: white;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 20px;
}

.modal-close:hover {
  background: #fee2e2;
  color: #dc2626;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.form-label i {
  font-size: 18px;
  color: var(--spmi-c-green2);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  background: white;
  transition: all 0.3s ease;
}

.form-input:hover {
  border-color: #d1d5db;
}

.form-input:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.1);
}

.form-help {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #6b7280;
}

.form-help i {
  font-size: 16px;
  color: #9ca3af;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 2px solid var(--color-border2);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f9fafb;
}

.btn-cancel {
  padding: 12px 24px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.btn-save {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-save:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.4);
}

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-top: 2px solid #f3f4f6;
  gap: 20px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  padding: 10px 18px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f9fafb;
}

.pagination-pages {
  display: flex;
  gap: 6px;
}

.pagination-page {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-page:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.pagination-page.active {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-container {
    flex-direction: column;
  }

  .filter-item {
    min-width: 100%;
  }
}

@media (max-width: 768px) {
  .page-title h2 {
    font-size: 24px;
  }

  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }

  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-controls {
    width: 100%;
    justify-content: center;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
