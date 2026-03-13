<template>
  <div class="mk-periode-container">
    <div class="page-title">
      <h3>Manajemen MK - Periode</h3>
    </div>

    <div class="filters-container">
      <div class="filter-item">
        <label class="filter-label">
          <i class="ri-calendar-line"></i>
          Periode Akademik
        </label>
        <select v-model="selectedPeriode" @change="loadMkPeriode" class="filter-select">
          <option value="">Pilih Periode</option>
          <option
            v-for="periode in periodeList"
            :key="periode.id_periode"
            :value="periode.id_periode"
          >
            {{ periode.id_periode}}
          </option>
        </select>
      </div>

      <div class="filter-actions" v-if="canManageKurikulumMk">
        <button
          class="btn-add"
          :class="{ 'is-cancel': showForm }"
          @click="showForm ? resetForm() : openAddForm()"
          :disabled="!selectedPeriode && !showForm"
        >
          <i class="ri-add-line"></i>
          {{ showForm ? 'Batal' : 'Tambah MK-Periode' }}
        </button>
      </div>
    </div>

    <div v-if="showForm" class="form-container inline-form-container">
      <div class="form-group">
        <label>Kode dan Nama Mata Kuliah</label>
        <div ref="mkComboboxRef" class="combobox mk-combobox" :class="{ disabled: isEditing }">
          <input
            v-model="mkQuery"
            type="text"
            class="form-input field-box"
            :disabled="isEditing"
            autocomplete="off"
            role="combobox"
            aria-autocomplete="list"
            :aria-expanded="showMkOptions"
            aria-label="Cari mata kuliah"
            placeholder="Ketik kode/nama atau pilih dari daftar"
            @focus="showMkOptions = true"
            @input="handleMkInput"
          />
          <ul v-if="showMkOptions && !isEditing" class="combobox-options" role="listbox">
            <li
              v-for="mk in filteredMkOptions"
              :key="mk.kode_mk"
              class="combobox-option"
              role="option"
              @mousedown.prevent="selectMkOption(mk)"
            >
              {{ formatMkLabel(mk) }}
            </li>
            <li v-if="!filteredMkOptions.length" class="combobox-empty">
              Mata kuliah tidak ditemukan
            </li>
          </ul>
        </div>
        <div v-if="!isEditing && !availableMKForAdd.length" class="form-help">
          <i class="ri-information-line"></i>
          Semua mata kuliah sudah terdaftar di periode ini atau tidak ada MK tersedia.
        </div>
      </div>

      <div class="form-group">
        <label>SKS</label>
        <input class="form-input field-box" type="number" v-model.number="formMK.sks" min="0" />
      </div>

      <div class="form-group">
        <label>Jenis MK</label>
        <select class="form-input" v-model="formMK.jenis_mk">
          <option value="Wajib">Wajib</option>
          <option value="Pilihan">Pilihan</option>
        </select>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveForm">
          {{ isEditing ? 'Perbarui' : 'Simpan' }}
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <i class="ri-loader-4-line spin-icon"></i>
      <span>Memuat data MK-periode...</span>
    </div>

    <template v-else-if="filteredList.length">
      <div class="table-section">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>
                  <div class="th-content">No</div>
                </th>
                <th>
                  <div class="th-content th-kode">Kode MK</div>
                </th>
                <th>
                  <div class="th-content th-nama">Nama Mata Kuliah</div>
                </th>
                <th>
                  <div class="th-content th-sks">SKS</div>
                </th>
                <th>
                  <div class="th-content th-jenis">Jenis MK</div>
                </th>
                <th>
                  <div class="th-content">Aksi</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mp, index) in paginatedList" :key="mp.id_mk_periode">
                <td>
                  <div class="td-content row-number">
                    {{ (currentPage - 1) * itemsPerPage + index + 1 }}
                  </div>
                </td>
                <td>
                  <div class="td-content td-kode">
                    <span class="mk-code">{{ mp.kode_mk }}</span>
                  </div>
                </td>
                <td>
                  <div class="td-content td-nama mk-name">{{ getMataKuliahNama(mp.kode_mk) }}</div>
                </td>
                <td>
                  <div class="td-content td-sks">
                    <span class="sks-value">{{ mp.sks ?? 0 }}</span>
                  </div>
                </td>
                <td>
                  <div class="td-content td-jenis">
                    <span class="jenis-badge">{{ mp.jenis_mk || '-' }}</span>
                  </div>
                </td>
                <td>
                  <div class="td-content">
                    <div class="action-buttons" v-if="canManageKurikulumMk">
                      <button class="btn-action btn-edit" @click="startEdit(mp)">
                        <i class="ri-edit-line"></i>
                        Edit
                      </button>
                      <button class="btn-action btn-delete" @click="deleteRow(mp)">
                        <i class="ri-delete-bin-line"></i>
                        Hapus
                      </button>
                    </div>
                    <span v-else>-</span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <TablePagination
        :total-items="totalItems"
        :current-page="currentPage"
        :items-per-page="itemsPerPage"
        :show-all="showAll"
        item-label="mata kuliah"
        @update:current-page="setCurrentPage"
        @update:show-all="setShowAll"
      />
    </template>

    <div v-else class="empty-state">
      <i class="ri-inbox-line"></i>
      <h3>Belum Ada Data</h3>
      <p>Belum ada MK-periode untuk periode ini.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { usePermissions } from '@/composables/usePermissions'
