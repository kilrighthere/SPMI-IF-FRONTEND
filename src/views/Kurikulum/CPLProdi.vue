<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
// Removed Header, Sidebar, Footer imports as they're already in the parent component
import { usePermissions } from '@/composables/usePermissions'

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
        <button v-if="isAdmin" class="btn-add" @click="showForm = !showForm">
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
          {{ currentKurikulum?.nama_kurikulum || 'Kurikulum' }} mencakup beberapa kompetensi yang
          harus dikuasai oleh lulusan program studi.
        </p>

        <div v-if="cplList.length === 0" class="empty-state">Belum ada data CPL.</div>

        <table v-else class="cpl-table">
          <thead>
            <tr>
              <th>ID CPL</th>
              <th>Deskripsi</th>
              <th v-if="isAdmin">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="cpl in cplList" :key="cpl.id_cpl">
              <td>{{ cpl.id_cpl }}</td>
              <td>{{ cpl.deskripsi }}</td>
              <td class="action-buttons" v-if="isAdmin">
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
  text-align: left;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
}

.cpl-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  vertical-align: top;
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
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
  padding: 6px 12px;
  font-size: 13px;
}

.btn-edit:hover {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-delete {
  background: white;
  color: #ef4444;
  border-color: #fca5a5;
  padding: 6px 12px;
  font-size: 13px;
}

.btn-delete:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
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
