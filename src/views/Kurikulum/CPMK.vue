<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

// Import stores
import { useCPMKStore } from '@/stores/cpmk'
import { useCPLStore } from '@/stores/cpl'
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePermissions } from '@/composables/usePermissions'

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
        <button class="btn-add" @click="showForm = !showForm" v-if="can('cpmk', 'create')">
          {{ showForm ? 'Batal' : 'Tambah CPMK' }}
        </button>
      </div>

      <!-- Form tambah/edit CPMK -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>ID CPMK</label>
          <input type="text" v-model="form.id_cpmk" placeholder="ID CPMK" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea v-model="form.deskripsi" placeholder="Deskripsi CPMK"></textarea>
        </div>
        <div class="form-group">
          <label>CPL</label>
          <select v-model="form.id_cpl">
            <option value="">Pilih CPL</option>
            <option v-for="cpl in cplList" :key="cpl.id_cpl" :value="cpl.id_cpl">
              {{ cpl.id_cpl }} - {{ cpl.deskripsi }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveCPMK">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
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

        <div v-if="cpmkList.length === 0" class="empty-state">Belum ada data CPMK.</div>

        <ul v-else class="cpmk-list">
          <li v-for="cpmk in cpmkList" :key="cpmk.id_cpmk" class="cpmk-item">
            <div class="cpmk-content">
              <strong>{{ cpmk.id_cpmk }}:</strong> {{ cpmk.deskripsi }}
              <div class="cpmk-cpl">
                <span class="cpl-tag">CPL: {{ getCPLName(cpmk.id_cpl) }}</span>
              </div>
            </div>
            <div class="cpmk-actions" v-if="can('cpmk', 'edit')">
              <button class="btn-edit" @click="editCPMK(cpmk)">Edit</button>
              <button class="btn-delete" @click="removeCPMK(cpmk.id_cpmk)">Hapus</button>
            </div>
          </li>
        </ul>
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

.cpmk-list {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 16px;
}

.cpmk-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: white;
  transition: all 0.2s ease;
}

.cpmk-item:hover {
  background: #faffec;
  border-color: var(--color-buttonsec);
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.cpmk-cpl {
  margin-top: 8px;
  font-size: 0.9em;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.cpl-tag {
  display: inline-block;
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  color: #0c4a6e;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 0.85em;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
}

.cpmk-actions {
  display: flex;
  gap: 8px;
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

  .cpmk-item {
    flex-direction: column;
    gap: 12px;
  }

  .cpmk-actions {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
