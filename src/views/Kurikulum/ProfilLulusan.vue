<script setup>
// Import stores
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePLStore } from '@/stores/profilLulusan'
import { usePermissions } from '@/composables/usePermissions'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

// Initialize stores
const plStore = usePLStore()
const kurikulumStore = useKurikulumStore()
const route = useRoute()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Get kurikulum data
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Get data from store
const profilLulusan = computed(() => plStore.profilLulusanList)
const isLoading = computed(() => plStore.isLoading)
const error = computed(() => plStore.error)

// Form untuk tambah/edit profil lulusan - sesuai format API baru
const form = ref({
  id_pl: '',
  deskripsi: '',
})
const isEditing = ref(false)
const showForm = ref(false)

// Form validation state
const formErrors = ref({
  id_pl: '',
  deskripsi: '',
})

// Fetch data profil lulusan dari store
const fetchProfilLulusan = async () => {
  await plStore.fetchAllPL()
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { id_pl: '', deskripsi: '' }

  if (!form.value.id_pl.trim()) {
    formErrors.value.id_pl = 'ID Profil Lulusan tidak boleh kosong'
    isValid = false
  }

  if (!form.value.deskripsi.trim()) {
    formErrors.value.deskripsi = 'Deskripsi tidak boleh kosong'
    isValid = false
  }

  return isValid
}

// Tambah profil lulusan baru
const savePL = async () => {
  try {
    // Reset error message first
    error.value = ''

    // Validate form before submission
    if (!validateForm()) {
      return // Stop if validation fails
    }

    if (isEditing.value) {
      await plStore.editPL(form.value.id_pl, form.value)
    } else {
      await plStore.createPL(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving profil lulusan:', err)
    error.value = isEditing.value ? 'Gagal mengupdate data' : 'Gagal menambah data'
  }
}

// Edit profil lulusan
const editPL = (profil) => {
  form.value = { ...profil }
  isEditing.value = true
  showForm.value = true

  // Scroll ke bagian atas halaman dimana form berada
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

// Hapus profil lulusan
const removePL = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus profil lulusan ini?')) {
    await plStore.removePL(id)
  }
}

// Reset form and error messages
const resetForm = () => {
  form.value = { id_pl: '', deskripsi: '' }
  formErrors.value = { id_pl: '', deskripsi: '' }
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
  fetchProfilLulusan()
})
</script>

<template>
  <div class="profil-lulusan-container">
    <div id="form-section" class="section-box">
      <div class="section-header">
        <h3>Profil Lulusan Program Studi</h3>
        <button
          class="btn-add"
          @click="showForm ? resetForm() : (showForm = true)"
          v-if="can('profilLulusan', 'create')"
        >
          {{ showForm ? 'Batal' : 'Tambah Profil Lulusan' }}
        </button>
      </div>

      <!-- Form tambah/edit profil lulusan -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>ID PL</label>
          <input
            type="text"
            v-model="form.id_pl"
            placeholder="Kode Profil Lulusan (contoh: PL001)"
            :class="{ 'input-error': formErrors.id_pl }"
          />
          <div v-if="formErrors.id_pl" class="error-text">{{ formErrors.id_pl }}</div>
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea
            v-model="form.deskripsi"
            placeholder="Deskripsi profil lulusan"
            :class="{ 'input-error': formErrors.deskripsi }"
          ></textarea>
          <div v-if="formErrors.deskripsi" class="error-text">{{ formErrors.deskripsi }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="savePL">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <!-- <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button> -->
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">
        {{ error }}
        <button class="btn-close" @click="clearError">×</button>
      </div>

      <!-- Profil Lulusan List -->
      <div v-else class="pl-content">
        <p>
          Profil lulusan untuk {{ currentKurikulum?.nama_kurikulum || 'Kurikulum' }} mencakup
          beberapa bidang keahlian yang diharapkan setelah menyelesaikan program studi.
        </p>

        <div v-if="profilLulusan.length === 0" class="empty-state">
          Belum ada data profil lulusan.
        </div>

        <table v-else class="pl-table">
          <thead>
            <tr>
              <th width="15%">ID PL</th>
              <th width="65%">Deskripsi</th>
              <th width="20%" class="aksi-title" v-if="can('profilLulusan', 'edit')">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="profil in profilLulusan" :key="profil.id_pl" class="pl-item">
              <td class="pl-id">{{ profil.id_pl }}</td>
              <td class="desk-item">{{ profil.deskripsi }}</td>
              <td class="action-button" v-if="can('profilLulusan', 'edit')">
                <button class="btn-edit" @click="editPL(profil)">Edit</button>
                <button class="btn-delete" @click="removePL(profil.id_pl)">Hapus</button>
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

.pl-content {
  line-height: 1.6;
}

.pl-content p {
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.pl-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.pl-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.pl-table th {
  padding: 16px 14px;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
  text-align: center;
}

.pl-table td {
  padding: 16px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: top;
  color: #4b5563;
  font-size: 14px;
}

.pl-table .pl-id {
  text-align: left;
  font-weight: 700;
  color: var(--color-button);
  width: 120px;
}

.pl-table .desk-item {
  text-align: left;
  line-height: 1.6;
}

.pl-table .action-button {
  text-align: center;
  width: 180px;
  white-space: nowrap;
}

.pl-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.pl-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.pl-table tbody tr:last-child td {
  border-bottom: none;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  font-family: 'Montserrat', sans-serif;
}

:placeholder-shown {
  font-family: 'Montserrat', sans-serif;
}

textarea {
  font-family: 'Montserrat', sans-serif;
}

/* Form Styles */
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

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.btn-add,
.btn-save,
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
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-save {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-save:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-edit {
  background: var(--color-buttonsec);
  color: var(--color-text);
  border-color: var(--color-buttonsec);
  padding: 6px 12px;
  font-size: 13px;
  margin-right: 6px;
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

  .pl-table {
    font-size: 13px;
  }

  .pl-table th,
  .pl-table td {
    padding: 12px 10px;
  }
}
</style>
