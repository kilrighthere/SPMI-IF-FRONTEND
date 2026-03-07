<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'

// Import stores
import { useCPMKStore } from '@/stores/cpmk'
import { useCPLStore } from '@/stores/cpl'
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePermissions } from '@/composables/usePermissions'
import TablePagination from '@/components/TablePagination.vue'

// Initialize stores
const cpmkStore = useCPMKStore()
const cplStore = useCPLStore()
const kurikulumStore = useKurikulumStore()
const route = useRoute()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Data untuk CPMK
const cpmkList = computed(() => cpmkStore.cpmkList)
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => cpmkStore.isLoading || cplStore.isLoading)
const error = ref('') // Mengubah dari computed ke ref untuk kontrol lebih baik
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const totalItems = computed(() => cpmkList.value.length)
const totalPages = computed(() =>
  showAll.value ? 1 : Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

const paginatedCpmkList = computed(() => {
  if (showAll.value) return cpmkList.value
  const start = (currentPage.value - 1) * itemsPerPage
  return cpmkList.value.slice(start, start + itemsPerPage)
})

// Form untuk tambah/edit CPMK - sesuai format baru
const form = ref({
  id_cpmk: '',
  deskripsi: '',
  id_cpl: '',
})

// Form validation state
const formErrors = ref({
  id_cpmk: '',
  deskripsi: '',
  id_cpl: '',
})

const isEditing = ref(false)
const showForm = ref(false)

// Fetch data CPMK dari store
const fetchCPMK = async () => {
  await cpmkStore.fetchAllCPMK()
}

// Fetch data CPL untuk dropdown dari store
const fetchCPL = async () => {
  await cplStore.fetchAllCPL()
}

// Validasi form sebelum submit
const validateForm = () => {
  let isValid = true
  formErrors.value = { id_cpmk: '', deskripsi: '', id_cpl: '' }

  if (!form.value.id_cpmk.trim()) {
    formErrors.value.id_cpmk = 'ID CPMK tidak boleh kosong'
    isValid = false
  }

  if (!form.value.deskripsi.trim()) {
    formErrors.value.deskripsi = 'Deskripsi tidak boleh kosong'
    isValid = false
  }

  if (!form.value.id_cpl) {
    formErrors.value.id_cpl = 'CPL harus dipilih'
    isValid = false
  }

  return isValid
}

// Tambah CPMK baru menggunakan store
const saveCPMK = async () => {
  try {
    // Reset error message first
    error.value = ''

    // Validate form before submission
    if (!validateForm()) {
      return // Stop if validation fails
    }

    if (isEditing.value) {
      await cpmkStore.editCPMK(form.value.id_cpmk, form.value)
    } else {
      await cpmkStore.createCPMK(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving CPMK:', err)
    error.value = isEditing.value ? 'Gagal mengupdate data' : 'Gagal menambah data'
  }
}

// Edit CPMK
const editCPMK = (cpmk) => {
  form.value = { ...cpmk }
  isEditing.value = true
  showForm.value = true

  // Scroll ke bagian atas halaman dimana form berada
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// Hapus CPMK
const removeCPMK = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus CPMK ini?')) {
    await cpmkStore.removeCPMK(id)
  }
}

// Reset form dan pesan error
const resetForm = () => {
  form.value = { id_cpmk: '', deskripsi: '', id_cpl: '' }
  formErrors.value = { id_cpmk: '', deskripsi: '', id_cpl: '' }
  error.value = ''
  isEditing.value = false
  showForm.value = false
}

// Hapus pesan error saja (tetap simpan data form)
const clearError = () => {
  error.value = ''
}

const setCurrentPage = (page) => {
  currentPage.value = page
}

const setShowAll = (value) => {
  showAll.value = value
}

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

// Mendapatkan nama CPL berdasarkan ID
const getCPLName = (cplId) => {
  const cpl = cplList.value.find((item) => item.id === cplId || item.id_cpl === cplId)
  return cpl ? `${cpl.id_cpl}` : 'N/A'
}

// Load data saat komponen dimuat
onMounted(async () => {
  // Fetch kurikulum data by ID from route params
  const kurikulumId = route.params.id
  if (kurikulumId) {
    await kurikulumStore.fetchKurikulumById(kurikulumId)
  }
  fetchCPMK()
  fetchCPL()
})
</script>

<template>
  <div class="cpmk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
        <button
          class="btn-add"
          :class="{ 'is-cancel': showForm }"
          @click="showForm ? resetForm() : (showForm = true)"
          v-if="can('cpmk', 'create')"
        >
          {{ showForm ? 'Batal' : 'Tambah CPMK' }}
        </button>
      </div>

      <!-- Form tambah/edit CPMK -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>ID CPMK</label>
          <input
            type="text"
            v-model="form.id_cpmk"
            placeholder="Kode CPMK (contoh: CPMK-01)"
            :class="{ 'input-error': formErrors.id_cpmk }"
          />
          <div v-if="formErrors.id_cpmk" class="error-text">{{ formErrors.id_cpmk }}</div>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            placeholder="Deskripsi CPMK"
            :class="{ 'input-error': formErrors.deskripsi }"
          ></textarea>
          <div v-if="formErrors.deskripsi" class="error-text">{{ formErrors.deskripsi }}</div>
        </div>
        <div class="form-group">
          <label>CPL</label>
          <select v-model="form.id_cpl" :class="{ 'input-error': formErrors.id_cpl }">
            <option value="">Pilih CPL</option>
            <option v-for="cpl in cplList" :key="cpl.id_cpl" :value="cpl.id_cpl">
              {{ cpl.id_cpl }} - {{ cpl.deskripsi }}
            </option>
          </select>
          <div v-if="formErrors.id_cpl" class="error-text">{{ formErrors.id_cpl }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveCPMK">
            {{ isEditing ? 'Perbarui' : 'Simpan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- CPMK List -->
      <div v-else class="cpmk-content">
        <p>
          Capaian Pembelajaran Mata Kuliah (CPMK) adalah kemampuan yang diharapkan dimiliki oleh
          mahasiswa setelah menyelesaikan suatu mata kuliah.
        </p>

        <div v-if="totalItems === 0" class="empty-state">Belum ada data CPMK.</div>

        <div v-else class="table-wrapper">
          <table class="cpmk-table">
            <thead>
              <tr>
                <th class="head-id">ID CPMK</th>
                <th class="head-desc">Deskripsi</th>
                <th class="head-cpl">CPL</th>
                <th v-if="can('cpmk', 'edit')" class="aksi-title">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpmk in paginatedCpmkList" :key="cpmk.id_cpmk" class="cpmk-item">
                <td class="cpmk-id">{{ cpmk.id_cpmk }}</td>
                <td class="desk-item">{{ cpmk.deskripsi }}</td>
                <td class="cpl-item">{{ getCPLName(cpmk.id_cpl) }}</td>
                <td class="action-button" v-if="can('cpmk', 'edit')">
                  <button class="btn-edit" @click="editCPMK(cpmk)">
                    <i class="ri-edit-line"></i>
                    Edit
                  </button>
                  <button class="btn-delete" @click="removeCPMK(cpmk.id_cpmk)">
                    <i class="ri-delete-bin-line"></i>
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>

          <TablePagination
            :total-items="totalItems"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :show-all="showAll"
            item-label="CPMK"
            @update:current-page="setCurrentPage"
            @update:show-all="setShowAll"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-box {
  background: white;
  border-radius: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-box h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.cpmk-content {
  line-height: 1.6;
}

.cpmk-content p {
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.table-wrapper {
  overflow-x: auto;
}

.cpmk-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
  background: white;
}

.cpmk-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.cpmk-table th {
  padding: 16px 14px;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
  text-align: center;
}

.cpmk-table th.head-id,
.cpmk-table th.head-desc,
.cpmk-table th.head-cpl {
  text-align: left;
}

.cpmk-table td {
  padding: 16px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  color: #4b5563;
  font-size: 14px;
  text-align: left;
}

.cpmk-table .cpmk-id {
  font-weight: 700;
  color: var(--color-button);
  width: 120px;
}

.cpmk-table .desk-item {
  line-height: 1.6;
}

.cpmk-table .cpl-item {
  font-weight: 600;
  color: #475569;
  width: 140px;
}

.cpmk-table .action-button {
  text-align: center;
  width: 180px;
  white-space: nowrap;
}

.cpmk-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.cpmk-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.cpmk-table tbody tr:last-child td {
  border-bottom: none;
}

.form-container {
  background: #f9fafb;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
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

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input.input-error,
.form-group textarea.input-error,
.form-group select.input-error {
  border-color: #ef4444;
}

.form-group input:focus,
.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  font-family: 'Montserrat', sans-serif;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-add,
.btn-save,
.btn-cancel,
.btn-edit,
.btn-delete {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.btn-add {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-add:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-add.is-cancel:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.3);
}

.btn-save {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-save:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-cancel {
  background: white;
  color: #ef4444;
  border-color: #fca5a5;
}

.btn-cancel:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
}

.btn-edit {
  background: white;
  color: var(--color-text);
  border-color: var(--color-button);
  padding: 6px 12px;
  font-size: 13px;
}

.btn-edit:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
}

.btn-delete {
  background: white;
  color: var(--color-button-hover);
  border-color: #fca5a5;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-delete:hover {
  background: var(--color-button-hover);
  color: white;
  border-color: var(--color-button-hover);
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

.error-message {
  color: #b91c1c;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-style: italic;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
