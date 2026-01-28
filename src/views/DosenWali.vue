<template>
  <div class="dash-container">
    <Sidebar />
    <Header />

    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="page-wrap">
        <div class="page-header">
          <div>
            <h2>Dosen Wali</h2>
            <p class="breadcrumb">
              <RouterLink to="/dashboard">Dashboard</RouterLink>
              <span class="separator">/</span>
              <span class="current">Dosen Wali</span>
            </p>
          </div>
          <div class="header-actions" v-if="isAdmin">
            <label class="field">
              <span>Dosen</span>
              <select v-model="selectedNip" :disabled="isDosen" class="select">
                <option value="" disabled>Pilih dosen</option>
                <option v-for="d in dosenList" :key="d.nip" :value="d.nip">
                  {{ d.nip }} — {{ d.nama || 'Tanpa nama' }}
                </option>
              </select>
            </label>
          </div>
        </div>

        <div class="cards">
          <div class="card" v-if="isAdmin">
            <div class="card-header">
              <div>
                <h3>Mahasiswa Tersedia</h3>
                <p class="muted">Hanya menampilkan mahasiswa yang belum punya dosen wali</p>
              </div>
              <input
                v-model="search"
                type="text"
                class="input"
                placeholder="Cari nama atau NIM"
              />
            </div>
            <div class="card-body">
              <div class="actions">
                <label class="checkbox">
                  <input
                    type="checkbox"
                    :checked="allFilteredSelected"
                    :indeterminate="someFilteredSelected"
                    @change="toggleSelectFiltered"
                  />
                  <span>Pilih semua yang terlihat</span>
                </label>
                <button class="btn btn-primary" :disabled="!canAdd" @click="handleAdd">
                  Tambahkan ke dosen
                </button>
              </div>
              <div class="table-wrapper">
                <table class="modern-table">
                  <thead>
                    <tr>
                      <th style="width: 52px"></th>
                      <th>NIM</th>
                      <th>Nama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="m in filteredAvailable" :key="m.nim">
                      <td class="center">
                        <input
                          type="checkbox"
                          :value="m.nim"
                          v-model="selectedMahasiswa"
                        />
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
                      <th style="width: 160px">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in assignedForSelected" :key="row.nim">
                      <td>{{ row.nim }}</td>
                      <td>{{ row.nama || '-' }}</td>
                      <td>
                        <button
                          v-if="isAdmin"
                          class="btn btn-danger"
                          @click="handleDelete(row.nim)"
                        >
                          Hapus
                        </button>
                        <button
                          v-else
                          class="btn btn-accent"
                          @click="handleViewCpl(row.nim)"
                        >
                          Lihat Pengukuran CPL
                        </button>
                      </td>
                    </tr>
                    <tr v-if="!assignedForSelected.length">
                      <td colspan="3" class="muted center">Belum ada mahasiswa</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <div v-if="loading" class="alert">Memuat data...</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import Header from '@/components/Header.vue'
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
const search = ref('')
const loading = ref(false)
const saving = ref(false)
const error = ref('')

const isAdmin = computed(() => auth.user?.role === 'admin')
const isDosen = computed(() => auth.user?.role === 'dosen')
const isDosenOnly = computed(() => isDosen.value && !isAdmin.value)
const defaultKurikulumId = import.meta.env.VITE_DEFAULT_KURIKULUM_ID || '2020'

const assignmentNimSet = computed(() => new Set(assignments.value.map((a) => a.nim)))

const filteredAvailable = computed(() => {
  const term = search.value.trim().toLowerCase()
  return mahasiswaList.value
    .filter((m) => !assignmentNimSet.value.has(m.nim))
    .filter((m) => {
      if (!term) return true
      return (
        m.nim?.toLowerCase().includes(term) ||
        m.nama?.toLowerCase().includes(term)
      )
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

const allFilteredSelected = computed(() =>
  filteredAvailable.value.length > 0 &&
  filteredAvailable.value.every((m) => selectedMahasiswa.value.includes(m.nim))
)

const someFilteredSelected = computed(() => {
  const total = filteredAvailable.value.length
  const selected = filteredAvailable.value.filter((m) => selectedMahasiswa.value.includes(m.nim)).length
  return selected > 0 && selected < total
})

const canAdd = computed(() =>
  !!selectedNip.value &&
  selectedMahasiswa.value.length > 0 &&
  !saving.value
)

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
    const tasks = selectedMahasiswa.value.map((nim) => addDosenWali({ nip: selectedNip.value, nim }))
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
  router.push(`/kurikulum/${defaultKurikulumId}/ukur-cpl?nim=${nim}`)
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
})

onMounted(() => {
  loadData()
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

.page-wrap {
  flex: 1;
  margin-top: 92px;
  padding: 32px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 12px;
  flex-wrap: wrap;
}

.page-header h2 {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-border);
  font-size: 14px;
}

.breadcrumb a {
  color: var(--color-text);
  text-decoration: none;
}

.separator {
  color: var(--color-border);
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 16px;
}

.card {
  border: 1px solid var(--color-border2);
  border-radius: 14px;
  background: linear-gradient(180deg, #fbfbfb 0%, #f7f7f7 100%);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.card-header {
  padding: 16px 16px 0 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.card-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
}

.card-body {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.muted {
  color: var(--color-border);
  font-size: 13px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 240px;
}

.select,
.input {
  padding: 10px 12px;
  border: 1px solid var(--color-border2);
  border-radius: 10px;
  font-size: 14px;
  background: #fff;
}

.actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
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
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 14px rgba(0, 0, 0, 0.08);
}

.btn-primary {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--color-border2);
}

.btn-danger {
  background: #dc2626;
  color: #fff;
  border-color: #c81e1e;
}

.btn-accent {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--color-border2);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.table-wrapper {
  width: 100%;
  overflow: auto;
  border: 1px solid var(--color-border2);
  border-radius: 10px;
  background: #fff;
}

.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.modern-table th,
.modern-table td {
  padding: 10px 12px;
  border-bottom: 1px solid var(--color-border2);
  text-align: left;
}

.modern-table thead {
  background: #f3f4f6;
}

.center {
  text-align: center;
}

.alert {
  padding: 12px 14px;
  background: #eef2ff;
  border: 1px solid #c7d2fe;
  border-radius: 10px;
}

.alert-error {
  background: #fef2f2;
  border-color: #fecaca;
  color: #b91c1c;
}
</style>
