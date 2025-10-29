<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMahasiswaStore } from '@/stores/mahasiswa'

const mahasiswaStore = useMahasiswaStore()

const mahasiswaList = computed(() => mahasiswaStore.mahasiswaList)
const isLoading = computed(() => mahasiswaStore.isLoading)
const error = computed(() => mahasiswaStore.error)

const form = ref({
  nim: '',
  nama: '',
})

const isEditing = ref(false)
const showForm = ref(false)

// Form validation state
const formErrors = ref({
  nim: '',
  nama: '',
})

const fetchMahasiswa = async () => {
  await mahasiswaStore.fetchMahasiswa()
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { nim: '', nama: '' }

  if (!form.value.nim.trim()) {
    formErrors.value.nim = 'NIM tidak boleh kosong'
    isValid = false
  }

  if (!form.value.nama.trim()) {
    formErrors.value.nama = 'Nama Mahasiswa tidak boleh kosong'
    isValid = false
  }

  return isValid
}

const saveMahasiswa = async () => {
  try {
    if (!validateForm()) {
      return
    }

    if (isEditing.value) {
      await mahasiswaStore.editMahasiswa(form.value.nim, form.value)
    } else {
      await mahasiswaStore.createMahasiswa(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving mahasiswa:', err)
  }
}

const editMahasiswa = (mahasiswa) => {
  form.value = { ...mahasiswa }
  isEditing.value = true
  showForm.value = true

  // Scroll to form section
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const removeMahasiswa = async (nim) => {
  if (confirm('Apakah anda yakin ingin menghapus mahasiswa ini?')) {
    await mahasiswaStore.removeMahasiswa(nim)
  }
}

const resetForm = () => {
  form.value = { nim: '', nama: '' }
  formErrors.value = { nim: '', nama: '' }
  isEditing.value = false
  showForm.value = false
}

onMounted(() => {
  fetchMahasiswa()
})
</script>

<template>
  <div class="mahasiswa-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Data Mahasiswa</h3>
        <button class="btn-add" @click="showForm ? resetForm() : (showForm = true)">
          {{ showForm ? 'Batal' : 'Tambah Mahasiswa' }}
        </button>
      </div>

      <!-- Form tambah/edit mahasiswa -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>NIM</label>
          <input
            type="text"
            v-model="form.nim"
            placeholder="Nomor Induk Mahasiswa"
            :disabled="isEditing"
            :class="{ 'input-error': formErrors.nim }"
          />
          <div v-if="formErrors.nim" class="error-text">{{ formErrors.nim }}</div>
        </div>
        <div class="form-group">
          <label>Nama Mahasiswa</label>
          <input
            type="text"
            v-model="form.nama"
            placeholder="Nama lengkap mahasiswa"
            :class="{ 'input-error': formErrors.nama }"
          />
          <div v-if="formErrors.nama" class="error-text">{{ formErrors.nama }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveMahasiswa">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <!-- Mahasiswa List -->
      <div v-else class="mahasiswa-content">
        <div v-if="mahasiswaList.length === 0" class="empty-state">Belum ada data mahasiswa.</div>

        <table v-else class="mahasiswa-table">
          <thead>
            <tr>
              <th width="10%">No.</th>
              <th width="20%">NIM</th>
              <th width="50%">Nama Mahasiswa</th>
              <th width="20%" class="aksi-title">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(mahasiswa, index) in mahasiswaList" :key="mahasiswa.nim">
              <td class="text-center">{{ index + 1 }}</td>
              <td>{{ mahasiswa.nim }}</td>
              <td>{{ mahasiswa.nama }}</td>
              <td class="action-button">
                <button class="btn-edit" @click="editMahasiswa(mahasiswa)">Edit</button>
                <button class="btn-delete" @click="removeMahasiswa(mahasiswa.nim)">Hapus</button>
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

.mahasiswa-content {
  line-height: 1.6;
}

.mahasiswa-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
  border: 1px solid #ddd;
}

.mahasiswa-table th {
  padding: 12px;
  background-color: #f5f5f5;
  font-weight: 600;
  border: 1px solid #ddd;
  text-align: center;
}

.mahasiswa-table td {
  padding: 12px;
  border: 1px solid #ddd;
  vertical-align: top;
}

.mahasiswa-table .text-center {
  text-align: center;
}

.mahasiswa-table .action-button {
  text-align: center;
  white-space: nowrap;
}

.mahasiswa-table tr:hover {
  background-color: #f9f9f9;
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

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

.form-group input:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-button) !important;
}

.error-text {
  color: var(--color-button);
  font-size: 14px;
  margin-top: 3px;
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
  transition: all 0.2s ease;
}

.btn-add:hover {
  background-color: var(--color-buttonter);
  color: white;
}

.btn-save {
  background-color: var(--color-buttonter);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  opacity: 0.9;
}

.btn-edit {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background-color: var(--color-buttonter);
  color: white;
}

.btn-delete {
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  opacity: 0.9;
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
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

:placeholder-shown {
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}
</style>