import { useMKStore } from '@/stores/mataKuliah'
import TablePagination from '@/components/TablePagination.vue'
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
const showForm = ref(false)
const isEditing = ref(false)
const selectedPeriode = ref('')
const formMK = ref({
  id_mk_periode: null,
  kode_mk: '',
  nama_mk: '',
  sks: 3,
  jenis_mk: 'Wajib',
})
const mkQuery = ref('')
const showMkOptions = ref(false)
const mkComboboxRef = ref(null)

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

const formatMkLabel = (mk) => `${mk.kode_mk} - ${mk.nama_mk || 'Tanpa nama'}`

const filteredMkOptions = computed(() => {
  const term = mkQuery.value.trim().toLowerCase()
  if (!term) return availableMKForAdd.value
  return availableMKForAdd.value.filter((mk) => {
    const kode = String(mk.kode_mk || '').toLowerCase()
    const nama = String(mk.nama_mk || '').toLowerCase()
    const label = formatMkLabel(mk).toLowerCase()
    return kode.includes(term) || nama.includes(term) || label.includes(term)
  })
})

async function loadPeriode() {
  try {
    const resp = await getPeriodeList()
    if (resp?.data && resp.data.success) periodeList.value = resp.data.data
    else if (resp?.data && Array.isArray(resp.data)) periodeList.value = resp.data
  } catch (err) {}
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
const showAll = ref(false)
const totalItems = computed(() => filteredList.value.length)

const paginatedList = computed(() => {
  if (showAll.value) return filteredList.value
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return filteredList.value.slice(start, end)
})

const setCurrentPage = (page) => {
  currentPage.value = page
}

const setShowAll = (value) => {
  showAll.value = value
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
    // Optionally, refresh global store list
    await nilaiMkStore.fetchMkPeriodeList()
  } catch (err) {
    mkPeriodeList.value = []
  } finally {
    isLoading.value = false
  }
}

function openAddForm() {
  if (!selectedPeriode.value) return
  showForm.value = true
  isEditing.value = false
  formMK.value = {
    id_mk_periode: null,
    kode_mk: '',
    nama_mk: '',
    sks: 3,
    jenis_mk: 'Wajib',
  }
  mkQuery.value = ''
  showMkOptions.value = false
}

function resetForm() {
  showForm.value = false
  isEditing.value = false
  formMK.value = {
    id_mk_periode: null,
    kode_mk: '',
    nama_mk: '',
    sks: 3,
    jenis_mk: 'Wajib',
  }
  mkQuery.value = ''
  showMkOptions.value = false
}

