<script setup>
// Import stores
import { useKurikulumStore } from '@/stores/kurikulum'
import { useCplSndiktiStore } from '@/stores/cplSndikti'
import { useCPLStore } from '@/stores/cpl'
import { usePermissions } from '@/composables/usePermissions'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

// Initialize stores
const cplSndiktiStore = useCplSndiktiStore()
const kurikulumStore = useKurikulumStore()
const cplStore = useCPLStore()
const route = useRoute()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Get data from store
const cplSndiktiList = computed(() => cplSndiktiStore.cplSndiktiList)
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => cplSndiktiStore.isLoading || cplStore.isLoading)
const error = ref('')

// Form untuk tambah/edit CPL SNDIKTI
const form = ref({
  id_sn: '',
  aspek: '',
  deskripsi: '',
  id_cpl: '',
})
const isEditing = ref(false)
const showForm = ref(false)

// Form validation state
const formErrors = ref({
  id_sn: '',
  aspek: '',
  deskripsi: '',
  id_cpl: '',
})

// Aspek options
const aspekOptions = ['Sikap', 'Pengetahuan', 'Keterampilan Umum', 'Keterampilan Khusus']

// Fetch data CPL SNDIKTI dari store
const fetchCplSndikti = async () => {
  await cplSndiktiStore.fetchAllCplSndikti()
}

