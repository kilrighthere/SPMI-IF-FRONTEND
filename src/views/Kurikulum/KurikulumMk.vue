<template>
  <div class="kurikulum-mk-container">
    <div class="page-header">
      <h1 class="page-title">Kurikulum Mata Kuliah</h1>
      <p class="page-subtitle">{{ getCurrentKurikulumName() }}</p>
    </div>

    <!-- Action Button -->
    <div class="action-section" v-if="can('kurikulumMk', 'create')">
      <button
        v-if="canManageKurikulumMk"
        @click="openAddModal"
        class="btn-primary"
        :disabled="availableMataKuliah.length === 0"
        :title="
          availableMataKuliah.length === 0
            ? 'Semua mata kuliah sudah ditambahkan'
            : 'Tambah mata kuliah baru'
        "
      >
        <i class="ri-add-line"></i>
        Tambah Mata Kuliah
      </button>
    </div>

    <!-- Loading -->
    <div v-if="kurikulumMkStore.loading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error -->
    <div v-else-if="kurikulumMkStore.error" class="error-container">
      <i class="ri-error-warning-line"></i>
      <p>{{ kurikulumMkStore.error }}</p>
      <button @click="loadData" class="btn-retry">Coba Lagi</button>
    </div>

    <!-- Data Table -->
    <div v-else class="table-container">
      <div class="table-header">
        <h2>Daftar Mata Kuliah</h2>
        <div class="table-info">
          <span class="total-items">Total: {{ filteredKurikulumMk.length }} mata kuliah</span>
        </div>
      </div>

      <div v-if="filteredKurikulumMk.length === 0" class="empty-state">
        <i class="ri-file-list-3-line"></i>
        <h3>Belum ada mata kuliah</h3>
        <p>Kurikulum ini belum memiliki mata kuliah</p>
        <button
          v-if="canManageKurikulumMk"
          @click="openAddModal"
          class="btn-primary"
          :disabled="availableMataKuliah.length === 0"
        >
          <i class="ri-add-line"></i>
          {{
            availableMataKuliah.length === 0
              ? 'Tidak ada mata kuliah tersedia'
              : 'Tambah Mata Kuliah Pertama'
          }}
        </button>
      </div>

      <div v-else class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Kode MK</th>
              <th>Nama Mata Kuliah</th>
              <th>SKS</th>
              <th>Semester</th>
              <th class="actions-column" v-if="can('kurikulumMk', 'edit')">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(item, index) in paginatedKurikulumMk"
              :key="`${item.id_kurikulum}-${item.kode_mk}`"
            >
              <td>{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
              <td>
                <code class="kode-mk">{{ item.kode_mk }}</code>
              </td>
              <td class="nama-mk">
                {{ getMataKuliahName(item.kode_mk) }}
              </td>
              <td>
                <span class="sks-badge">{{ item.sks }} SKS</span>
              </td>
              <td>
                <span class="semester-badge">Semester {{ item.semester }}</span>
              </td>
              <td class="actions" v-if="can('kurikulumMk', 'edit')">
                <button
                  v-if="canManageKurikulumMk"
                  @click="openEditModal(item)"
                  class="btn-action btn-edit"
                  title="Edit"
                >
                  <i class="ri-edit-line"></i>
                </button>
                <button
                  v-if="canManageKurikulumMk"
                  @click="confirmDelete(item)"
                  class="btn-action btn-delete"
                  title="Hapus"
                >
                  <i class="ri-delete-bin-line"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination-container">
        <div class="pagination-info">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, filteredKurikulumMk.length) }}
          dari {{ filteredKurikulumMk.length }} data
        </div>
        <div class="pagination">
          <button @click="currentPage = 1" :disabled="currentPage === 1" class="pagination-btn">
            <i class="ri-skip-back-line"></i>
          </button>
          <button @click="currentPage--" :disabled="currentPage === 1" class="pagination-btn">
            <i class="ri-arrow-left-line"></i>
          </button>
          <span class="pagination-current">{{ currentPage }} / {{ totalPages }}</span>
          <button
            @click="currentPage++"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <i class="ri-arrow-right-line"></i>
          </button>
          <button
            @click="currentPage = totalPages"
            :disabled="currentPage === totalPages"
            class="pagination-btn"
          >
            <i class="ri-skip-forward-line"></i>
          </button>
        </div>
      </div>
    </div>

    <!-- Add/Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ isEditing ? 'Edit' : 'Tambah' }} Mata Kuliah Kurikulum</h3>
          <button @click="closeModal" class="modal-close">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <form @submit.prevent="submitForm" class="modal-form">
          <div class="form-group">
            <label for="kurikulum" class="form-label">Kurikulum</label>
            <input
              id="kurikulum"
              :value="getCurrentKurikulumName()"
              class="form-input"
              disabled
              readonly
            />
            <small class="form-help">Kurikulum sudah dipilih secara otomatis</small>
          </div>

          <div class="form-group">
            <label for="mata-kuliah" class="form-label">Mata Kuliah *</label>
            <select
              id="mata-kuliah"
              v-model="formData.kode_mk"
              :disabled="isEditing"
              class="form-select"
              required
            >
              <option value="">Pilih Mata Kuliah</option>
              <option v-for="mk in availableMataKuliah" :key="mk.kode_mk" :value="mk.kode_mk">
                {{ mk.kode_mk }} - {{ mk.nama_mk }}
              </option>
            </select>
            <small v-if="availableMataKuliah.length === 0" class="form-help text-orange">
              Semua mata kuliah sudah ditambahkan ke kurikulum ini
            </small>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="sks" class="form-label">SKS *</label>
              <input
                id="sks"
                v-model.number="formData.sks"
                type="number"
                min="1"
                max="6"
                class="form-input"
                placeholder="Masukkan SKS"
                required
              />
            </div>

            <div class="form-group">
              <label for="semester" class="form-label">Semester *</label>
              <select id="semester" v-model.number="formData.semester" class="form-select" required>
                <option value="">Pilih Semester</option>
                <option v-for="sem in 8" :key="sem" :value="sem">Semester {{ sem }}</option>
              </select>
            </div>
          </div>

          <div class="form-actions">
            <button type="button" @click="closeModal" class="btn-secondary">Batal</button>
            <button type="submit" class="btn-primary" :disabled="kurikulumMkStore.loading">
              <i class="ri-save-line"></i>
              {{ isEditing ? 'Simpan Perubahan' : 'Tambah Mata Kuliah' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay" @click="closeDeleteModal">
      <div class="modal-content modal-small" @click.stop>
        <div class="modal-header">
          <h3>Konfirmasi Hapus</h3>
          <button @click="closeDeleteModal" class="modal-close">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="delete-confirmation">
            <i class="ri-error-warning-line warning-icon"></i>
            <p>Apakah Anda yakin ingin menghapus mata kuliah ini dari kurikulum?</p>
            <div class="delete-details">
              <strong>{{ getMataKuliahName(itemToDelete?.kode_mk) }}</strong>
              <br />
              <small
                >Kurikulum: {{ itemToDelete?.id_kurikulum }} | {{ itemToDelete?.sks }} SKS |
                Semester {{ itemToDelete?.semester }}</small
              >
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button @click="closeDeleteModal" class="btn-secondary">Batal</button>
          <button @click="deleteItem" class="btn-danger" :disabled="kurikulumMkStore.loading">
            <i class="ri-delete-bin-line"></i>
            Hapus
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useKurikulumMkStore } from '@/stores/kurikulumMk'
import { useKurikulumStore } from '@/stores/kurikulum'
import { useMKStore } from '@/stores/mataKuliah'
import { usePermissions } from '@/composables/usePermissions'
import { useAuthStore } from '@/stores/auth'

// Route
const route = useRoute()

// Stores
const kurikulumMkStore = useKurikulumMkStore()
const kurikulumStore = useKurikulumStore()
const mataKuliahStore = useMKStore()
const auth = useAuthStore()
const { canManageKurikulumMk, isAdmin, can } = usePermissions()

// State - Ambil kurikulum ID dari route params
const selectedKurikulum = ref(route.params.id || '')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const showModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const itemToDelete = ref(null)

// Form data
const formData = ref({
  id_kurikulum: '',
  kode_mk: '',
  sks: null,
  semester: null,
})

const originalFormData = ref({})

// Computed
const filteredKurikulumMk = computed(() => {
  if (!selectedKurikulum.value) {
    return kurikulumMkStore.kurikulumMkList
  }
  return kurikulumMkStore.getKurikulumMkByKurikulum(selectedKurikulum.value)
})

const totalPages = computed(() => {
  return Math.ceil(filteredKurikulumMk.value.length / itemsPerPage.value)
})

const paginatedKurikulumMk = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredKurikulumMk.value.slice(start, end)
})

