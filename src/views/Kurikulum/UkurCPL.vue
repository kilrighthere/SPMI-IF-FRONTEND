<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getMahasiswaList } from '@/api'
import { usePermissions } from '@/composables/usePermissions'
import TablePagination from '@/components/TablePagination.vue'

const { isAdmin, isDosen, isMahasiswa, userId } = usePermissions()
const route = useRoute()
const router = useRouter()

const targetNim = computed(() => String(route.query?.nim || '').trim())
const currentUserNim = computed(() => String(userId.value || '').trim())

const mahasiswaList = ref([])
const filteredMahasiswaList = ref([])
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = 10
const showAll = ref(false)
const isLoading = ref(false)
const error = ref('')

async function fetchMahasiswaList() {
  isLoading.value = true
  error.value = ''

  try {
    const response = await getMahasiswaList()
    const allMahasiswa = response.data?.data || response.data || []

    mahasiswaList.value = Array.isArray(allMahasiswa) ? allMahasiswa : []
    filteredMahasiswaList.value = mahasiswaList.value

    if (isMahasiswa.value && currentUserNim.value) {
      router.replace(`/kurikulum/${route.params.id}/ukur-cpl/detail/${currentUserNim.value}`)
      return
    }

    if (targetNim.value) {
      const target = mahasiswaList.value.find((mhs) => String(mhs.nim) === targetNim.value)
      if (target) {
        goToDetail(target.nim)
      }
    }
  } catch (err) {
    error.value = 'Gagal memuat daftar mahasiswa.'
  } finally {
    isLoading.value = false
  }
}

function goToDetail(nim) {
  router.push(`/kurikulum/${route.params.id}/ukur-cpl/detail/${nim}`)
}

const paginatedMahasiswaList = computed(() => {
  if (showAll.value) return filteredMahasiswaList.value
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredMahasiswaList.value.slice(start, start + itemsPerPage)
})

const setCurrentPage = (page) => {
  currentPage.value = page
}

const setShowAll = (value) => {
  showAll.value = value
}

watch(searchQuery, (newQuery) => {
  currentPage.value = 1
  if (!newQuery.trim()) {
    filteredMahasiswaList.value = mahasiswaList.value
    return
  }

  const query = newQuery.toLowerCase()
  filteredMahasiswaList.value = mahasiswaList.value.filter(
    (mhs) =>
      String(mhs.nim || '')
        .toLowerCase()
        .includes(query) || String(mhs.nama || '')
        .toLowerCase()
        .includes(query),
  )
})

watch(filteredMahasiswaList, (newList) => {
  if (!newList.length) {
    currentPage.value = 1
    return
  }

  const totalPages = Math.max(1, Math.ceil(newList.length / itemsPerPage))
  if (currentPage.value > totalPages) currentPage.value = totalPages
})

onMounted(() => {
  if (isDosen.value && !isAdmin.value && !targetNim.value) {
    router.replace('/admin/dosen-wali')
    return
  }

  fetchMahasiswaList()
})
</script>

