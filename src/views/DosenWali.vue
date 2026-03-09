<template>
  <div class="dash-container">
    <Sidebar />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="page-header">
        <div class="page-title">
          <h2>Dosen Wali</h2>
          <p class="breadcrumb">
            <RouterLink to="/dosen-wali">Dosen Wali</RouterLink>
            <span class="separator">/</span>
          </p>
        </div>
        <Header />
      </div>

      <div class="page-wrap">
        <div class="section-header">
          <div class="section-title">
            <h3>Pengelolaan Dosen Wali</h3>
            <p class="muted">Atur dosen untuk mahasiswa langsung dari panel utama</p>
          </div>
        </div>

        <div class="action-row" v-if="isAdmin">
          <div class="section-actions">
            <label class="field field-dosen">
              <span class="input-label">Dosen</span>
              <div ref="comboboxRef" class="combobox">
                <input
                  v-model="dosenQuery"
                  type="text"
                  class="combobox-input"
                  placeholder="Pilih atau ketik dosen"
                  :disabled="isDosen"
                  autocomplete="off"
                  role="combobox"
                  aria-autocomplete="list"
                  :aria-expanded="showDosenOptions"
                  aria-label="Cari dosen"
                  @focus="showDosenOptions = true"
                  @input="handleDosenInput"
                />
                <ul v-if="showDosenOptions" class="combobox-options" role="listbox">
                  <li
                    v-for="d in filteredDosenOptions"
                    :key="d.nip"
                    class="combobox-option"
                    role="option"
                    @mousedown.prevent="selectDosen(d.nip)"
                  >
                    {{ formatDosenLabel(d) }}
                  </li>
                  <li v-if="!filteredDosenOptions.length" class="combobox-empty">
                    Dosen tidak ditemukan
                  </li>
                </ul>
              </div>
            </label>
          </div>
        </div>

        <div class="cards">
          <div class="card" v-if="isAdmin">
            <div class="card-header">
              <div>
                <h3>Mahasiswa Tersedia</h3>
                <p class="muted">Hanya menampilkan mahasiswa yang belum memiliki dosen wali</p>
              </div>
            </div>
            <div class="card-body">
              <div class="actions actions-toolbar">
                <input
                  v-model="search"
                  type="text"
                  class="input"
                  placeholder="Cari nama atau NIM"
                />
                <button
                  class="btn btn-primary btn-with-icon"
                  :disabled="!canAdd"
                  @click="handleAdd"
                >
                  <span class="btn-icon" aria-hidden="true">+</span>
                  <span>Tambahkan ke Dosen</span>
                </button>
              </div>
              <div class="table-wrapper">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th style="width: 52px" class="center">
                        <input
                          type="checkbox"
                          :checked="allFilteredSelected"
                          :indeterminate.prop="someFilteredSelected"
                          @change="toggleSelectFiltered"
                          aria-label="Pilih semua mahasiswa yang terlihat"
                        />
                      </th>
                      <th>NIM</th>
                      <th>Nama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in filteredAvailable" :key="m.nim">
                      <td class="center">
                        <input type="checkbox" :value="m.nim" v-model="selectedMahasiswa" />
                      </td>
                      <td>{{ m.nim }}</td>
                      <td>{{ m.nama || '-' }}</td>
                    </tr>
                    <tr v-if="!filteredAvailable.length">
                      <td colspan="3" class="muted center">Tidak ada mahasiswa tersedia</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <div>
                <h3>Mahasiswa Perwalian</h3>
                <p class="muted">Terhubung dengan dosen terpilih</p>
              </div>
            </div>
            <div class="card-body">
              <div class="table-wrapper">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th>NIM</th>
                      <th>Nama</th>
                      <th style="width: 160px" class="aksi">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in assignedForSelected" :key="row.nim">
                      <td>{{ row.nim }}</td>
                      <td>{{ row.nama || '-' }}</td>
                      <td class="action">
                        <button
                          v-if="isAdmin"
                          class="btn btn-danger"
                          @click="handleDelete(row.nim)"
                        >
                          Hapus
                        </button>
                        <button v-else class="btn btn-accent" @click="handleViewCpl(row.nim)">
                          Lihat Pengukuran CPL
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!assignedForSelected.length">
                      <td colspan="3" class="muted center">
                        {{
                          selectedNip
                            ? 'Belum ada mahasiswa'
                            : 'Silakan pilih dosen terlebih dahulu'
                        }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="loading-state">Memuat data...</div>
      </div>

      <ErrorPopup :message="error" @close="error = ''" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
import ErrorPopup from '@/components/ErrorPopup.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'
import {
  getDosenList,
  getMahasiswaList,
  getDosenWaliList,
  addDosenWali,
  deleteDosenWali,
} from '@/api'

const auth = useAuthStore()
const router = useRouter()
const sidebarStore = useSidebarStore()
const dosenList = ref([])
const mahasiswaList = ref([])
const assignments = ref([]) // { nip, nim }
const selectedNip = ref('')
const selectedMahasiswa = ref([]) // nim[]
const dosenQuery = ref('')
const showDosenOptions = ref(false)
const comboboxRef = ref(null)
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const isAdmin = computed(() => auth.user?.role === 'admin')
const isDosen = computed(() => auth.user?.role === 'dosen')
const defaultKurikulumId = import.meta.env.VITE_DEFAULT_KURIKULUM_ID || '2020'

const assignmentNimSet = computed(() => new Set(assignments.value.map((a) => a.nim)))

const formatDosenLabel = (dosen) => `${dosen.nip} - ${dosen.nama || 'Tanpa nama'}`

const filteredDosenOptions = computed(() => {
  const term = dosenQuery.value.trim().toLowerCase()
  if (!term) return dosenList.value
  return dosenList.value.filter((d) => {
    const label = formatDosenLabel(d).toLowerCase()
    return label.includes(term)
  })
})

const filteredAvailable = computed(() => {
  const term = search.value.trim().toLowerCase()
  return mahasiswaList.value
    .filter((m) => !assignmentNimSet.value.has(m.nim))
    .filter((m) => {
      if (!term) return true
      return m.nim?.toLowerCase().includes(term) || m.nama?.toLowerCase().includes(term)
    })
})

const assignedForSelected = computed(() => {
  if (!selectedNip.value) return []
  return assignments.value
    .filter((a) => a.nip === selectedNip.value)
    .map((a) => {
      const m = mahasiswaList.value.find((x) => x.nim === a.nim)
      return {
        nim: a.nim,
        nama: m?.nama || m?.name || null,
      }
    })
})

const allFilteredSelected = computed(
  () =>
    filteredAvailable.value.length > 0 &&
    filteredAvailable.value.every((m) => selectedMahasiswa.value.includes(m.nim)),
)

const someFilteredSelected = computed(() => {
  const total = filteredAvailable.value.length
  const selected = filteredAvailable.value.filter((m) =>
    selectedMahasiswa.value.includes(m.nim),
  ).length
  return selected > 0 && selected < total
})

const canAdd = computed(
  () => !!selectedNip.value && selectedMahasiswa.value.length > 0 && !saving.value,
)

const syncDosenQueryFromSelection = () => {
  if (!selectedNip.value) {
    dosenQuery.value = ''
    return
  }
  const selected = dosenList.value.find((d) => d.nip === selectedNip.value)
  dosenQuery.value = selected ? formatDosenLabel(selected) : ''
}

const selectDosen = (nip) => {
  selectedNip.value = nip
  syncDosenQueryFromSelection()
  showDosenOptions.value = false
}

const handleDosenInput = () => {
  const term = dosenQuery.value.trim().toLowerCase()
  showDosenOptions.value = true
  const exactMatch = dosenList.value.find((d) => formatDosenLabel(d).toLowerCase() === term)
  selectedNip.value = exactMatch ? exactMatch.nip : ''
}

const closeDosenOptions = (shouldSync = true) => {
  setTimeout(() => {
    showDosenOptions.value = false
    if (shouldSync) {
      syncDosenQueryFromSelection()
    }
  }, 120)
}

const handleOutsideComboboxClick = (event) => {
  if (!showDosenOptions.value) return
  const root = comboboxRef.value
  if (!root) return
  if (!root.contains(event.target)) {
    closeDosenOptions()
  }
}

const loadData = async () => {
  loading.value = true
  error.value = ''
  try {
    const [dosenRes, mhsRes, dwRes] = await Promise.all([
      getDosenList(),
      getMahasiswaList(),
      getDosenWaliList(),
    ])
    dosenList.value = dosenRes.data?.data || []
    mahasiswaList.value = mhsRes.data?.data || []
    assignments.value = dwRes.data?.data || []

    if (isDosen.value) {
      selectedNip.value = auth.user?.nip || ''
    } else if (!selectedNip.value && dosenList.value.length) {
      selectedNip.value = dosenList.value[0].nip
    }
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Gagal memuat data'
  } finally {
    loading.value = false
  }
}

const reloadAssignments = async () => {
  try {
    const res = await getDosenWaliList()
    assignments.value = res.data?.data || []
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Gagal memuat ulang data'
  }
}

const handleAdd = async () => {
  if (!selectedNip.value || !selectedMahasiswa.value.length) return
  saving.value = true
  error.value = ''
  try {
    const tasks = selectedMahasiswa.value.map((nim) =>
      addDosenWali({ nip: selectedNip.value, nim }),
    )
    const results = await Promise.allSettled(tasks)
    const failed = results.filter((r) => r.status === 'rejected')
    if (failed.length) {
      error.value = 'Sebagian data gagal ditambahkan. Cek ulang mahasiswa yang dipilih.'
    }
    selectedMahasiswa.value = []
    await reloadAssignments()
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Gagal menambahkan mahasiswa'
  } finally {
    saving.value = false
  }
}

const handleDelete = async (nim) => {
  if (!selectedNip.value) return
  saving.value = true
  error.value = ''
  try {
    await deleteDosenWali(selectedNip.value, nim)
    await reloadAssignments()
  } catch (err) {
    console.error(err)
    error.value = err?.response?.data?.message || 'Gagal menghapus relasi'
  } finally {
    saving.value = false
  }
}

const handleViewCpl = (nim) => {
  if (!nim) return
  router.push(`/kurikulum/${defaultKurikulumId}/ukur-cpl/detail/${nim}`)
}

const toggleSelectFiltered = (e) => {
  if (e.target.checked) {
    selectedMahasiswa.value = filteredAvailable.value.map((m) => m.nim)
  } else {
    selectedMahasiswa.value = []
  }
}

watch(selectedNip, () => {
  selectedMahasiswa.value = []
  syncDosenQueryFromSelection()
})

onMounted(() => {
  loadData()
  document.addEventListener('mousedown', handleOutsideComboboxClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('mousedown', handleOutsideComboboxClick)
})
</script>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 306px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  padding: 0 20px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.minimized-sidebar {
  margin-left: 126px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  margin-top: 36px;
  margin-bottom: 16px;
  padding-bottom: 8px;
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

.page-wrap {
  flex: 1;
  margin: 20px 0;
  padding: 16px 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  padding-bottom: 14px;
  border-bottom: 1px solid #f0f0f0;
}

.action-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}

.section-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.section-actions {
  display: flex;
  grid-column: 1 / -1;
  width: 100%;
  justify-self: stretch;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
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

.separator {
  color: #d1d5db;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
  gap: 20px;
}

.card {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.card-body {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.muted {
  color: #6b7280;
  font-size: 13px;
}

.field {
  display: flex;
  gap: 15px;
  min-width: 240px;
  align-items: center;
}

.field-dosen {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr);
  column-gap: 12px;
  align-items: center;
  width: 100%;
  min-width: 0;
  max-width: none;
}

.field span.input-label {
  font-weight: 600;
}

.field-dosen .select {
  width: 100%;
  min-width: 0;
}

.combobox {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

.combobox-input {
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  font-family: 'Montserrat', sans-serif;
}

.combobox-input:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.combobox-options {
  position: absolute;
  z-index: 20;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  box-sizing: border-box;
  max-height: 220px;
  overflow-y: auto;
  margin: 0;
  padding: 6px;
  list-style: none;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #fff;
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.08);
}

.combobox-option,
.combobox-empty {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 14px;
}

.combobox-option {
  cursor: pointer;
}

.combobox-option:hover {
  background: #f3f9df;
}

.combobox-empty {
  color: #6b7280;
}

.select,
.input {
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
  font-family: 'Montserrat', sans-serif;
}

.select:focus,
.input:focus {
  outline: none;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.actions-toolbar {
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.actions-toolbar .input {
  flex: 1;
  min-width: 220px;
  max-width: 360px;
}

.btn-with-icon {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn-icon {
  width: 20px;
  height: 20px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  color: inherit;
  font-weight: 700;
  line-height: 1;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.btn {
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  border-color: #c81e1e;
  min-width: 88px;
}

.btn-accent {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #fff;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}

.modern-table th,
.modern-table td {
  padding: 14px 12px;
  border-bottom: 1px solid #f3f4f6;
  text-align: left;
  font-family: 'Montserrat', sans-serif;
}

.modern-table td.action {
  text-align: center;
}
.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.modern-table th {
  color: var(--color-text);
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.3px;
}

th.aksi {
  text-align: center;
}

.modern-table tbody tr {
  background: #fff;
  transition: all 0.2s ease;
}

.modern-table tbody tr:hover {
  background: #faffec;
}

.modern-table tbody tr:last-child td {
  border-bottom: none;
}

.center {
  text-align: center;
}

.loading-state {
  text-align: center;
  padding: 14px 16px;
  border-radius: 10px;
  border: 1px solid #c7d2fe;
  background: #eef2ff;
  color: #1d4ed8;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
}

@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
  }

  .cards {
    grid-template-columns: 1fr;
  }

  .action-row {
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

  .page-wrap {
    margin-top: 76px;
    padding: 20px;
  }

  .page-title h2 {
    font-size: 22px;
  }

  .section-header {
    width: 100%;
    align-items: flex-start;
  }

  .section-actions {
    width: 100%;
  }

  .field {
    min-width: 100%;
  }

  .field-dosen {
    grid-template-columns: 1fr;
    row-gap: 8px;
  }

  .actions-toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .actions-toolbar .input {
    max-width: 100%;
  }

  .actions-toolbar .btn {
    width: 100%;
    justify-content: center;
  }

  .card-header {
    flex-direction: column;
  }

  .card-header .input {
    width: 100%;
  }
}
</style>