// Available mata kuliah (belum ditambahkan ke kurikulum)
const availableMataKuliah = computed(() => {
  if (!mataKuliahStore.mataKuliahList || !filteredKurikulumMk.value) {
    return []
  }

  // Get all mata kuliah that are already in this kurikulum
  const usedKodeMk = filteredKurikulumMk.value.map((item) => item.kode_mk)

  // Filter mata kuliah that haven't been added to this kurikulum
  return mataKuliahStore.mataKuliahList.filter((mk) => !usedKodeMk.includes(mk.kode_mk))
})

// Methods
function getMataKuliahName(kodeMk) {
  const mk = mataKuliahStore.mataKuliahList.find((item) => item.kode_mk === kodeMk)
  // Debug: log data for troubleshooting
  if (!mk) {
    console.log('Mata kuliah tidak ditemukan untuk kode:', kodeMk)
    console.log('Available mata kuliah:', mataKuliahStore.mataKuliahList)
  }
  return mk ? mk.nama_mk : kodeMk
}

function getCurrentKurikulumName() {
  const kurikulum = kurikulumStore.kurikulumList.find(
    (item) => item.id_kurikulum === selectedKurikulum.value,
  )
  return kurikulum
    ? `${kurikulum.nama_kurikulum} (${kurikulum.id_kurikulum})`
    : `Kurikulum ${selectedKurikulum.value}`
}