function startEdit(mp) {
  formMK.value = {
    id_mk_periode: mp.id_mk_periode,
    kode_mk: mp.kode_mk,
    nama_mk: getMataKuliahNama(mp.kode_mk),
    sks: Number(mp.sks || 0),
    jenis_mk: mp.jenis_mk || 'Wajib',
  }
  isEditing.value = true
  showForm.value = true
  mkQuery.value = formMK.value.kode_mk
  showMkOptions.value = false

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
  const existing = mkStore.getMKByKode(formMK.value.kode_mk)
  if (existing) {
    mkQuery.value = formatMkLabel(existing)
  }
}

function selectMkOption(mk) {
  formMK.value.kode_mk = mk.kode_mk
  formMK.value.nama_mk = mk.nama_mk || ''
  mkQuery.value = formatMkLabel(mk)
  showMkOptions.value = false
}

function handleMkInput() {
  const term = mkQuery.value.trim()
  showMkOptions.value = true

  const lower = term.toLowerCase()
  const exact = availableMKForAdd.value.find((mk) => {
    const kode = String(mk.kode_mk || '').toLowerCase()
    const nama = String(mk.nama_mk || '').toLowerCase()
    const label = formatMkLabel(mk).toLowerCase()
    return kode === lower || nama === lower || label === lower
  })

  if (exact) {
    formMK.value.kode_mk = exact.kode_mk
    formMK.value.nama_mk = exact.nama_mk || ''
    return
  }

  formMK.value.kode_mk = term
}

function handleOutsideComboboxClick(event) {
  if (!showMkOptions.value) return
  const root = mkComboboxRef.value
  if (!root) return
  if (!root.contains(event.target)) {
    showMkOptions.value = false
  }
}

