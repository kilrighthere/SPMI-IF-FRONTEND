<script setup>
import { ref, onMounted, computed } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'

// Import stores
import { useCPMKStore } from '@/stores/cpmk'
import { useCPLStore } from '@/stores/cpl'

// Initialize stores
const cpmkStore = useCPMKStore()
const cplStore = useCPLStore()

// Data untuk CPMK
const cpmkList = computed(() => cpmkStore.cpmkList)
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => cpmkStore.isLoading || cplStore.isLoading)
const error = computed(() => cpmkStore.error || cplStore.error)

// Form untuk tambah/edit CPMK - sesuai format baru
const form = ref({
  id_cpmk: '',
  deskripsi: '',
  id_cpl: ''
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

// Tambah CPMK baru menggunakan store
const saveCPMK = async () => {
  try {
    if (isEditing.value) {
      await cpmkStore.editCPMK(form.value.id_cpmk, form.value)
    } else {
      await cpmkStore.createCPMK(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving CPMK:', err)
  }
}

// Edit CPMK
const editCPMK = (cpmk) => {
  form.value = { ...cpmk }
  isEditing.value = true
  showForm.value = true
}

// Hapus CPMK
const removeCPMK = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus CPMK ini?')) {
    await cpmkStore.removeCPMK(id)
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_cpmk: '', deskripsi: '', id_cpl: '' }
  isEditing.value = false
  showForm.value = false
}

// Mendapatkan nama CPL berdasarkan ID
const getCPLName = (cplId) => {
  const cpl = cplList.value.find(item => item.id === cplId || item.kode === cplId)
  return cpl ? `${cpl.kode} - ${cpl.deskripsi.substring(0, 30)}...` : 'N/A'
}

// Load data saat komponen dimuat
onMounted(() => {
  fetchCPMK()
  fetchCPL()
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="dashboard">
        <div class="cpmk-container">
          <div class="section-box">
            <div class="section-header">
              <h3>Capaian Pembelajaran Mata Kuliah (CPMK)</h3>
              <button class="btn-add" @click="showForm = !showForm">
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
                  <option v-for="cpl in cplList" :key="cpl.id" :value="cpl.id">
                    {{ cpl.kode }} - {{ cpl.deskripsi }}
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

            <!-- CPMK Table -->
            <div v-if="!isLoading && !error">
              <div v-if="cpmkList.length === 0" class="empty-state">
                Belum ada data CPMK.
              </div>
              
              <table v-else class="cpmk-table">
                <thead>
                  <tr>
                    <th>ID CPMK</th>
                    <th>Deskripsi</th>
                    <th>CPL</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="cpmk in cpmkList" :key="cpmk.id_cpmk">
                    <td>{{ cpmk.id_cpmk }}</td>
                    <td>{{ cpmk.deskripsi }}</td>
                    <td>{{ getCPLName(cpmk.id_cpl) }}</td>
                    <td class="action-buttons">
                      <button class="btn-edit" @click="editCPMK(cpmk)">Edit</button>
                      <button class="btn-delete" @click="removeCPMK(cpmk.id_cpmk)">Hapus</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style scoped>
.dash-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 256px; /* Same as sidebar width */
  display: flex;
  flex-direction: column;
}

.dashboard {
  padding: 20px;
  flex: 1;
}

.cpmk-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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

.cpmk-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.cpmk-table th,
.cpmk-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.cpmk-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.cpmk-table tr:hover {
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
  background-color: #2196F3;
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
