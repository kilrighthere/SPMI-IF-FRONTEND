<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useKurikulumStore } from '@/stores/kurikulum'
import { useSidebarStore } from '@/stores/sidebar'
import TablePagination from '@/components/TablePagination.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'
import { usePermissions } from '@/composables/usePermissions'

const router = useRouter()
const sidebarStore = useSidebarStore()
const kurikulumStore = useKurikulumStore()
const { can } = usePermissions()

// Get data from store
const kurikulumList = computed(() => kurikulumStore.kurikulumList)
const isLoading = computed(() => kurikulumStore.isLoading)
const storeError = computed(() => kurikulumStore.error)
const popupError = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const totalItems = computed(() => kurikulumList.value.length)
const totalPages = computed(() =>
  showAll.value ? 1 : Math.max(1, Math.ceil(totalItems.value / itemsPerPage)),
)
const showForm = ref(false)
const isEditing = ref(false)
const form = ref({
  id_kurikulum: '',
  nama_kurikulum: '',
  tahun_mulai: '',
  jumlah_sks_minimal: '',
})
const formErrors = ref({
  id_kurikulum: '',
  nama_kurikulum: '',
  tahun_mulai: '',
  jumlah_sks_minimal: '',
})

const paginatedKurikulumList = computed(() => {
  if (showAll.value) return kurikulumList.value
  const start = (currentPage.value - 1) * itemsPerPage
  return kurikulumList.value.slice(start, start + itemsPerPage)
})

// Fetch data kurikulum dari store
const fetchKurikulum = async () => {
  await kurikulumStore.fetchAllKurikulum()
}

// Handler tombol
const handleDetail = (id) => {
  router.push(`/kurikulum/${id}/sub-menu`)
}

const setCurrentPage = (page) => {
  currentPage.value = page
}

const setShowAll = (value) => {
  showAll.value = value
}

const validateForm = () => {
  let valid = true
  formErrors.value = {
    id_kurikulum: '',
    nama_kurikulum: '',
    tahun_mulai: '',
    jumlah_sks_minimal: '',
  }

  if (!String(form.value.id_kurikulum || '').trim()) {
    formErrors.value.id_kurikulum = 'ID Kurikulum tidak boleh kosong'
    valid = false
  }

  if (!String(form.value.nama_kurikulum || '').trim()) {
    formErrors.value.nama_kurikulum = 'Nama Kurikulum tidak boleh kosong'
    valid = false
  }

  const tahun = Number(form.value.tahun_mulai)
  if (!form.value.tahun_mulai || Number.isNaN(tahun) || tahun < 1900 || tahun > 3000) {
    formErrors.value.tahun_mulai = 'Tahun berlaku harus valid (1900-3000)'
    valid = false
  }

  const sks = Number(form.value.jumlah_sks_minimal)
  if (!form.value.jumlah_sks_minimal || Number.isNaN(sks) || sks <= 0) {
    formErrors.value.jumlah_sks_minimal = 'Jumlah SKS minimal harus lebih dari 0'
    valid = false
  }

  return valid
}

const resetForm = () => {
  form.value = {
    id_kurikulum: '',
    nama_kurikulum: '',
    tahun_mulai: '',
    jumlah_sks_minimal: '',
  }
  formErrors.value = {
    id_kurikulum: '',
    nama_kurikulum: '',
    tahun_mulai: '',
    jumlah_sks_minimal: '',
  }
  isEditing.value = false
  showForm.value = false
}

