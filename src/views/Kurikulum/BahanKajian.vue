<template>
  <div class="bk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Bahan Kajian (BK)</h3>
        <button class="btn-add" @click="showForm = !showForm" v-if="isAdmin">
          {{ showForm ? 'Batal' : 'Tambah BK' }}
        </button>
      </div>

      <!-- Form tambah/edit BK -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>Kode BK</label>
          <input
            type="text"
            v-model="form.id_bk"
            placeholder="Kode BK (contoh: BK001)"
            :disabled="isEditing"
          />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea v-model="form.deskripsi" placeholder="Deskripsi Bahan Kajian"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveBK">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- BK Content -->
      <div v-if="!isLoading && !error">
        <p>
          Bahan Kajian (BK) merupakan komponen-komponen keilmuan yang menjadi bahan dari mata kuliah
          dalam kurikulum program studi.
        </p>

        <div v-if="bkList.length === 0" class="empty-state">Belum ada data Bahan Kajian.</div>

        <table v-else class="bk-table">
          <thead>
            <tr>
              <th>Kode BK</th>
              <th>Deskripsi</th>
              <th v-if="isAdmin">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bk in bkList" :key="bk.id_bk">
              <td>{{ bk.id_bk }}</td>
              <td>{{ bk.deskripsi }}</td>
              <td class="action-buttons" v-if="isAdmin">
                <button class="btn-edit" @click="editBK(bk)">Edit</button>
                <button class="btn-delete" @click="removeBK(bk.id_bk)">Hapus</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useBKStore } from '@/stores/bk'
import { usePermissions } from '@/composables/usePermissions'

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, can } = usePermissions()

// Initialize store
const bkStore = useBKStore()

// Data untuk BK
const bkList = computed(() => bkStore.bkList)
const isLoading = computed(() => bkStore.isLoading)
const error = computed(() => bkStore.error)

// Form untuk tambah/edit BK
const form = ref({
  id_bk: '',
  deskripsi: '',
})

const isEditing = ref(false)
const showForm = ref(false)

// Fetch data BK dari store
const fetchBK = async () => {
  await bkStore.fetchAllBK()
}

// Tambah BK baru menggunakan store
const saveBK = async () => {
  try {
    if (isEditing.value) {
      await bkStore.editBK(form.value.id_bk, form.value)
    } else {
      await bkStore.createBK(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving BK:', err)
  }
}

// Edit BK
const editBK = (bk) => {
  form.value = { ...bk }
  isEditing.value = true
  showForm.value = true
}

// Hapus BK
const removeBK = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus Bahan Kajian ini?')) {
    await bkStore.removeBK(id)
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_bk: '', deskripsi: '' }
  isEditing.value = false
  showForm.value = false
}

// Load data saat komponen dimuat
onMounted(() => {
  fetchBK()
})
</script>

<style scoped>
.bk-container {
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

.bk-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.bk-table th,
.bk-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.bk-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.bk-table tr:hover {
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
