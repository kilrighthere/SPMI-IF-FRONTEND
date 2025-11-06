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

.section-box h4 {
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  color: var(--color-button);
  display: flex;
  align-items: center;
}

.struktur-content p {
  margin-bottom: 20px;
  line-height: 1.6;
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
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 250px;
  font-size: 14px;
}

.btn-add {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
}

.btn-add i {
  font-size: 16px;
}

.mk-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.mk-table th,
.mk-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.mk-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.mk-table tr:hover {
  background-color: #f9f9f9;
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
  width: 28px;
  height: 28px;
  border-radius: 4px;
}

.btn-edit {
  color: #2196f3;
}

.btn-edit:hover {
  background-color: #e3f2fd;
}

.btn-delete {
  color: #f44336;
}

.btn-delete:hover {
  background-color: #ffebee;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  color: #4caf50;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 4px;
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
  border-radius: 8px;
  width: 500px;
  max-width: 90%;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.modal-header {
  padding: 15px 20px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-button);
}

.close-button {
  background: none;
  border: none;
  font-size: 22px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  resize: vertical;
}

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.btn-cancel {
  background-color: #f5f5f5;
  color: #333;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
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
  margin-top: 4px;
  font-size: 12px;
  color: #6b7280;
  font-style: italic;
}
</style>
