<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useMKStore } from '@/stores/mataKuliah'
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePermissions } from '@/composables/usePermissions'
import TablePagination from '@/components/TablePagination.vue'

// Initialize stores
const mkStore = useMKStore()
const kurikulumStore = useKurikulumStore()
const route = useRoute()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Data
const mataKuliahList = computed(() => mkStore.mataKuliahList)
const isLoading = computed(() => mkStore.isLoading)
const storeError = computed(() => mkStore.error)
const formSubmitError = ref('')
const pageError = ref('')
const showSuccess = ref(false)
const successMessage = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const isEditing = ref(false)
const showForm = ref(false)

// Form data
const form = ref({
  kode_mk: '',
  nama_mk: '',
  deskripsi: '',
})
const formErrors = ref({
  kode_mk: '',
  nama_mk: '',
  deskripsi: '',
})

// For filtering
const searchQuery = ref('')

// Filtered mata kuliah list
const filteredMataKuliah = computed(() => {
  let filtered = mataKuliahList.value

  // Filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (mk) =>
        String(mk.kode_mk || '')
          .toLowerCase()
          .includes(query) ||
        String(mk.nama_mk || '')
          .toLowerCase()
          .includes(query) ||
        String(mk.deskripsi || '')
          .toLowerCase()
          .includes(query),
    )
  }

  return filtered
})

const totalItems = computed(() => filteredMataKuliah.value.length)
const totalPages = computed(() =>
  showAll.value ? 1 : Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)

const paginatedMataKuliah = computed(() => {
  if (showAll.value) return filteredMataKuliah.value
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMataKuliah.value.slice(start, start + itemsPerPage)
})

// Fetch mata kuliah data
const fetchData = async () => {
  await mkStore.fetchAllMK()
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { kode_mk: '', nama_mk: '', deskripsi: '' }

  if (!String(form.value.kode_mk || '').trim()) {
    formErrors.value.kode_mk = 'Kode mata kuliah tidak boleh kosong'
    isValid = false
  }

  if (!String(form.value.nama_mk || '').trim()) {
    formErrors.value.nama_mk = 'Nama mata kuliah tidak boleh kosong'
    isValid = false
  }

  return isValid
}

const resetForm = () => {
  form.value = {
    kode_mk: '',
    nama_mk: '',
    deskripsi: '',
  }
  formErrors.value = { kode_mk: '', nama_mk: '', deskripsi: '' }
  formSubmitError.value = ''
  isEditing.value = false
  showForm.value = false
}