<template>
  <div class="ukur-cpl-container">
    <div v-if="isLoading" class="text-center my-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <p class="mt-2">Memuat daftar mahasiswa...</p>
    </div>

    <div v-else class="section-box mahasiswa-section">
      <div class="section-header">
        <h3>Daftar Mahasiswa</h3>
        <div class="search-box">
          <i class="ri-search-line search-icon"></i>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Cari berdasarkan NIM atau nama mahasiswa..."
          />
        </div>
      </div>

      <div class="mahasiswa-content">
        <p>Silakan pilih mahasiswa untuk melihat detail pengukuran CPL.</p>

        <div v-if="error" class="alert alert-warning" role="alert">
          <i class="ri-alert-line"></i> {{ error }}
        </div>

        <div class="table-wrapper" v-if="filteredMahasiswaList.length > 0">
          <table class="mahasiswa-table">
            <thead>
              <tr>
                <th class="col-no">No</th>
                <th class="col-nim">NIM</th>
                <th class="col-name">Nama Mahasiswa</th>
                <th class="col-action">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(mhs, index) in paginatedMahasiswaList"
                :key="mhs.nim"
                class="mahasiswa-row"
              >
                <td class="cell-center">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td class="cell-left">
                  <span class="nim-text">{{ mhs.nim }}</span>
                </td>
                <td class="cell-left">
                  <span class="mahasiswa-name">{{ mhs.nama }}</span>
                </td>
                <td class="cell-center action-cell">
                  <button class="btn-view" @click="goToDetail(mhs.nim)">
                    <i class="ri-eye-line"></i>
                    Detail CPL
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <TablePagination
          v-if="filteredMahasiswaList.length > 0"
          :total-items="filteredMahasiswaList.length"
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
          :show-all="showAll"
          item-label="mahasiswa"
          @update:current-page="setCurrentPage"
          @update:show-all="setShowAll"
        />

        <div v-if="filteredMahasiswaList.length === 0" class="no-results">
          <i class="ri-search-line"></i>
          <p>Tidak ada mahasiswa yang cocok dengan pencarian.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ukur-cpl-container {
  padding: 20px;
  background-color: #fff;
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
  gap: 12px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.search-box {
  position: relative;
  width: 100%;
  max-width: 380px;
}

.search-input {
  width: 100%;
  padding: 10px 12px 10px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
  box-sizing: border-box;
}

.search-input:focus {
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
  outline: none;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: #9ca3af;
}

.mahasiswa-section {
  width: 100%;
}

.mahasiswa-content {
  line-height: 1.6;
}

.mahasiswa-content p {
  margin-bottom: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.table-wrapper {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
  overflow-x: auto;
}

.mahasiswa-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Montserrat', sans-serif;
}

.mahasiswa-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.mahasiswa-table thead th {
  padding: 16px 14px;
  font-weight: 700;
  color: var(--color-text);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
  text-align: center;
}

.mahasiswa-table th.col-no,
.mahasiswa-table th.col-action,
.mahasiswa-table td.cell-center {
  text-align: center;
}

.mahasiswa-table th.col-nim,
.mahasiswa-table th.col-name,
.mahasiswa-table td.cell-left {
  text-align: left;
}

.mahasiswa-table .col-no {
  width: 80px;
}

.mahasiswa-table .col-action {
  width: 190px;
}

.mahasiswa-table tbody td {
  padding: 16px 14px;
  vertical-align: top;
  border-bottom: 1px solid #f3f4f6;
  color: #4b5563;
  font-size: 14px;
}

.mahasiswa-row {
  transition: all 0.2s ease;
  background: white;
}

.mahasiswa-row:hover {
  background: #faffec;
  transform: scale(1.001);
}

.mahasiswa-name {
  font-weight: 600;
  color: #374151;
  font-size: 14px;
  line-height: 1.6;
}

.nim-text {
  display: inline-block;
  font-weight: 700;
  font-size: 14px;
  color: var(--color-button);
}

.btn-view {
  background: white;
  color: var(--color-text);
  border: 1.5px solid var(--color-button);
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-view:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
}

.no-results {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-style: italic;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
  background: white;
}

.no-results i {
  font-size: 44px;
  margin-bottom: 10px;
  opacity: 0.6;
}

.no-results p {
  font-size: 14px;
  margin: 0;
  color: #6b7280;
}

.alert {
  border-radius: 8px;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
  padding: 0.875rem 1.125rem;
}

.alert-warning {
  background-color: #fff3cd;
  color: #856404;
  border-left: 4px solid #ffc107;
}

.spinner-border {
  width: 2.5rem;
  height: 2.5rem;
  color: #a6d600;
}

.text-center {
  text-align: center;
}

.my-5 {
  margin: 3rem 0;
}

.mt-2 {
  margin-top: 0.5rem;
}

@media (max-width: 768px) {
  .ukur-cpl-container {
    padding: 12px;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .search-box {
    max-width: 100%;
  }

  .mahasiswa-table th,
  .mahasiswa-table td {
    padding: 12px 10px;
  }
}

@media (max-width: 576px) {
  .ukur-cpl-container {
    padding: 10px;
  }

  .mahasiswa-table thead th:first-child,
  .mahasiswa-table tbody td:first-child {
    display: none;
  }

  .mahasiswa-table thead th,
  .mahasiswa-table tbody td {
    padding: 0.7rem 0.6rem;
  }
}
</style>