function openAddModal() {
  // Check if there are available mata kuliah
  if (availableMataKuliah.value.length === 0) {
    alert('Semua mata kuliah sudah ditambahkan ke kurikulum ini')
    return
  }

  isEditing.value = false
  formData.value = {
    id_kurikulum: selectedKurikulum.value || '',
    kode_mk: '',
    sks: null,
    semester: null,
  }
  showModal.value = true
}

function openEditModal(item) {
  isEditing.value = true
  formData.value = { ...item }
  originalFormData.value = { ...item }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  isEditing.value = false
  formData.value = {
    id_kurikulum: '',
    kode_mk: '',
    sks: null,
    semester: null,
  }
  originalFormData.value = {}
}

function confirmDelete(item) {
  itemToDelete.value = item
  showDeleteModal.value = true
}

function closeDeleteModal() {
  showDeleteModal.value = false
  itemToDelete.value = null
}

async function submitForm() {
  try {
    if (isEditing.value) {
      // Untuk edit, kita perlu ID unik - biasanya kombinasi id_kurikulum dan kode_mk
      const id = `${originalFormData.value.id_kurikulum}_${originalFormData.value.kode_mk}`
      const result = await kurikulumMkStore.editKurikulumMk(id, formData.value)

      if (result.success) {
        closeModal()
        // Refresh data jika diperlukan
      }
    } else {
      const result = await kurikulumMkStore.addKurikulumMk(formData.value)

      if (result.success) {
        closeModal()
        // Reset filter jika menambah ke kurikulum yang berbeda
        if (!selectedKurikulum.value) {
          selectedKurikulum.value = formData.value.id_kurikulum
        }
      }
    }
  } catch (error) {
    console.error('Error submitting form:', error)
  }
}

async function deleteItem() {
  try {
    // ID unik berdasarkan kombinasi id_kurikulum dan kode_mk
    const id = `${itemToDelete.value.id_kurikulum}_${itemToDelete.value.kode_mk}`
    const result = await kurikulumMkStore.removeKurikulumMk(id)

    if (result.success) {
      closeDeleteModal()
    }
  } catch (error) {
    console.error('Error deleting item:', error)
  }
}