const editKurikulum = (item) => {
  form.value = {
    id_kurikulum: item.id_kurikulum,
    nama_kurikulum: item.nama_kurikulum,
    tahun_mulai: item.tahun_mulai,
    jumlah_sks_minimal: item.jumlah_sks_minimal,
  }
  isEditing.value = true
  showForm.value = true
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const saveKurikulum = async () => {
  popupError.value = ''
  if (!validateForm()) return

  const payload = {
    id_kurikulum: String(form.value.id_kurikulum).trim(),
    nama_kurikulum: String(form.value.nama_kurikulum).trim(),
    tahun_mulai: Number(form.value.tahun_mulai),
    jumlah_sks_minimal: Number(form.value.jumlah_sks_minimal),
  }

  if (isEditing.value) {
    const result = await kurikulumStore.editKurikulum(payload.id_kurikulum, payload)
    if (!result || result?.success === false) {
      popupError.value = result?.error || storeError.value || 'Gagal memperbarui data kurikulum'
      return
    }
  } else {
    const result = await kurikulumStore.createKurikulum(payload)
    if (!result || result?.success === false) {
      popupError.value = result?.error || storeError.value || 'Gagal menambahkan data kurikulum'
      return
    }
  }

  resetForm()
}

const removeKurikulumData = async (id) => {
  if (!confirm('Apakah anda yakin ingin menghapus data kurikulum ini?')) return
  const result = await kurikulumStore.removeKurikulum(id)
  if (!result || result?.success === false) {
    popupError.value = result?.error || storeError.value || 'Gagal menghapus data kurikulum'
  }
}

const clearError = () => {
  popupError.value = ''
}

watch(totalPages, (newTotal) => {
  if (currentPage.value > newTotal) currentPage.value = newTotal
})

watch(storeError, (newError) => {
  if (newError) popupError.value = newError
})

// Load data saat komponen dimuat
onMounted(() => {
  fetchKurikulum()
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="page-header">
        <div class="page-title">
          <h2>Kurikulum Program Studi</h2>
          <p class="breadcrumb">
            <RouterLink to="/kurikulum">Kurikulum</RouterLink>
            <span class="separator">/</span>
            <!-- <span class="current">Data Kurikulum Program Studi</span> -->
          </p>
        </div>
        <Header />
      </div>
      <div class="kur-content">
        <div class="section-header">
          <h3>Data Kurikulum Program Studi</h3>
          <button
            class="btn-add"
            :class="{ 'is-cancel': showForm }"
            @click="showForm ? resetForm() : (showForm = true)"
            v-if="can('kurikulum', 'create')"
          >
            {{ showForm ? 'Batal' : 'Tambah Kurikulum' }}
          </button>
        </div>

        <div v-if="showForm" class="form-container">
          <div class="form-grid">
            <div class="form-group">
              <label>ID Kurikulum</label>
              <input
                type="text"
                v-model="form.id_kurikulum"
                placeholder="Contoh: 2024"
                :disabled="isEditing"
                :class="{ 'input-error': formErrors.id_kurikulum }"
              />
              <div v-if="formErrors.id_kurikulum" class="error-text">
                {{ formErrors.id_kurikulum }}
              </div>
            </div>
            <div class="form-group">
              <label>Nama Kurikulum</label>
              <input
                type="text"
                v-model="form.nama_kurikulum"
                placeholder="Nama kurikulum"
                :class="{ 'input-error': formErrors.nama_kurikulum }"
              />
              <div v-if="formErrors.nama_kurikulum" class="error-text">
                {{ formErrors.nama_kurikulum }}
              </div>
            </div>
            <div class="form-group">
              <label>Tahun Berlaku</label>
              <input
                type="number"
                v-model="form.tahun_mulai"
                placeholder="Contoh: 2024"
                :class="{ 'input-error': formErrors.tahun_mulai }"
              />
              <div v-if="formErrors.tahun_mulai" class="error-text">
                {{ formErrors.tahun_mulai }}
              </div>
            </div>
            <div class="form-group">
              <label>Jumlah SKS Minimal</label>
              <input
                type="number"
                v-model="form.jumlah_sks_minimal"
                placeholder="Contoh: 144"
                :class="{ 'input-error': formErrors.jumlah_sks_minimal }"
              />
              <div v-if="formErrors.jumlah_sks_minimal" class="error-text">
                {{ formErrors.jumlah_sks_minimal }}
              </div>
            </div>
          </div>
          <div class="form-actions">
            <button class="btn-save" @click="saveKurikulum">
              {{ isEditing ? 'Perbarui' : 'Simpan' }}
            </button>
          </div>
        </div>

        <!-- Loading indicator -->

        <div v-if="isLoading" class="loading">Loading...</div>

        <!-- Table Container -->
        <div v-if="!isLoading" class="table-container">
          <div v-if="totalItems === 0" class="empty-state">Belum ada data kurikulum.</div>

          <div v-else class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th class="col-no">
                    <div class="th-content">No.</div>
                  </th>
                  <th class="col-nama">
                    <div class="th-content">Nama Kurikulum</div>
                  </th>
                  <th class="col-tahun">
                    <div class="th-content">Tahun Berlaku</div>
                  </th>
                  <th class="col-sks">
                    <div class="th-content">Jumlah SKS Minimal</div>
                  </th>
                  <th class="col-action">
                    <div class="th-content">Aksi</div>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(kurikulum, index) in paginatedKurikulumList"
                  :key="kurikulum.id_kurikulum"
                  class="table-row"
                >
                  <td class="col-no">
                    <div class="td-content">
                      <span class="number-badge">{{
                        (currentPage - 1) * itemsPerPage + index + 1
                      }}</span>
                    </div>
                  </td>
                  <td class="col-nama">
                    <div class="td-content">
                      <div class="nama-wrapper">
                        <i class="ri-book-line nama-icon"></i>
                        <span class="nama-text">{{ kurikulum.nama_kurikulum }}</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-tahun">
                    <div class="td-content">
                      <span class="year-badge">{{ kurikulum.tahun_mulai }}</span>
                    </div>
                  </td>
                  <td class="col-sks">
                    <div class="td-content">
                      <div class="sks-wrapper">
                        <i class="ri-award-line sks-icon"></i>
                        <span class="sks-text">{{ kurikulum.jumlah_sks_minimal }} SKS</span>
                      </div>
                    </div>
                  </td>
                  <td class="col-action">
                    <div class="td-content action-buttons">
                      <button class="btn-detail" @click="handleDetail(kurikulum.id_kurikulum)">
                        <i class="ri-eye-line"></i>
                        <span>Kelola</span>
                      </button>
                      <button
                        class="btn-edit"
                        v-if="can('kurikulum', 'edit')"
                        @click="editKurikulum(kurikulum)"
                      >
                        <i class="ri-edit-line"></i>
                        Edit
                      </button>
                      <button
                        class="btn-delete"
                        v-if="can('kurikulum', 'delete')"
                        @click="removeKurikulumData(kurikulum.id_kurikulum)"
                      >
                        <i class="ri-delete-bin-line"></i>
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <TablePagination
            :total-items="totalItems"
            :current-page="currentPage"
            :items-per-page="itemsPerPage"
            :show-all="showAll"
            item-label="kurikulum"
            @update:current-page="setCurrentPage"
            @update:show-all="setShowAll"
          />
        </div>
      </div>

      <ErrorPopup :message="popupError" @close="clearError" />
    </div>
  </div>
</template>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-left: 306px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  padding: 0px 20px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.minimized-sidebar {
  margin-left: 126px;
}

.kur-content {
  flex: 1;
  margin: 20px 0px;
  padding: 16px 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 36px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  flex: 1;
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

/* Page Actions */
.page-actions {
  display: flex;
  gap: 10px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.form-container {
  background: #f9fafb;
  padding: 20px 22px;
  border-radius: 10px;
  margin-bottom: 24px;
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(240px, 1fr));
  column-gap: 18px;
  row-gap: 14px;
  align-items: start;
}

.form-group {
  margin-bottom: 0;
  min-width: 0;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 600;
  font-size: 14px;
  color: #374151;
  font-family: 'Montserrat', sans-serif;
}

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 14px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.4;
  font-family: 'Montserrat', sans-serif;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.form-group input.input-error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 13px;
  margin-top: 6px;
  line-height: 1.35;
  font-family: 'Montserrat', sans-serif;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
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
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-add.is-cancel:hover {
  background: var(--color-button-hover);
  border-color: var(--color-button-hover);
  color: white;
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.3);
}

.btn-save {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-save:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  padding: 10px 0;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Montserrat', sans-serif;
}

/* Table Header */
.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(218, 42, 45, 0.15);
}

.modern-table thead tr {
  border-bottom: none;
}

.modern-table th {
  padding: 0;
  font-weight: 700;
  font-size: 13px;
  color: var(--color-text);
  text-transform: uppercase;
  letter-spacing: 0.8px;
  border-bottom: none;
}

.th-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Column Widths */
.col-no {
  width: 80px;
}

.col-nama {
  width: auto;
  min-width: 280px;
}

.col-tahun {
  width: 160px;
}

.col-sks {
  width: 190px;
}

.col-action {
  width: 360px;
}

/* Table Body */
.modern-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: all 0.25s ease;
  background: white;
}

.modern-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(218, 42, 45, 0.08);
}