const editMK = (mk) => {
  form.value = {
    kode_mk: mk.kode_mk || '',
    nama_mk: mk.nama_mk || '',
    deskripsi: mk.deskripsi || '',
  }
  formErrors.value = { kode_mk: '', nama_mk: '', deskripsi: '' }
  formSubmitError.value = ''
  isEditing.value = true
  showForm.value = true

  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Save mata kuliah (add or edit)
const saveMK = async () => {
  try {
    formSubmitError.value = ''
    pageError.value = ''

    if (!validateForm()) {
      return
    }

    const payload = {
      kode_mk: String(form.value.kode_mk || '').trim(),
      nama_mk: String(form.value.nama_mk || '').trim(),
      deskripsi: String(form.value.deskripsi || '').trim() || '-',
    }

    let result
    if (isEditing.value) {
      result = await mkStore.editMK(payload.kode_mk, payload)
      if (result) {
        successMessage.value = 'Mata kuliah berhasil diperbarui'
      }
    } else {
      result = await mkStore.createMK(payload)
      if (result) {
        successMessage.value = 'Mata kuliah berhasil ditambahkan'
      }
    }

    if (result) {
      resetForm()
      showSuccess.value = true
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      formSubmitError.value = storeError.value || 'Gagal menyimpan mata kuliah'
    }
  } catch (err) {
    console.error('Error saving mata kuliah:', err)
    formSubmitError.value = 'Terjadi kesalahan saat menyimpan data mata kuliah'
  }
}

// Delete mata kuliah
const deleteMK = async (mk) => {
  if (confirm(`Apakah anda yakin ingin menghapus mata kuliah ${mk.kode_mk} - ${mk.nama_mk}?`)) {
    try {
      const result = await mkStore.removeMK(mk.kode_mk)

      if (result.success) {
        successMessage.value = 'Mata kuliah berhasil dihapus'
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      } else {
        pageError.value = result.error || storeError.value || 'Gagal menghapus mata kuliah'
      }
    } catch (err) {
      console.error('Error deleting mata kuliah:', err)
      pageError.value = 'Terjadi kesalahan saat menghapus mata kuliah'
    }
  }
}

const setCurrentPage = (page) => {
  currentPage.value = page
}

const setShowAll = (value) => {
  showAll.value = value
}

watch(searchQuery, () => {
  currentPage.value = 1
})

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

watch(storeError, (newError) => {
  if (newError && showForm.value) {
    formSubmitError.value = newError
  }
})

// Load data when component is mounted
onMounted(async () => {
  console.log('StrukMatkul component mounted, fetching data...')
  try {
    // Fetch kurikulum data by ID from route params
    const kurikulumId = route.params.id
    if (kurikulumId) {
      await kurikulumStore.fetchKurikulumById(kurikulumId)
    }
    await fetchData()
    console.log('Data fetched successfully, found', mataKuliahList.value.length, 'mata kuliah')
  } catch (err) {
    console.error('Failed to fetch data:', err)
    pageError.value = 'Gagal memuat data mata kuliah'
  }
})
</script>

<template>
  <div class="struktur-matkul-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Struktur Mata Kuliah</h3>
        <button
          class="btn-add"
          :class="{ 'is-cancel': showForm }"
          @click="showForm ? resetForm() : (showForm = true)"
          v-if="can('strukturMatkul', 'create')"
        >
          {{ showForm ? 'Batal' : 'Tambah Mata Kuliah' }}
        </button>
      </div>

      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>Kode Mata Kuliah</label>
          <input
            type="text"
            v-model="form.kode_mk"
            placeholder="Contoh: IF2110"
            :disabled="isEditing"
            :class="{ 'input-error': formErrors.kode_mk }"
          />
          <div v-if="formErrors.kode_mk" class="error-text">{{ formErrors.kode_mk }}</div>
        </div>
        <div class="form-group">
          <label>Nama Mata Kuliah</label>
          <input
            type="text"
            v-model="form.nama_mk"
            placeholder="Nama mata kuliah"
            :class="{ 'input-error': formErrors.nama_mk }"
          />
          <div v-if="formErrors.nama_mk" class="error-text">{{ formErrors.nama_mk }}</div>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            placeholder="Deskripsi mata kuliah (opsional)"
            :class="{ 'input-error': formErrors.deskripsi }"
          ></textarea>
          <div v-if="formErrors.deskripsi" class="error-text">{{ formErrors.deskripsi }}</div>
        </div>
        <div v-if="formSubmitError" class="error-message">{{ formSubmitError }}</div>
        <div class="form-actions">
          <button class="btn-save" @click="saveMK">
            {{ isEditing ? 'Perbarui' : 'Simpan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Success message -->
      <div v-if="showSuccess" class="success-message">{{ successMessage }}</div>
      <div v-if="pageError" class="error-message">{{ pageError }}</div>

      <!-- Content -->
      <div v-if="!isLoading" class="struktur-content">
        <p>
          Halaman ini digunakan untuk mengelola struktur mata kuliah pada
          {{ currentKurikulum?.nama_kurikulum || 'Kurikulum' }}.
        </p>

        <div class="action-bar">
          <div class="filters">
            <div class="search-container">
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Cari mata kuliah..."
                class="search-input"
              />
            </div>
          </div>
        </div>

        <!-- Mata Kuliah Table -->
        <div>
          <table v-if="totalItems > 0" class="mk-table">
            <thead>
              <tr>
                <th class="head-kode">Kode</th>
                <th class="head-nama">Nama Mata Kuliah</th>
                <th class="head-deskripsi">Deskripsi</th>
                <th v-if="can('strukturMatkul', 'edit')">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mk in paginatedMataKuliah" :key="mk.kode_mk">
                <td class="mk-code-col">{{ mk.kode_mk }}</td>
                <td class="mk-name-col">{{ mk.nama_mk }}</td>
                <td class="mk-desc-col">{{ mk.deskripsi || '-' }}</td>
                <td v-if="can('strukturMatkul', 'edit')" class="action-cell">
                  <button class="btn-edit" @click="editMK(mk)">
                    <i class="ri-edit-line"></i>
                    Edit
                  </button>
                  <button class="btn-delete" @click="deleteMK(mk)">
                    <i class="ri-delete-bin-line"></i>
                    Hapus
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <TablePagination
            v-if="totalItems > 0"
            :total-items="totalItems"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :show-all="showAll"
            item-label="mata kuliah"
            @update:current-page="setCurrentPage"
            @update:show-all="setShowAll"
          />
          <div v-else class="empty-state">Tidak ada mata kuliah yang sesuai dengan filter.</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.struktur-matkul-container {
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.section-box {
  background: white;
  border-radius: 10px;
  /* box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05); */
  /* margin-bottom: 20px; */
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

.section-box h4 {
  font-size: 16px;
  font-weight: 700;
  margin-top: 20px;
  margin-bottom: 10px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
}

.struktur-content p {
  margin-bottom: 16px;
  line-height: 1.6;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;

}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.filters {
  display: flex;
  gap: 15px;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
}

.search-input {
  padding: 10px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  width: 250px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
}

.search-input:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.btn-add {
  background-color: var(--color-button);
  color: var(--color-text);
  border: 1.5px solid var(--color-button);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
  color: white;
}

.btn-add:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--color-text);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-add.is-cancel:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.3);
}

.btn-add i {
  font-size: 16px;
}

.mk-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.mk-table th,
.mk-table td {
  padding: 16px 14px;
  border-bottom: 1px solid #f3f4f6;
}

.mk-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.mk-table th {
  font-weight: 700;
  color: var(--color-text);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;
}

.mk-table th.head-kode,
.mk-table th.head-nama,
.mk-table th.head-deskripsi {
  text-align: left;
}

.mk-table td {
  text-align: left;
  color: #4b5563;
  font-size: 14px;
}

.mk-table .mk-code-col {
  text-align: left;
  font-weight: 700;
  color: var(--color-button);
}

.mk-table .mk-name-col {
  text-align: left;
  line-height: 1.6;
  font-weight: 600;
}

.mk-table .mk-desc-col {
  text-align: left;
  line-height: 1.6;
}

.mk-table .action-cell {
  text-align: center;
}

.mk-table tbody tr {
  background: white;
  transition: all 0.2s ease;
}

.mk-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.mk-table tbody tr:last-child td {
  border-bottom: none;
}

.btn-edit,
.btn-delete,
.btn-save {
  cursor: pointer;
  margin: 0 4px;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.form-container {
  background: #f9fafb;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
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

.form-group input.input-error,
.form-group textarea.input-error {
  border-color: #ef4444;
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

.btn-save {
  appearance: none;
  -webkit-appearance: none;
  background: var(--color-button);
  color: white;
  border: 1.5px solid var(--color-button);
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.btn-save:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-edit {
  color: var(--color-text);
  background-color: white;
  border: 1.5px solid var(--color-button);
}

.btn-edit:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.25);
}

.btn-delete {
  color: var(--color-button-hover);
  background-color: white;
  border: 1.5px solid #fca5a5;
}

.btn-delete:hover {
  background-color: var(--color-button-hover);
  color: white;
  border-color: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.25);
}

.loading {
  text-align: center;
  padding: 20px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
}

.error-message {
  color: #dc2626;
  padding: 12px 16px;
  background-color: #fee2e2;
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
}

.success-message {
  color: #16a34a;
  padding: 12px 16px;
  background-color: #dcfce7;
  border-radius: 8px;
  margin-bottom: 16px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 500;
}

.empty-state {
  text-align: center;
  padding: 32px 20px;
  color: #6b7280;
  font-style: italic;
  background-color: #f9fafb;
  border-radius: 8px;
  font-family: 'Montserrat', sans-serif;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .action-bar {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .search-input {
    width: 100%;
  }

  .btn-add {
    width: 100%;
    justify-content: center;
    margin-top: 10px;
  }
}
</style>
