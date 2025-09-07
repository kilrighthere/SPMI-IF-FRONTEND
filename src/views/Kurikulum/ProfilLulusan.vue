<script setup>
// Import stores
import { kurikulumData } from '@/stores/kurikulum'
import { usePLStore } from '@/stores/profilLulusan'
import { ref, onMounted, computed } from 'vue'

// Initialize store
const plStore = usePLStore()

// Get data from store
const profilLulusan = computed(() => plStore.profilLulusanList)
const isLoading = computed(() => plStore.isLoading)
const error = computed(() => plStore.error)

// Form untuk tambah/edit profil lulusan - sesuai format API baru
const form = ref({
  id_pl: '',
  deskripsi: ''
})
const isEditing = ref(false)
const showForm = ref(false)

// Fetch data profil lulusan dari store
const fetchProfilLulusan = async () => {
  await plStore.fetchAllPL()
}

// Tambah profil lulusan baru
const savePL = async () => {
  try {
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
}

// Hapus profil lulusan
const removePL = async (id) => {
  if (confirm('Apakah anda yakin ingin menghapus profil lulusan ini?')) {
    await plStore.removePL(id)
  }
}

// Reset form
const resetForm = () => {
  form.value = { id_pl: '', deskripsi: '' }
  isEditing.value = false
  showForm.value = false
}

// Load data saat komponen dimuat
onMounted(() => {
  fetchProfilLulusan()
})
</script>

<template>
  <div class="profil-lulusan-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Profil Lulusan Program Studi</h3>
        <button class="btn-add" @click="showForm = !showForm">
          {{ showForm ? 'Batal' : 'Tambah Profil Lulusan' }}
        </button>
      </div>
      
      <!-- Form tambah/edit profil lulusan -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>Kode PL</label>
          <input type="text" v-model="form.id_pl" placeholder="Kode Profil Lulusan (contoh: PL001)" />
        </div>
        <div class="form-group">
          <label>Deskripsi</label>
          <textarea v-model="form.deskripsi" placeholder="Deskripsi profil lulusan"></textarea>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="savePL">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>
      
      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Profil Lulusan List -->
      <div v-else class="pl-content">
        <p>
          Profil lulusan untuk {{ kurikulumData.nama }} mencakup beberapa bidang keahlian yang
          diharapkan setelah menyelesaikan program studi.
        </p>
        
        <div v-if="profilLulusan.length === 0" class="empty-state">
          Belum ada data profil lulusan.
        </div>
        
        <ul v-else class="pl-list">
          <li v-for="profil in profilLulusan" :key="profil.id_pl" class="pl-item">
            <div class="pl-content">
              <strong>{{ profil.id_pl }}:</strong> {{ profil.deskripsi }}
            </div>
            <div class="pl-actions">
              <button class="btn-edit" @click="editPL(profil)">Edit</button>
              <button class="btn-delete" @click="removePL(profil.id_pl)">Hapus</button>
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

.pl-content {
  line-height: 1.6;
}

.pl-content p {
  margin-bottom: 15px;
}

.pl-list {
  list-style-type: none;
  padding-left: 0;
  margin-bottom: 15px;
}

.pl-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  margin-bottom: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.pl-item:hover {
  background-color: #f9f9f9;
}

.pl-actions {
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