.modern-table tbody tr:last-child {
  border-bottom: none;
}

.modern-table td {
  padding: 0;
  color: #4b5563;
  font-size: 14px;
}

.td-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Number Badge */
.number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  color: var(--color-text);
  border-radius: 8px;
  font-weight: 700;
  font-size: 14px;
  transition: all 0.2s ease;
}

/* Nama Wrapper */
.nama-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
  justify-content: center;
  width: 100%;
}

.nama-icon {
  font-size: 22px;
  color: var(--color-button);
  flex-shrink: 0;
  opacity: 0.8;
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .nama-icon {
  opacity: 1;
  transform: scale(1.1);
} */

.nama-text {
  font-weight: 600;
  font-size: 15px;
  color: #1f2937;
  letter-spacing: -0.2px;
}

/* Year Badge */
.year-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 16px;
  /* background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%); */
  color: var(--color-text);
  border-radius: 20px;
  font-weight: 700;
  font-size: 14px;
  /* border: 1px solid #93c5fd; */
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .year-badge {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #2563eb;
  transform: scale(1.05);
  box-shadow: 0 4px 8px rgba(37, 99, 235, 0.2);
} */

/* SKS Wrapper */
.sks-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: center;
}

.sks-icon {
  font-size: 20px;
  color: #f59e0b;
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .sks-icon {
  transform: scale(1.15);
  color: #d97706;
} */

.sks-text {
  font-weight: 700;
  font-size: 15px;
  color: var(--color-text);
  /* transition: all 0.2s ease; */
}

/* .modern-table tbody tr:hover .sks-text {
  color: #f59e0b;
} */

/* Action Button */
.btn-detail {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  min-height: 38px;
  min-width: 102px;
  background: white;
  color: var(--color-button);
  border: 1.5px solid var(--color-button);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 600;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
}

.btn-detail:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--color-button);
  transform: translateY(-2px);
  box-shadow: 0 6px 16px var(--color-button) 0.35;
}

