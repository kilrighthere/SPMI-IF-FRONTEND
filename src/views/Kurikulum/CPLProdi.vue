<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
// Removed Header, Sidebar, Footer imports as they're already in the parent component
import { usePermissions } from '@/composables/usePermissions'
import TablePagination from '@/components/TablePagination.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'

// Import stores
import { useCPLStore } from '@/stores/cpl'
import { useKurikulumStore } from '@/stores/kurikulum'

// Initialize stores
const cplStore = useCPLStore()
const kurikulumStore = useKurikulumStore()
const route = useRoute()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Data untuk CPL
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => cplStore.isLoading)
const storeError = computed(() => cplStore.error)
const popupError = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const totalItems = computed(() => cplList.value.length)
const totalPages = computed(() =>
  showAll.value ? 1 : Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

const paginatedCplList = computed(() => {
  if (showAll.value) return cplList.value
  const start = (currentPage.value - 1) * itemsPerPage
  return cplList.value.slice(start, start + itemsPerPage)
})

// Form untuk tambah/edit CPL
const form = ref({
  id_cpl: '',
  deskripsi: '',
  id_pl: 'PL001', // Default ke PL001 karena di halaman ini tidak mengelola korelasi
})

const isEditing = ref(false)
const showForm = ref(false)

// Fetch data CPL dari store
const fetchCPL = async () => {
  await cplStore.fetchAllCPL()
}

// Tambah CPL baru menggunakan store
const saveCPL = async () => {
  try {
    popupError.value = ''
    if (isEditing.value) {
      const result = await cplStore.editCPL(form.value.id_cpl, form.value)
      if (result === false || result?.success === false) {
        popupError.value = result?.error || storeError.value || 'Gagal memperbarui CPL'
        return
      }
    } else {
      const result = await cplStore.createCPL(form.value)
      if (result === false || result?.success === false) {
        popupError.value = result?.error || storeError.value || 'Gagal menambahkan CPL'
        return
      }
    }
    resetForm()
  } catch (err) {
    console.error('Error saving CPL:', err)
    popupError.value = isEditing.value ? 'Gagal memperbarui CPL' : 'Gagal menambahkan CPL'
  }
}

// Edit CPL
const editCPL = (cpl) => {
  form.value = { ...cpl }
  isEditing.value = true
  showForm.value = true
}

// Hapus CPL
const removeCPL = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus CPL ini?')) {
    const result = await cplStore.removeCPL(id)
    if (result === false || result?.success === false) {
      popupError.value = result?.error || storeError.value || 'Gagal menghapus CPL'
    }
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_cpl: '', deskripsi: '', id_pl: 'PL001' }
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
onMounted(async () => {
  // Fetch kurikulum data by ID from route params
  const kurikulumId = route.params.id
  if (kurikulumId) {
    await kurikulumStore.fetchKurikulumById(kurikulumId)
  }
  fetchCPL()
})
</script>

<template>
  <div class="cpl-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Capaian Pembelajaran Lulusan (CPL) Program Studi</h3>
        <button v-if="can('cplProdi', 'create')" class="btn-add" @click="showForm = !showForm">
          {{ showForm ? 'Batal' : 'Tambah CPL' }}
        </button>
      </div>

      <!-- Form tambah/edit CPL -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>ID CPL</label>
          <input type="text" v-model="form.id_cpl" placeholder="ID CPL (contoh: CPL001)" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea v-model="form.deskripsi" placeholder="Deskripsi CPL"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveCPL">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- CPL Content -->
      <div v-if="!isLoading">
        <p>
          Capaian Pembelajaran Lulusan (CPL) untuk
          {{ currentKurikulum?.nama_kurikulum || 'Kurikulum' }} mencakup beberapa kompetensi yang
          harus dikuasai oleh lulusan program studi.
        </p>

        <div v-if="totalItems === 0" class="empty-state">Belum ada data CPL.</div>

        <table v-else class="cpl-table">
          <thead>
            <tr>
              <th class="head-id">ID CPL</th>
              <th class="head-desc">Deskripsi</th>
              <th v-if="can('cplProdi', 'edit')" class="aksi-title">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cpl in paginatedCplList" :key="cpl.id_cpl">
              <td class="cpl-id">{{ cpl.id_cpl }}</td>
              <td class="desk-item">{{ cpl.deskripsi }}</td>
              <td class="action-buttons" v-if="can('cplProdi', 'edit')">
                <button class="btn-edit" @click="editCPL(cpl)">
                  <i class="ri-edit-line"></i>
                  Edit
                </button>
                <button class="btn-delete" @click="removeCPL(cpl.id_cpl)">
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
          item-label="CPL"
          @update:current-page="setCurrentPage"
          @update:show-all="setShowAll"
        />
      </div>
    </div>

    <ErrorPopup :message="popupError" @close="clearError" />
  </div>
</template>

<style scoped>
.cpl-container {
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

p {
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.section-box h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-text);
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

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.cpl-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.cpl-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.cpl-table th {
  padding: 16px 18px;
  text-align: center;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
}

.cpl-table th.head-id,
.cpl-table th.head-desc {
  text-align: left;
}

.cpl-table th.aksi-title {
  text-align: center;
}

.cpl-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  vertical-align: top;
}

.cpl-table .cpl-id {
  text-align: left;
  font-weight: 700;
  color: var(--color-button);
}

.cpl-table .desk-item {
  text-align: left;
  line-height: 1.6;
}

.cpl-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.cpl-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.cpl-table tbody tr:last-child td {
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
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
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

  .cpl-table {
    font-size: 13px;
  }

  .cpl-table th,
  .cpl-table td {
    padding: 12px 10px;
  }
}
</style>
