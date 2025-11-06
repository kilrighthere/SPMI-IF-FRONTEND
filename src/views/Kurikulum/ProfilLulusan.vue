<script setup>
// Import stores
import { useKurikulumStore } from '@/stores/kurikulum'
import { usePLStore } from '@/stores/profilLulusan'
import { useAuthStore } from '@/stores/auth'
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'

// Initialize stores
const plStore = usePLStore()
const kurikulumStore = useKurikulumStore()
const authStore = useAuthStore()
const route = useRoute()

// cek role user
const userRole = computed(() => authStore.user?.role?.toLowerCase())
const isAdmin = computed(() => userRole.value === 'admin')
const isMahasiswa = computed(() => userRole.value === 'mahasiswa')
const isDosen = computed(() => userRole.value === 'dosen')

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
        <button class="btn-add" @click="showForm ? resetForm() : (showForm = true)" v-if="isAdmin">
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
              <th width="20%" class="aksi-title" v-if="isAdmin">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="profil in profilLulusan" :key="profil.id_pl" class="pl-item">
              <td class="pl-id">{{ profil.id_pl }}</td>
              <td class="desk-item">{{ profil.deskripsi }}</td>
              <td class="action-button" v-if="isAdmin">
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

.pl-content {
  line-height: 1.6;
}

.pl-content p {
  margin-bottom: 15px;
}

/* Tidak digunakan - sebelumnya untuk tampilan list
.pl-list {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 15px;
} */

.pl-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  border: 1px solid #ddd;
}

.pl-table th {
  padding: 12px;
  background-color: #f5f5f5;
  font-weight: 600;
  border: 1px solid #ddd;
  text-align: center;
}

.pl-table td {
  padding: 12px;
  border: 1px solid #ddd;
  vertical-align: top;
}

.pl-table .pl-id {
  text-align: left;
  width: 100px; /* Lebar tetap untuk kolom ID */
  white-space: nowrap;
}

.pl-table .desk-item {
  text-align: left;
  max-width: 60%; /* Membatasi lebar kolom deskripsi */
}

.pl-table .action-button {
  text-align: center;
  width: 150px; /* Lebar tetap untuk kolom aksi */
  white-space: nowrap;
}

.pl-table tr:hover {
  background-color: #f9f9f9;
}

.error-text {
  color: var(--color-button);
  font-size: 14px;
  margin-top: 3px;
}

:placeholder-shown {
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

textarea {
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

/* Tidak digunakan - duplikat dengan tr:hover atau class lama untuk list
.pl-item:hover {
  background-color: #f9f9f9;
} */

/* Tidak digunakan - class diganti dengan action-button (singular)
.action-buttons {
  display: flex;
  gap: 8px;
} */

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

.btn-add {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-save {
  background-color: var(--color-buttonter);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

/* Tidak digunakan - tombol cancel dikomentari di template
.btn-cancel {
  background-color:var(--color-button);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
} */

.btn-edit {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
}

.btn-delete {
  background-color: var(--color-button);
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
  color: var(--color-button);
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