.btn-detail:active {
  transform: translateY(0);
}

.btn-detail i {
  font-size: 16px;
}

.action-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.btn-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid;
  border-color: var(--color-button);
  padding: 8px 14px;
  min-height: 38px;
  min-width: 88px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
}

.btn-edit:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
}

.btn-delete {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: white;
  color: var(--color-button-hover);
  border: 1.5px solid;
  border-color: #fca5a5;
  padding: 8px 14px;
  min-height: 38px;
  min-width: 92px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  white-space: nowrap;
}

.btn-delete:hover {
  background: var(--color-button-hover);
  color: white;
  border-color: var(--color-button-hover);
}

.btn-edit i,
.btn-delete i {
  font-size: 16px;
}

/* Secondary Buttons */
.btn-secondary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 18px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.btn-secondary:hover {
  background: var(--color-button);
  color: white;
  border-color: var(--color-buttonsec);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-secondary:active {
  transform: translateY(0);
}

.btn-secondary i {
  font-size: 18px;
}

/* Loading & Error States */
.loading {
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

.error-message {
  color: var(--color-button);
  padding: 16px;
  background-color: #ffebee;
  border-radius: 8px;
  margin-bottom: 20px;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-style: italic;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 256px;
    padding: 0 16px;
  }

  .main-content.minimized-sidebar {
    margin-left: 100px;
  }

  .kur-content {
    margin-top: 76px;
    padding: 20px;
  }

  .page-title h2 {
    font-size: 22px;
  }

  .page-header {
    margin-bottom: 20px;
  }

  .form-container {
    padding: 16px;
  }

  .table-wrapper {
    overflow-x: auto;
  }

  .modern-table {
    min-width: 900px;
  }

  .btn-detail span,
  .btn-edit span,
  .btn-delete span,
  .btn-secondary span {
    display: none;
  }

  .btn-detail,
  .btn-edit,
  .btn-delete,
  .btn-secondary {
    padding: 10px;
    min-width: 40px;
  }

  .action-buttons {
    flex-wrap: nowrap;
    gap: 6px;
  }
}
</style>
