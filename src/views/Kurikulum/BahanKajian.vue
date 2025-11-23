<template>
  <div class="bk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Bahan Kajian (BK)</h3>
        <button class="btn-add" @click="showForm = !showForm" v-if="can('bahanKajian', 'create')">
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
              <th v-if="can('bahanKajian', 'edit')">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="bk in bkList" :key="bk.id_bk">
              <td>{{ bk.id_bk }}</td>
              <td>{{ bk.deskripsi }}</td>
              <td class="action-buttons" v-if="can('bahanKajian', 'edit')">
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

.bk-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.bk-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.bk-table th {
  padding: 16px 18px;
  text-align: left;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
}

.bk-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  vertical-align: top;
}

.bk-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.bk-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.bk-table tbody tr:last-child td {
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

  .bk-table {
    font-size: 13px;
  }

  .bk-table th,
  .bk-table td {
    padding: 12px 10px;
  }
}
</style>
