<template>
  <div class="bk-mk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Korelasi Bahan Kajian (BK) - Mata Kuliah (MK)</h3>
        <button class="btn-add" @click="showForm = !showForm" v-if="can('bkMk', 'create')">
          {{ showForm ? 'Batal' : 'Tambah Korelasi' }}
        </button>
      </div>

      <!-- Success & Error Messages -->
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- Form to add a new relation -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label for="bk-select">Bahan Kajian (BK)</label>
          <select id="bk-select" v-model="form.id_bk">
            <option disabled value="">Pilih Bahan Kajian</option>
            <option v-for="bk in bkList" :key="bk.id_bk" :value="bk.id_bk">
              {{ bk.id_bk }} - {{ bk.nama }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="mk-select">Mata Kuliah (MK)</label>
          <select id="mk-select" v-model="form.id_mk">
            <option disabled value="">Pilih Mata Kuliah</option>
            <option v-for="mk in mkList" :key="mk.kode_mk" :value="mk.kode_mk">
              {{ mk.kode_mk }} - {{ mk.nama_mk }}
            </option>
          </select>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveData">Simpan</button>
        </div>
      </div>

      <!-- Loading Indicator -->
      <div v-if="isLoading" class="loading">Memuat data...</div>

      <!-- Data Table -->
      <div v-if="!isLoading">
        <p>Halaman ini menampilkan korelasi antara Bahan Kajian (BK) dan Mata Kuliah (MK).</p>
        <div v-if="itemsList.length === 0" class="empty-state">Belum ada data korelasi.</div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>Kode BK</th>
              <th>Nama Bahan Kajian</th>
              <th>Kode MK</th>
              <th>Nama Mata Kuliah</th>
              <th v-if="can('bkMk', 'edit')">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in itemsList" :key="item.id_bk + '-' + item.id_mk">
              <td>{{ item.bk.id_bk }}</td>
              <td>{{ item.bk.nama }}</td>
              <td>{{ item.mk.kode_mk }}</td>
              <td>{{ item.mk.nama_mk }}</td>
              <td class="action-buttons" v-if="can('bkMk', 'edit')">
                <button class="btn-delete" @click="removeData(item.id_bk, item.id_mk)">
                  Hapus
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useBkMkStore } from '@/stores/bkMk'
import { usePermissions } from '@/composables/usePermissions'

const store = useBkMkStore()
const { can } = usePermissions()

// Use the new computed property from the store
const itemsList = computed(() => store.itemsWithDetails)
const bkList = computed(() => store.bkList)
const mkList = computed(() => store.mkList)
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)

const form = ref({ id_bk: '', id_mk: '' })
const successMessage = ref('')
const showForm = ref(false)

// Simplified onMounted hook
const fetchData = async () => {
  await store.fetchAll()
}

const saveData = async () => {
  if (!form.value.id_bk || !form.value.id_mk) {
    alert('Silakan pilih Bahan Kajian dan Mata Kuliah.')
    return
  }
  try {
    await store.create(form.value)
    successMessage.value = 'Korelasi BK-MK berhasil ditambahkan.'
    setTimeout(() => (successMessage.value = ''), 3000)
    form.value = { id_bk: '', id_mk: '' }
    showForm.value = false
  } catch (err) {
    console.error('Error saving BK-MK:', err)
    // Error is handled by the store's error state
  }
}

const removeData = async (id_bk, id_mk) => {
  if (confirm('Apakah Anda yakin ingin menghapus korelasi ini?')) {
    try {
      await store.remove(id_bk, id_mk)
      successMessage.value = 'Korelasi berhasil dihapus.'
      setTimeout(() => (successMessage.value = ''), 3000)
    } catch (err) {
      console.error('Error removing BK-MK:', err)
    }
  }
}

onMounted(fetchData)
</script>

<style scoped>
.bk-mk-container {
  width: 100%;
  margin: 0 auto;
}
.section-box {
  background: white;
  border-radius: 10px;
  padding: 24px;
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
  margin: 0;
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
}
.form-group select {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}
.form-group select:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}
.form-actions {
  display: flex;
  justify-content: flex-end;
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
}
.data-table td {
  padding: 16px 18px;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
}
.data-table tbody tr:hover {
  background: #faffec;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.action-buttons {
  text-align: right;
}
.btn-add,
.btn-save,
.btn-delete {
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
}
.btn-add {
  background: var(--color-button);
  color: white;
}
.btn-add:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
}
.btn-save {
  background: var(--color-button);
  color: white;
}
.btn-save:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
}
.btn-delete {
  background: #fee2e2;
  color: #ef4444;
}
.btn-delete:hover {
  background: #ef4444;
  color: white;
}
.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}
.error-message,
.success-message {
  padding: 12px 16px;
  border-radius: 8px;
  margin: 20px 0;
  font-family: 'Montserrat', sans-serif;
}
.error-message {
  color: #b91c1c;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
}
.success-message {
  color: #047857;
  background-color: #d1fae5;
  border-color: #a7f3d0;
}
</style>