async function saveForm() {
  if (isEditing.value) {
    await saveEditInline()
    return
  }

  if (!selectedPeriode.value) {
    alert('Pilih periode terlebih dahulu')
    return
  }
  if (!formMK.value.kode_mk) {
    alert('Masukkan kode MK')
    return
  }
  try {
    const payload = {
      id_kurikulum: idKurikulum,
      kode_mk: formMK.value.kode_mk,
      id_periode: selectedPeriode.value,
      sks: Number(formMK.value.sks),
      jenis_mk: formMK.value.jenis_mk,
    }
    // If MK not found in MK store, optionally create MK first
    const existingMk = mkStore.getMKByKode(formMK.value.kode_mk)
    if (!existingMk) {
      if (!confirm('MK dengan kode ini tidak ditemukan. Lanjutkan membuat data MK baru?')) {
        return
      }
      // Create MK in MK store to register it
      await mkStore.createMK({
        kode_mk: formMK.value.kode_mk,
        nama_mk: formMK.value.kode_mk,
      })
      // Refresh MK list so it is available in dropdowns
      await mkStore.fetchAllMK()
    }
    const resp = await apiAddMkPeriode(payload)
    if (resp.data && resp.data.success) {
      await loadMkPeriode()
      resetForm()
      alert('MK-periode berhasil ditambahkan')
    } else {
      alert('Gagal menambahkan MK-periode: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    alert('Terjadi kesalahan saat menambahkan MK-periode')
  }
}

async function saveEditInline() {
  if (!formMK.value.id_mk_periode) return
  try {
    const payload = {
      sks: Number(formMK.value.sks || 0),
      jenis_mk: formMK.value.jenis_mk,
    }
    const resp = await updateMkPeriode(formMK.value.id_mk_periode, payload)
    if (resp.data && resp.data.success) {
      const row = mkPeriodeList.value.find(
        (item) => item.id_mk_periode === formMK.value.id_mk_periode,
      )
      if (row) {
        row.sks = payload.sks
        row.jenis_mk = payload.jenis_mk
      }
      alert('Perubahan disimpan')
      resetForm()
      await loadMkPeriode()
    } else {
      alert('Gagal menyimpan perubahan: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
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
    alert('Terjadi kesalahan saat menghapus MK-periode')
  }
}

onMounted(async () => {
  document.addEventListener('mousedown', handleOutsideComboboxClick)
  await loadPeriode()
  await mkStore.fetchAllMK()
  await nilaiMkStore.fetchMkPeriodeList()
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideComboboxClick)
})

const { canManageKurikulumMk } = usePermissions()
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
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.subtitle {
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  line-height: 1.6;
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

/* .filter-select {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
} */

.filter-select {
  position: relative;
  z-index: 20;
}

/* Memastikan teks di dalam option selalu terlihat */
.filter-select option,
.form-input option {
  background-color: #ffffff; /* Background putih */
  color: var(--color-text); /* Teks abu gelap/hitam agar terbaca */
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn-add {
  padding: 12px 24px;
  background: var(--color-button);
  color: white;
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
}

.btn-add:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-add.is-cancel:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.3);
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
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
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
  text-align: center;
  font-weight: 700;
  color: var(--color-text);
  border: none;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.th-content {
  padding: 16px 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 13px;
}

.data-table thead .th-kode,
.data-table thead .th-sks {
  justify-content: center;
  text-align: center;
}

.data-table thead .th-nama,
.data-table thead .th-jenis {
  justify-content: flex-start;
  text-align: left;
}

.data-table tbody tr {
  border-bottom: 1px solid #edf1e4;
  transition: all 0.2s ease;
}

/* .data-table tbody tr:nth-child(odd) {
  background: #ffffff;
}

.data-table tbody tr:nth-child(even) {
  background: #fafcf4;
} */

.data-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.data-table td {
  padding: 0;
  border: none;
}

.td-content {
  padding: 16px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  color: #4b5563;
  font-size: 14px;
}

.data-table tbody .td-kode,
.data-table tbody .td-sks {
  text-align: center !important;
}

.data-table tbody .td-nama,
.data-table tbody .td-jenis {
  text-align: left !important;
}

.row-number {
  font-weight: 600;
  color: #6b7280;
  text-align: center;
}

.td-content .mk-code {
  display: inline-block;
  font-weight: 700;
  color: var(--color-button);
  width: 120px;
  text-align: center;
}

.mk-name {
  display: block;
  width: 100%;
  font-weight: 500;
  color: var(--color-text);
}

.sks-value {
  display: inline-block;
  font-weight: 600;
  color: var(--color-button);
  width: 120px;
  text-align: center;
}

.jenis-badge {
  display: block;
  width: 100%;
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

.inline-form-container {
  margin-bottom: 24px;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 20px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  font-family: 'Montserrat', sans-serif;
}

.field-box {
  box-sizing: border-box;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 14px;
}

.mk-combobox {
  position: relative;
}

.mk-combobox.disabled {
  cursor: not-allowed;
}

.combobox-options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  box-sizing: border-box;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.combobox-option,
.combobox-empty {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
}

.combobox-option {
  cursor: pointer;
}

.combobox-option:hover {
  background: #f3f9df;
}

.combobox-empty {
  color: #6b7280;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
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
  justify-content: center;
}

.btn-action {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
  border: 1.5px solid;
}

.btn-action:hover {
  transform: translateY(-1px);
}

.btn-action i {
  font-size: 16px;
}

.btn-edit {
  border-color: var(--color-button);
  color: var(--color-text);
}

.btn-edit:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.25);
}

.btn-delete {
  border-color: #fca5a5;
  color: #b91c1c;
}

.btn-delete:hover {
  background: var(--color-button-hover);
  color: white;
  border-color: var(--color-button-hover);
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.28);
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
  padding: 8px 16px;
  background: var(--color-button);
  color: white;
  border: 1.5px solid var(--color-button);
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: none;
}

.btn-save:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
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