async function loadData() {
  await Promise.all([
    kurikulumMkStore.fetchKurikulumMk(),
    kurikulumStore.fetchAllKurikulum(),
    mataKuliahStore.fetchAllMK(),
  ])
}

// Watch for page changes when filtering
watch(
  () => filteredKurikulumMk.value.length,
  () => {
    if (currentPage.value > totalPages.value && totalPages.value > 0) {
      currentPage.value = totalPages.value
    }
  },
)

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.kurikulum-mk-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 8px;
}

.page-subtitle {
  font-size: 16px;
  color: var(--color-text-light);
  margin: 0;
}

.action-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background-color: var(--color-button);
  color: var(--color-text);
  border: 1.5px solid var(--color-button);
  border-radius: 8px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.25s ease;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-primary:disabled {
  background-color: #e5e7eb;
  border-color: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
  transform: none;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--color-border);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 48px;
  color: var(--color-danger);
  margin-bottom: 16px;
}

.btn-retry {
  padding: 10px 20px;
  background-color: var(--color-primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 16px;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
  background-color: #f8fafc;
}

.table-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.total-items {
  font-size: 14px;
  color: var(--color-text-light);
  background-color: white;
  padding: 4px 12px;
  border-radius: 12px;
  border: 1px solid var(--color-border);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-state i {
  font-size: 64px;
  color: var(--color-text-light);
  margin-bottom: 16px;
}

.empty-state h3 {
  font-size: 20px;
  color: var(--color-text);
  margin-bottom: 8px;
}

.empty-state p {
  color: var(--color-text-light);
  margin-bottom: 24px;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.data-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.data-table th,
.data-table td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.data-table th {
  font-weight: 700;
  color: var(--color-text);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.data-table tbody tr {
  background: white;
  transition: all 0.2s ease;
}

.data-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.kurikulum-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: var(--color-primary);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.kode-mk {
  background-color: #f1f5f9;
  padding: 4px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 13px;
  color: var(--color-text);
}

.nama-mk {
  font-weight: 500;
  color: var(--color-text);
}

.sks-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #e0f2fe;
  color: #0277bd;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.semester-badge {
  display: inline-block;
  padding: 4px 8px;
  background-color: #f3e8ff;
  color: #7c3aed;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.actions-column {
  width: 120px;
}

.actions {
  display: flex;
  gap: 8px;
}

.btn-action {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.25s ease;
  font-family: 'Montserrat', sans-serif;
}

.btn-edit {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
}

.btn-edit:hover {
  background-color: var(--color-button);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-delete {
  background-color: #fee2e2;
  color: #dc2626;
}

.btn-delete:hover {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
  background-color: #f8fafc;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text-light);
}

.pagination {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  width: 32px;
  height: 32px;
  border: 1px solid var(--color-border);
  background-color: white;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pagination-current {
  padding: 0 16px;
  font-weight: 600;
  color: var(--color-text);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  background-color: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-light);
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: #f3f4f6;
  color: var(--color-text);
}

.modal-form {
  padding: 24px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 8px;
  font-size: 14px;
}

.form-input,
.form-select {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary);
}

.form-input:disabled {
  background-color: #f8fafc;
  color: #6b7280;
  cursor: not-allowed;
}

.form-help {
  display: block;
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}

.form-help.text-orange {
  color: #ff9800;
  font-weight: 500;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--color-border);
}

.btn-secondary {
  padding: 10px 20px;
  background-color: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #f3f4f6;
}

.btn-danger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: var(--color-danger);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-danger:hover {
  background-color: #c62828;
}

.delete-confirmation {
  text-align: center;
}

.warning-icon {
  font-size: 48px;
  color: var(--color-warning);
  margin-bottom: 16px;
}

.delete-details {
  background-color: #f8fafc;
  padding: 16px;
  border-radius: 8px;
  margin-top: 16px;
  text-align: left;
}

/* Responsive */
@media (max-width: 768px) {
  .kurikulum-mk-container {
    padding: 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .action-section {
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .modal-content {
    margin: 16px;
    max-height: calc(100vh - 32px);
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
