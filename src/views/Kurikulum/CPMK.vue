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
        <button class="btn-add" @click="showForm = !showForm" v-if="isAdmin">
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
            <div class="cpmk-actions" v-if="isAdmin">
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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
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

.cpmk-content {
  line-height: 1.6;
}

.cpmk-content p {
  margin-bottom: 15px;
}

.cpmk-list {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 15px;
}

.cpmk-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.cpmk-item:hover {
  background-color: #f9f9f9;
}

.cpmk-cpl {
  margin-top: 5px;
  font-size: 0.9em;
  color: #666;
}

.cpl-tag {
  display: inline-block;
  background-color: #e3f2fd;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.85em;
}

.cpmk-actions {
  display: flex;
  gap: 8px;
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
.form-group textarea,
.form-group select {
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
