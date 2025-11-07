<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useMKStore } from '@/stores/mataKuliah'
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePermissions } from '@/composables/usePermissions'

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
const error = computed(() => mkStore.error)
const showSuccess = ref(false)
const successMessage = ref('')
const showModal = ref(false)
const formMode = ref('add') // 'add' or 'edit'

// Form data
const newMK = ref({
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
      (mk) => mk.kode_mk.toLowerCase().includes(query) || mk.nama_mk.toLowerCase().includes(query),
    )
  }

  return filtered
})

// Fetch mata kuliah data
const fetchData = async () => {
  await mkStore.fetchAllMK()
}

// Open modal to add new mata kuliah
const openAddModal = () => {
  formMode.value = 'add'
  newMK.value = {
    kode_mk: '',
    nama_mk: '',
    deskripsi: '',
  }
  showModal.value = true
}

// Open modal to edit mata kuliah
const openEditModal = (mk) => {
  formMode.value = 'edit'
  newMK.value = { ...mk }
  showModal.value = true
}

// Save mata kuliah (add or edit)
const saveMK = async () => {
  try {
    if (!newMK.value.kode_mk || !newMK.value.nama_mk) {
      alert('Mohon lengkapi kode dan nama mata kuliah')
      return
    }

    console.log('Saving MK with data:', newMK.value)

    let result
    if (formMode.value === 'add') {
      result = await mkStore.createMK(newMK.value)
      if (result) {
        successMessage.value = 'Mata kuliah berhasil ditambahkan'
      }
    } else {
      result = await mkStore.editMK(newMK.value.kode_mk, newMK.value)
      if (result) {
        successMessage.value = 'Mata kuliah berhasil diperbarui'
      }
    }

    if (result) {
      showModal.value = false
      showSuccess.value = true
      // Reset form
      newMK.value = {
        kode_mk: '',
        nama_mk: '',
        deskripsi: '',
      }
      setTimeout(() => {
        showSuccess.value = false
      }, 3000)
    } else {
      alert('Gagal menyimpan mata kuliah')
    }
  } catch (err) {
    console.error('Error saving mata kuliah:', err)
    alert('Terjadi kesalahan saat menyimpan data mata kuliah: ' + (err.message || err))
  }
}

// Delete mata kuliah
const deleteMK = async (mk) => {
  if (confirm(`Apakah anda yakin ingin menghapus mata kuliah ${mk.kode_mk} - ${mk.nama_mk}?`)) {
    try {
      const result = await mkStore.removeMK(mk.id)

      if (result.success) {
        successMessage.value = 'Mata kuliah berhasil dihapus'
        showSuccess.value = true
        setTimeout(() => {
          showSuccess.value = false
        }, 3000)
      } else {
        error.value = result.error || 'Gagal menghapus mata kuliah'
        setTimeout(() => {
          error.value = null
        }, 3000)
      }
    } catch (err) {
      console.error('Error deleting mata kuliah:', err)
      error.value = 'Terjadi kesalahan saat menghapus mata kuliah'
      setTimeout(() => {
        error.value = null
      }, 3000)
    }
  }
}

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
    error.value = 'Gagal memuat data mata kuliah'
  }
})
</script>

<template>
  <div class="struktur-matkul-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Struktur Mata Kuliah</h3>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Success message -->
      <div v-if="showSuccess" class="success-message">{{ successMessage }}</div>

      <!-- Content -->
      <div v-if="!isLoading && !error" class="struktur-content">
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

          <button class="btn-add" @click="openAddModal" v-if="isAdmin">
            <i class="ri-add-line"></i> Tambah Mata Kuliah
          </button>
        </div>

        <!-- Mata Kuliah Table -->
        <div>
          <table v-if="filteredMataKuliah.length > 0" class="mk-table">
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama Mata Kuliah</th>
                <th v-if="isAdmin">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="mk in filteredMataKuliah" :key="mk.id">
                <td>{{ mk.kode_mk }}</td>
                <td>{{ mk.nama_mk }}</td>
                <td v-if="isAdmin">
                  <button class="btn-edit" @click="openEditModal(mk)">
                    <i class="ri-edit-line"></i>
                  </button>
                  <button class="btn-delete" @click="deleteMK(mk)">
                    <i class="ri-delete-bin-line"></i>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-else class="empty-state">Tidak ada mata kuliah yang sesuai dengan filter.</div>
        </div>
      </div>
    </div>

    <!-- Modal for Adding/Editing Mata Kuliah -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ formMode === 'add' ? 'Tambah' : 'Edit' }} Mata Kuliah</h3>
          <button class="close-button" @click="showModal = false">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="kode">Kode Mata Kuliah:</label>
            <input
              type="text"
              id="kode"
              v-model="newMK.kode_mk"
              class="form-input"
              placeholder="Contoh: IF2110"
              required
            />
          </div>
          <div class="form-group">
            <label for="nama">Nama Mata Kuliah:</label>
            <input
              type="text"
              id="nama"
              v-model="newMK.nama_mk"
              class="form-input"
              placeholder="Nama mata kuliah"
              required
            />
          </div>
          <div class="form-group">
            <label for="deskripsi">Deskripsi:</label>
            <textarea
              id="deskripsi"
              v-model="newMK.deskripsi"
              class="form-input"
              placeholder="Deskripsi mata kuliah (kosong akan diisi dengan '-')"
              rows="3"
            ></textarea>
            <small class="form-help">Jika kosong, akan diisi dengan "-"</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">Batal</button>
          <button class="btn-save" @click="saveMK">Simpan</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.struktur-matkul-container {
  width: 100%;
  margin: 0 auto;
}

.section-box {
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
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
  margin-bottom: 20px;
  line-height: 1.6;
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
}

.btn-add:hover {
  background: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
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
  text-align: left;
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
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  margin: 0 5px;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.25s ease;
}

.btn-edit {
  color: var(--color-text);
  background-color: var(--color-buttonsec);
}

.btn-edit:hover {
  background-color: var(--color-button);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-delete {
  color: #dc2626;
  background-color: #fee2e2;
}

.btn-delete:hover {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
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

/* Modal styles */
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
  border-radius: 10px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.close-button:hover {
  background-color: #f3f4f6;
  color: var(--color-text);
}

.modal-body {
  padding: 24px;
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

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  resize: vertical;
  transition: all 0.25s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-cancel {
  background-color: transparent;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
}

.btn-cancel:hover {
  background-color: #f3f4f6;
}

.btn-save {
  background-color: var(--color-button);
  color: var(--color-text);
  border: 1.5px solid var(--color-button);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
}

.btn-save:hover {
  background: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
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

.form-help {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
  font-family: 'Montserrat', sans-serif;
}
</style>
