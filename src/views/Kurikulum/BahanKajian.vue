<template>
  <div class="bk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Bahan Kajian (BK)</h3>
        <button
          class="btn-add"
          :class="{ 'is-cancel': showForm }"
          @click="showForm ? resetForm() : (showForm = true)"
          v-if="can('bahanKajian', 'create')"
        >
          {{ showForm ? 'Batal' : 'Tambah BK' }}
        </button>
      </div>

      <!-- Form tambah/edit BK -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>Kode BK</label>
          <input
            type="text"
            v-model="form.id_bk"
            placeholder="Kode BK (contoh: BK001)"
            :disabled="isEditing"
            :class="{ 'input-error': formErrors.id_bk }"
          />
          <div v-if="formErrors.id_bk" class="error-text">{{ formErrors.id_bk }}</div>
        </div>
        <div class="form-group">
          <label>Nama BK</label>
          <input
            type="text"
            v-model="form.nama"
            placeholder="Nama Bahan Kajian"
            :class="{ 'input-error': formErrors.nama }"
          />
          <div v-if="formErrors.nama" class="error-text">{{ formErrors.nama }}</div>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            placeholder="Deskripsi Bahan Kajian"
            :class="{ 'input-error': formErrors.deskripsi }"
          ></textarea>
          <div v-if="formErrors.deskripsi" class="error-text">{{ formErrors.deskripsi }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveBK">
            {{ isEditing ? 'Perbarui' : 'Simpan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- BK Content -->
      <div v-if="!isLoading" class="bk-content">
        <p>
          Bahan Kajian (BK) merupakan komponen-komponen keilmuan yang menjadi bahan dari mata kuliah
          dalam kurikulum program studi.
        </p>

        <div v-if="totalItems === 0" class="empty-state">Belum ada data Bahan Kajian.</div>

        <table v-else class="bk-table">
          <thead>
            <tr>
              <th class="head-id">Kode BK</th>
              <th class="head-name">Nama BK</th>
              <th class="head-desc">Deskripsi</th>
              <th v-if="can('bahanKajian', 'edit')" class="aksi-title">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bk in paginatedBkList" :key="bk.id_bk">
              <td class="bk-id">{{ bk.id_bk }}</td>
              <td class="bk-name">{{ bk.nama || '-' }}</td>
              <td class="desk-item">{{ bk.deskripsi }}</td>
              <td class="action-buttons" v-if="can('bahanKajian', 'edit')">
                <button class="btn-edit" @click="editBK(bk)">
                  <i class="ri-edit-line"></i>
                  Edit
                </button>
                <button class="btn-delete" @click="removeBK(bk.id_bk)">
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
          item-label="bahan kajian"
          @update:current-page="setCurrentPage"
          @update:show-all="setShowAll"
        />
      </div>
    </div>

    <ErrorPopup :message="popupError" @close="clearError" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useBKStore } from '@/stores/bk'
import { usePermissions } from '@/composables/usePermissions'
import TablePagination from '@/components/TablePagination.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Initialize store
const bkStore = useBKStore()

// Data untuk BK
const bkList = computed(() => bkStore.bkList)
const isLoading = computed(() => bkStore.isLoading)
const storeError = computed(() => bkStore.error)
const popupError = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const totalItems = computed(() => bkList.value.length)
const totalPages = computed(() =>
  showAll.value ? 1 : Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

const paginatedBkList = computed(() => {
  if (showAll.value) return bkList.value
  const start = (currentPage.value - 1) * itemsPerPage
  return bkList.value.slice(start, start + itemsPerPage)
})

// Form untuk tambah/edit BK
const form = ref({
  id_bk: '',
  nama: '',
  deskripsi: '',
})

const isEditing = ref(false)
const showForm = ref(false)
const formErrors = ref({
  id_bk: '',
  nama: '',
  deskripsi: '',
})

const validateForm = () => {
  let isValid = true
  formErrors.value = { id_bk: '', nama: '', deskripsi: '' }

  if (!String(form.value.id_bk || '').trim()) {
    formErrors.value.id_bk = 'Kode BK tidak boleh kosong'
    isValid = false
  }

  if (!String(form.value.nama || '').trim()) {
    formErrors.value.nama = 'Nama BK tidak boleh kosong'
    isValid = false
  }

  if (!String(form.value.deskripsi || '').trim()) {
    formErrors.value.deskripsi = 'Deskripsi tidak boleh kosong'
    isValid = false
  }

  return isValid
}

// Fetch data BK dari store
const fetchBK = async () => {
  await bkStore.fetchAllBK()
}

// Tambah BK baru menggunakan store
const saveBK = async () => {
  try {
    popupError.value = ''

    if (!validateForm()) {
      return
    }

    const payload = {
      id_bk: String(form.value.id_bk || '').trim(),
      nama: String(form.value.nama || '').trim(),
      deskripsi: String(form.value.deskripsi || '').trim(),
    }

    if (isEditing.value) {
      const result = await bkStore.editBK(form.value.id_bk, payload)
      if (result === false || result?.success === false) {
        popupError.value = result?.error || storeError.value || 'Gagal memperbarui Bahan Kajian'
        return
      }
    } else {
      const result = await bkStore.createBK(payload)
      if (result === false || result?.success === false) {
        popupError.value = result?.error || storeError.value || 'Gagal menambahkan Bahan Kajian'
        return
      }
    }
    resetForm()
  } catch (err) {
    popupError.value = isEditing.value
      ? 'Gagal memperbarui Bahan Kajian'
      : 'Gagal menambahkan Bahan Kajian'
  }
}

// Edit BK
const editBK = (bk) => {
  form.value = {
    id_bk: bk.id_bk || '',
    nama: bk.nama || '',
    deskripsi: bk.deskripsi || '',
  }
  formErrors.value = { id_bk: '', nama: '', deskripsi: '' }
  isEditing.value = true
  showForm.value = true
}

// Hapus BK
const removeBK = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus Bahan Kajian ini?')) {
    const result = await bkStore.removeBK(id)
    if (result === false || result?.success === false) {
      popupError.value = result?.error || storeError.value || 'Gagal menghapus Bahan Kajian'
    }
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_bk: '', nama: '', deskripsi: '' }
  formErrors.value = { id_bk: '', nama: '', deskripsi: '' }
  isEditing.value = false
  showForm.value = false
}

const clearError = () => {
  popupError.value = ''
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

watch(storeError, (newError) => {
  if (newError) popupError.value = newError
})

// Load data saat komponen dimuat
onMounted(() => {
  fetchBK()
})
</script>

<style scoped>
.bk-container {
  width: 100%;
  margin: 0 auto;
}

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

.bk-content{
  line-height: 1.6;
}

.bk-content p{
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
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
.form-group textarea {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  box-sizing: border-box;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.form-group input.input-error,
.form-group textarea.input-error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  font-family: 'Montserrat', sans-serif;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.bk-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.bk-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.bk-table th {
  padding: 16px 18px;
  text-align: center;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
}

.bk-table th.head-id,
.bk-table th.head-name,
.bk-table th.head-desc {
  text-align: left;
}

.bk-table th.aksi-title {
  text-align: center;
}

.bk-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  vertical-align: top;
}

.bk-table .bk-id {
  text-align: left;
  font-weight: 700;
  color: var(--color-button);
}

.bk-table .bk-name {
  text-align: left;
  font-weight: 600;
}

.bk-table .desk-item {
  text-align: left;
  line-height: 1.6;
}

.bk-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.bk-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.bk-table tbody tr:last-child td {
  border-bottom: none;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
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

.btn-save {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-save:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
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

  .bk-table {
    font-size: 13px;
  }

  .bk-table th,
  .bk-table td {
    padding: 12px 10px;
  }
}
</style>
