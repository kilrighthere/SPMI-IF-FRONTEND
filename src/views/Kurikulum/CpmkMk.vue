<template>
  <div class="cpmk-mk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Korelasi CPMK dengan Mata Kuliah</h3>
        <div>
          <button class="btn-add" @click="showMatrix = !showMatrix" v-if="isAdmin">
            {{ showMatrix ? 'Tutup Matrix' : 'Buka Matrix' }}
          </button>
          <button class="btn-add" @click="showForm = !showForm" v-if="isAdmin">
            {{ showForm ? 'Batal' : 'Tambah Korelasi' }}
          </button>
        </div>
      </div>

      <!-- Form tambah/edit -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>CPMK</label>
          <select v-model="form.id_cpmk">
            <option disabled value="">Pilih CPMK</option>
            <option v-for="cpmk in cpmkList" :key="cpmk.id_cpmk" :value="cpmk.id_cpmk">
              {{ cpmk.id_cpmk }} - {{ cpmk.deskripsi }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label>Mata Kuliah</label>
          <select v-model="form.id_mk">
            <option disabled value="">Pilih Mata Kuliah</option>
            <option v-for="mk in mkList" :key="mk.kode_mk" :value="mk.kode_mk">
              {{ mk.kode_mk }} - {{ mk.nama_mk }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveData">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
          <button v-if="isEditing" class="btn-cancel" @click="resetForm">Batal</button>
        </div>
      </div>

      <!-- Matrix -->
      <CpmkMkMatrix v-if="showMatrix" :data="dataList" />

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Content -->
      <div v-if="!isLoading && !error && !showMatrix">
        <p>
          Halaman ini menampilkan korelasi antara Capaian Pembelajaran Mata Kuliah (CPMK) dengan Mata Kuliah (MK) yang ada dalam kurikulum.
        </p>

        <div v-if="dataList.length === 0" class="empty-state">Belum ada data korelasi.</div>

        <table v-else class="data-table">
          <thead>
            <tr>
              <th>ID CPMK</th>
              <th>ID Mata Kuliah</th>
              <th v-if="isAdmin || isDosen">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataList" :key="item.id_cpmk + item.id_mk">
              <td>{{ item.id_cpmk }}</td>
              <td>{{ item.id_mk }}</td>
              <td class="action-buttons" v-if="isAdmin || isDosen">
                <button class="btn-edit" @click="editData(item)" v-if="isAdmin">Edit</button>
                <button class="btn-delete" @click="removeData(item.id_cpmk, item.id_mk)" v-if="isAdmin">Hapus</button>
                <span v-if="isDosen">Hanya Admin</span>
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
import { useCpmkMkStore } from '@/stores/cpmkMk'
import { usePermissions } from '@/composables/usePermissions'
import CpmkMkMatrix from '@/components/CpmkMkMatrix.vue'

const { isAdmin, isDosen } = usePermissions()
const store = useCpmkMkStore()

const dataList = computed(() => store.items)
const cpmkList = computed(() => store.cpmkList)
const mkList = computed(() => store.mkList)
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)

const form = ref({
  id_cpmk: '',
  id_mk: '',
})

const originalIds = ref({ id_cpmk: '', id_mk: '' })
const isEditing = ref(false)
const showForm = ref(false)
const showMatrix = ref(false)

const fetchData = async () => {
  await store.fetchAll()
}

const saveData = async () => {
  try {
    if (isEditing.value) {
      await store.edit(originalIds.value.id_cpmk, originalIds.value.id_mk, form.value)
    } else {
      await store.create(form.value)
    }
    resetForm()
  } catch (err) {
    console.error('Error saving data:', err)
  }
}

const editData = (item) => {
  originalIds.value = { id_cpmk: item.id_cpmk, id_mk: item.id_mk }
  form.value = { ...item }
  isEditing.value = true
  showForm.value = true
}

const removeData = async (id_cpmk, id_mk) => {
  if (confirm('Apakah anda yakin ingin menghapus korelasi ini?')) {
    await store.remove(id_cpmk, id_mk)
  }
}

const resetForm = () => {
  form.value = { id_cpmk: '', id_mk: '' }
  originalIds.value = { id_cpmk: '', id_mk: '' }
  isEditing.value = false
  showForm.value = false
}

onMounted(async () => {
  await fetchData()
  await store.fetchCpmkList()
  await store.fetchMkList()
})
</script>

<style scoped>
/* Using similar styles from BahanKajian.vue */
.cpmk-mk-container {
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
.form-group select,
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
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.form-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.data-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.data-table th {
  padding: 16px 18px;
  text-align: left;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
}

.data-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
  vertical-align: top;
}

.data-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.data-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.data-table tbody tr:last-child td {
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
</style>