// Fetch data CPL untuk dropdown
const fetchCPL = async () => {
  await cplStore.fetchAllCPL()
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { id_sn: '', aspek: '', deskripsi: '', id_cpl: '' }

  if (!form.value.id_sn.trim()) {
    formErrors.value.id_sn = 'ID SNDIKTI tidak boleh kosong'
    isValid = false
  }

  if (!form.value.aspek) {
    formErrors.value.aspek = 'Aspek harus dipilih'
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

// Tambah CPL SNDIKTI baru
const saveCplSndikti = async () => {
  try {
    // Reset error message first
    error.value = ''

    // Validate form before submission
    if (!validateForm()) {
      return // Stop if validation fails
    }

    if (isEditing.value) {
      await cplSndiktiStore.editCplSndikti(form.value.id_sn, form.value)
    } else {
      await cplSndiktiStore.createCplSndikti(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving CPL SNDIKTI:', err)
    error.value = isEditing.value ? 'Gagal mengupdate data' : 'Gagal menambah data'
  }
}

// Edit CPL SNDIKTI
const editCplSndikti = (item) => {
  form.value = { ...item }
  isEditing.value = true
  showForm.value = true

  // Scroll ke bagian atas halaman dimana form berada
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// Hapus CPL SNDIKTI
const removeCplSndikti = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus CPL SNDIKTI ini?')) {
    await cplSndiktiStore.removeCplSndikti(id)
  }
}

// Reset form and error messages
const resetForm = () => {
  form.value = { id_sn: '', aspek: '', deskripsi: '', id_cpl: '' }
  formErrors.value = { id_sn: '', aspek: '', deskripsi: '', id_cpl: '' }
  error.value = ''
  isEditing.value = false
  showForm.value = false
}

// Clear error message only (keep form data)
const clearError = () => {
  error.value = ''
}

// Load data saat komponen dimuat
onMounted(async () => {
  // Fetch kurikulum data by ID from route params
  const kurikulumId = route.params.id
  if (kurikulumId) {
    await kurikulumStore.fetchKurikulumById(kurikulumId)
  }
  fetchCplSndikti()
  fetchCPL()
})
</script>

<template>
  <div class="cpl-sndikti-container">
    <div id="form-section" class="section-box">
      <div class="section-header">
        <h3>CPL SNDIKTI (Standar Nasional Pendidikan Tinggi)</h3>
        <button class="btn-add" @click="showForm ? resetForm() : (showForm = true)" v-if="isAdmin">
          {{ showForm ? 'Batal' : 'Tambah CPL SNDIKTI' }}
        </button>
      </div>

      <!-- Form tambah/edit CPL SNDIKTI -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>ID SNDIKTI</label>
          <input
            type="text"
            v-model="form.id_sn"
            placeholder="ID SNDIKTI (contoh: KK1, KU1, P1, S1)"
            :disabled="isEditing"
          />
          <span v-if="formErrors.id_sn" class="error-text">{{ formErrors.id_sn }}</span>
        </div>
        <div class="form-group">
          <label>Aspek</label>
          <select v-model="form.aspek">
            <option value="">Pilih Aspek</option>
            <option v-for="aspek in aspekOptions" :key="aspek" :value="aspek">
              {{ aspek }}
            </option>
          </select>
          <span v-if="formErrors.aspek" class="error-text">{{ formErrors.aspek }}</span>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            placeholder="Deskripsi CPL SNDIKTI"
            rows="4"
          ></textarea>
          <span v-if="formErrors.deskripsi" class="error-text">{{ formErrors.deskripsi }}</span>
        </div>
        <div class="form-group">
          <label>CPL Terkait</label>
          <select v-model="form.id_cpl">
            <option value="">Pilih CPL</option>
            <option v-for="cpl in cplList" :key="cpl.id_cpl" :value="cpl.id_cpl">
              {{ cpl.id_cpl }} - {{ cpl.deskripsi?.substring(0, 50)
              }}{{ cpl.deskripsi?.length > 50 ? '...' : '' }}
            </option>
          </select>
          <span v-if="formErrors.id_cpl" class="error-text">{{ formErrors.id_cpl }}</span>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveCplSndikti">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button class="btn-close" @click="clearError">×</button>
      </div>

      <!-- CPL SNDIKTI List -->
      <div v-else class="cpl-sndikti-content">
        <p>
          CPL SNDIKTI untuk {{ currentKurikulum?.nama_kurikulum || 'Kurikulum' }} merupakan capaian
          pembelajaran yang mengacu pada Standar Nasional Pendidikan Tinggi yang mencakup aspek
          Sikap, Pengetahuan, Keterampilan Umum, dan Keterampilan Khusus.
        </p>

        <div v-if="cplSndiktiList.length === 0" class="empty-state">
          Belum ada data CPL SNDIKTI.
        </div>

        <table v-else class="cpl-sndikti-table">
          <thead>
            <tr>
              <th width="10%">ID SNDIKTI</th>
              <th width="15%">Aspek</th>
              <th width="45%">Deskripsi</th>
              <th width="10%">CPL Terkait</th>
              <th width="20%" class="aksi-title" v-if="isAdmin">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in cplSndiktiList" :key="item.id_sn" class="cpl-sndikti-item">
              <td class="sn-id">{{ item.id_sn }}</td>
              <td class="aspek-item">
                <span
                  class="aspek-badge"
                  :class="'aspek-' + item.aspek.toLowerCase().replace(/\s+/g, '-')"
                >
                  {{ item.aspek }}
                </span>
              </td>
              <td class="desk-item">{{ item.deskripsi }}</td>
              <td class="cpl-id">{{ item.id_cpl }}</td>
              <td class="action-buttons" v-if="isAdmin">
                <button class="action-button btn-edit" @click="editCplSndikti(item)">
                  <i class="ri-edit-line"></i>
                  Edit
                </button>
                <button class="action-button btn-delete" @click="removeCplSndikti(item.id_sn)">
                  <i class="ri-delete-bin-line"></i>
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-box {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 2px solid #f0f0f0;
}

.section-box h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.cpl-sndikti-content {
  margin-top: 20px;
}

.cpl-sndikti-content p {
  color: #6b7280;
  margin-bottom: 20px;
  line-height: 1.6;
}

.cpl-sndikti-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  font-family: 'Montserrat', sans-serif;
}

.cpl-sndikti-table th {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  font-weight: 700;
  padding: 14px 12px;
  text-align: left;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cpl-sndikti-table th.aksi-title {
  text-align: center;
}

.cpl-sndikti-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #e5e7eb;
  color: #4b5563;
  font-size: 14px;
}

.sn-id {
  font-weight: 700;
  color: var(--color-button);
  text-align: center;
}

.aspek-item {
  text-align: center;
}

.aspek-badge {
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.aspek-sikap {
  background: #e0f2fe;
  color: #0369a1;
}

.aspek-pengetahuan {
  background: #fef3c7;
  color: #92400e;
}

.aspek-keterampilan-umum {
  background: #dcfce7;
  color: #166534;
}

.aspek-keterampilan-khusus {
  background: #fce7f3;
  color: #9f1239;
}

.desk-item {
  line-height: 1.5;
}

.cpl-id {
  font-weight: 600;
  color: var(--color-button);
  text-align: center;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: 'Montserrat', sans-serif;
}

.btn-edit {
  background: white;
  color: var(--color-button);
  border: 1.5px solid var(--color-button);
}

.btn-edit:hover {
  background: var(--color-button);
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.btn-delete {
  background: white;
  color: #dc2626;
  border: 1.5px solid #dc2626;
}

.btn-delete:hover {
  background: #dc2626;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(220, 38, 38, 0.3);
}

.cpl-sndikti-table tr:hover {
  background-color: #faffec;
}

.error-text {
  color: #dc2626;
  font-size: 12px;
  margin-top: 4px;
  display: block;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}

.error-message {
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.btn-close {
  background: none;
  border: none;
  color: #dc2626;
  font-size: 24px;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.btn-close:hover {
  color: #991b1b;
  transform: scale(1.1);
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #9ca3af;
  font-style: italic;
  font-size: 16px;
}

/* Form Styles */
.form-container {
  background: #f9fafb;
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 24px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.2s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(74, 144, 226, 0.1);
}

.form-group input:disabled {
  background: #e5e7eb;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
}

.btn-add,
.btn-save,
.btn-cancel {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: none;
  font-family: 'Montserrat', sans-serif;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-add {
  background: var(--color-button);
  color: white;
  border: 1.5px solid var(--color-button);
}

.btn-add:hover {
  background: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-save {
  background: var(--color-button);
  color: white;
}

.btn-save:hover {
  background: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.3);
}

.btn-cancel {
  background: white;
  color: #6b7280;
  border: 1.5px solid #d1d5db;
}

.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
  transform: translateY(-2px);
}

/* Responsive */
@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .action-buttons {
    flex-direction: column;
    gap: 6px;
  }

  .action-button {
    width: 100%;
    justify-content: center;
  }

  .cpl-sndikti-table {
    font-size: 13px;
  }

  .cpl-sndikti-table th,
  .cpl-sndikti-table td {
    padding: 10px 8px;
  }
}
</style>
