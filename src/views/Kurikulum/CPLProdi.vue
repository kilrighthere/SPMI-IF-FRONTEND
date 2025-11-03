<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
// Removed Header, Sidebar, Footer imports as they're already in the parent component

// Import stores
import { useCPLStore } from '@/stores/cpl'
import { useKurikulumStore } from '@/stores/kurikulum'

// Initialize stores
const cplStore = useCPLStore()
const kurikulumStore = useKurikulumStore()
const route = useRoute()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Data untuk CPL
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => cplStore.isLoading)
const error = computed(() => cplStore.error)

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
    if (isEditing.value) {
      await cplStore.editCPL(form.value.id_cpl, form.value)
    } else {
      await cplStore.createCPL(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving CPL:', err)
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
    await cplStore.removeCPL(id)
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_cpl: '', deskripsi: '', id_pl: 'PL001' }
  isEditing.value = false
  showForm.value = false
}

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
        <button class="btn-add" @click="showForm = !showForm">
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

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- CPL Content -->
      <div v-if="!isLoading && !error">
        <p>
          Capaian Pembelajaran Lulusan (CPL) untuk
          {{ currentKurikulum?.nama || 'Kurikulum' }} mencakup beberapa kompetensi yang harus
          dikuasai oleh lulusan program studi.
        </p>

        <div v-if="cplList.length === 0" class="empty-state">Belum ada data CPL.</div>

        <table v-else class="cpl-table">
          <thead>
            <tr>
              <th>ID CPL</th>
              <th>Deskripsi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cpl in cplList" :key="cpl.id_cpl">
              <td>{{ cpl.id_cpl }}</td>
              <td>{{ cpl.deskripsi }}</td>
              <td class="action-buttons">
                <button class="btn-edit" @click="editCPL(cpl)">Edit</button>
                <button class="btn-delete" @click="removeCPL(cpl.id_cpl)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cpl-container {
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

.form-container {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group textarea {
  min-height: 100px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.cpl-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.cpl-table th,
.cpl-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.cpl-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.cpl-table tr:hover {
  background-color: #f9f9f9;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

.btn-add {
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
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

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}
</style>
