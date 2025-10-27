<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMahasiswaStore } from '@/stores/mahasiswa'
import { useSidebarStore } from '@/stores/sidebar'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'

const mahasiswaStore = useMahasiswaStore()
const sidebarStore = useSidebarStore()

const mahasiswaList = computed(() => mahasiswaStore.mahasiswaList)
const isLoading = computed(() => mahasiswaStore.isLoading)
const error = computed(() => mahasiswaStore.error)

const form = ref({
  nim: '',
  nama: ''
})

const isEditing = ref(false)
const showForm = ref(false)

const fetchMahasiswa = async () => {
  await mahasiswaStore.fetchMahasiswa()
}

const saveMahasiswa = async () => {
  try {
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
}

const removeMahasiswa = async (nim) => {
  if (confirm('Apakah anda yakin ingin menghapus mahasiswa ini?')) {
    await mahasiswaStore.removeMahasiswa(nim)
  }
}

const resetForm = () => {
  form.value = { nim: '', nama: '' }
  isEditing.value = false
  showForm.value = false
}

onMounted(() => {
  fetchMahasiswa()
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="mahasiswa-content">
        <div class="page-header">
          <div class="page-title">
            <h2>Data Mahasiswa</h2>
            <p class="breadcrumb">
              <RouterLink to="/Dashboard">Dashboard</RouterLink>
              <span class="separator">/</span>
              <RouterLink to="/Kurikulum">Kurikulum</RouterLink>
              <span class="separator">/</span>
              <span class="current">Data Mahasiswa</span>
            </p>
          </div>
          <button class="btn-add" @click="showForm = !showForm">
            {{ showForm ? 'Batal' : 'Tambah Mahasiswa' }}
          </button>
        </div>

        <div v-if="showForm" class="form-container">
          <div class="form-group">
            <label>NIM</label>
            <input type="text" v-model="form.nim" placeholder="NIM Mahasiswa" :disabled="isEditing" />
          </div>
          <div class="form-group">
            <label>Nama Mahasiswa</label>
            <input type="text" v-model="form.nama" placeholder="Nama Mahasiswa" />
          </div>
          <div class="form-actions">
            <button class="btn-save" @click="saveMahasiswa">
              {{ isEditing ? 'Update' : 'Simpan' }}
            </button>
            <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
          </div>
        </div>

        <div class="table-container">
          <div class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th class="col-no">No.</th>
                  <th class="col-nim">NIM</th>
                  <th class="col-nama">Nama Mahasiswa</th>
                  <th class="col-aksi">Aksi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="isLoading">
                  <td colspan="4" class="text-center">Loading...</td>
                </tr>
                <tr v-else-if="error">
                  <td colspan="4" class="text-center error">{{ error }}</td>
                </tr>
                <tr v-for="(mahasiswa, index) in mahasiswaList" :key="mahasiswa.nim">
                  <td class="col-no">{{ index + 1 }}</td>
                  <td class="col-nim">{{ mahasiswa.nim }}</td>
                  <td class="col-nama">{{ mahasiswa.nama }}</td>
                  <td class="col-aksi action-buttons">
                    <button class="btn-edit" @click="editMahasiswa(mahasiswa)">Edit</button>
                    <button class="btn-delete" @click="removeMahasiswa(mahasiswa.nim)">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  /* Sidebar is positioned at left:20px with width:260px -> content offset = 20 + 260 = 280px */
  margin-left: 280px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  padding: 0px 20px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.minimized-sidebar {
  /* Minimized sidebar width is 80px and left offset 20px => 100px */
  margin-left: 100px;
}

.mahasiswa-content {
  flex: 1;
  margin-top: 92px;
  padding: 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title h2 {
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.5px;
}

.breadcrumb {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb a {
  color: var(--color-button);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
}

.breadcrumb a:hover {
  color: var(--color-button-hover);
}

.breadcrumb .separator {
  color: #d1d5db;
  font-weight: 400;
}

.breadcrumb .current {
  color: #9ca3af;
  font-weight: 500;
}

.btn-add {
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.form-container {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 8px;
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
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.btn-save {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-cancel {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
}

.modern-table th, .modern-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
}

.modern-table th {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
}

.col-no { width: 80px; text-align: center; }
.col-nim { width: 200px; }
.col-aksi { width: 150px; text-align: center; }

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.btn-edit {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-delete {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.text-center {
    text-align: center;
}

.error {
    color: red;
}
</style>
