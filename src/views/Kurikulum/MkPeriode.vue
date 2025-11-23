<template>
  <div class="mk-periode-container">
    <div class="page-header">
      <h1 class="page-title">MK - Periode</h1>
      <p class="page-subtitle">Kelola MK per Periode untuk Kurikulum: {{ idKurikulum }}</p>
    </div>

    <div class="controls">
      <label for="periode-select">Pilih Periode</label>
      <select id="periode-select" v-model="selectedPeriode" @change="loadMkPeriode">
        <option value="">-- Pilih Periode --</option>
        <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">{{ p.id_periode }}</option>
      </select>
      <button v-if="canManageKurikulumMk" class="btn-primary" @click="openAddModal" :disabled="!selectedPeriode">Tambah MK</button>
    </div>

    <div v-if="isLoading" class="loading">Memuat...</div>

    <div v-else>
      <div v-if="filteredList.length === 0" class="empty">Belum ada MK-periode untuk periode ini.</div>
      <table class="mk-table" v-else>
        <thead>
          <tr>
            <th>No.</th>
            <th>Kode MK</th>
            <th>Nama MK</th>
            <th>SKS</th>
            <th>Jenis MK</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(mp, idx) in filteredList" :key="mp.id_mk_periode">
            <td>{{ idx + 1 }}</td>
            <td>{{ mp.kode_mk }}</td>
            <td>{{ getMataKuliahNama(mp.kode_mk) }}</td>
            <td>
              <input type="number" v-model.number="mp._editable_sks" min="0" :disabled="!canManageKurikulumMk" />
            </td>
            <td>
              <select v-model="mp._editable_jenis" :disabled="!canManageKurikulumMk">
                <option value="Wajib">Wajib</option>
                <option value="Pilihan">Pilihan</option>
              </select>
            </td>
            <td>
              <button v-if="canManageKurikulumMk" class="btn-primary" @click="saveRow(mp)">Simpan</button>
              <button v-if="canManageKurikulumMk" class="btn-secondary" @click="deleteRow(mp)">Hapus</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Modal for add MK-periode -->
    <div v-if="showAddModal" class="modal-overlay" @click="closeAddModal">
      <div class="modal" @click.stop>
        <h3>Tambah MK-Periode</h3>
        <div class="form-row">
          <label>Kode MK</label>
          <input v-model="newMK.kode_mk" placeholder="Masukkan kode MK atau pilih dari list" />
          <select v-if="availableMKForAdd.length" v-model="selectedNewKodeMk" @change="onSelectNewKode">
            <option value="">Pilih MK yang belum terdaftar di periode ini</option>
            <option v-for="mk in availableMKForAdd" :key="mk.kode_mk" :value="mk.kode_mk">{{ mk.kode_mk }} - {{ mk.nama_mk }}</option>
          </select>
          <div v-else class="small muted">Semua mata kuliah sudah terdaftar di periode ini atau tidak ada MK tersedia.</div>
        </div>
        <div v-if="!mkStore.getMKByKode(newMK.kode_mk)" class="form-row">
          <label>Nama MK (baru)</label>
          <input v-model="newMK.nama_mk" placeholder="Masukkan nama mata kuliah jika kode baru" />
        </div>
        <div class="form-row">
          <label>SKS</label>
          <input type="number" v-model.number="newMK.sks" min="0" />
        </div>
        <div class="form-row">
          <label>Jenis MK</label>
          <select v-model="newMK.jenis_mk">
            <option value="Wajib">Wajib</option>
            <option value="Pilihan">Pilihan</option>
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" @click="closeAddModal">Batal</button>
          <button class="btn-primary" @click="addMkPeriode">Tambah</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { usePermissions } from '@/composables/usePermissions'
import { useMKStore } from '@/stores/mataKuliah'
import { getMkPeriodeList, addMkPeriode as apiAddMkPeriode, updateMkPeriode, deleteMkPeriode, getPeriodeList } from '@/api'

const route = useRoute()
const idKurikulum = route.params.id
const nilaiMkStore = useNilaiMkStore()
const mkStore = useMKStore()

const isLoading = ref(false)
const showAddModal = ref(false)
const selectedPeriode = ref('')
const newMK = ref({ kode_mk: '', nama_mk: '', sks: 3, jenis_mk: 'Wajib' })
const selectedNewKodeMk = ref('')

const periodeList = ref([])

const mataKuliahList = computed(() => mkStore.mataKuliahList)
const availableMKForAdd = computed(() => {
  if (!mataKuliahList.value || mataKuliahList.value.length === 0) return []
  const existingKode = new Set(mkPeriodeList.value.map((mp) => String(mp.kode_mk).trim().toUpperCase()))
  // Filter mataKuliahList to those not already in mkPeriode for selectedPeriode (and same kurikulum)
  return mataKuliahList.value.filter((mk) => {
    const kode = String(mk.kode_mk || mk.kode || mk.id).trim().toUpperCase()
    return !existingKode.has(kode)
  })
})

async function loadPeriode() {
  try {
    const resp = await getPeriodeList()
    if (resp?.data && resp.data.success) periodeList.value = resp.data.data
    else if (resp?.data && Array.isArray(resp.data)) periodeList.value = resp.data
  } catch (err) {
    console.error('Error loading periode list', err)
  }
}

const mkPeriodeList = ref([])
const filteredList = computed(() => mkPeriodeList.value.filter((mp) => String(mp.id_kurikulum) === String(idKurikulum) && String(mp.id_periode) === String(selectedPeriode.value)))

function getMataKuliahNama(kode_mk) {
  return mkStore.getMataKuliahNama(kode_mk)
}

async function loadMkPeriode() {
  if (!idKurikulum || !selectedPeriode.value) {
    mkPeriodeList.value = []
    return
  }
  isLoading.value = true
  try {
    // Use API to fetch filtered list by id_kurikulum + id_periode if supported
    const resp = await getMkPeriodeList({ id_kurikulum: idKurikulum, id_periode: selectedPeriode.value })
    let data = null
    if (resp?.data && resp.data.success) data = resp.data.data
    else if (resp?.data && Array.isArray(resp.data)) data = resp.data
    mkPeriodeList.value = Array.isArray(data) ? data : (data ? [data] : [])
    // Prepare editable fields
    mkPeriodeList.value.forEach((mp) => {
      mp._editable_sks = mp.sks || 0
      mp._editable_jenis = mp.jenis_mk || 'Wajib'
    })
    // Optionally, refresh global store list
    await nilaiMkStore.fetchMkPeriodeList()
  } catch (err) {
    console.error('Error loading mk-periode:', err)
    mkPeriodeList.value = []
  } finally {
    isLoading.value = false
  }
}

function openAddModal() {
  showAddModal.value = true
  newMK.value = { kode_mk: '', nama_mk: '', sks: 3, jenis_mk: 'Wajib' }
}

function closeAddModal() {
  showAddModal.value = false
  selectedNewKodeMk.value = ''
}

function onSelectNewKode() {
  if (selectedNewKodeMk.value) newMK.value.kode_mk = selectedNewKodeMk.value
}

async function addMkPeriode() {
  if (!selectedPeriode.value) {
    alert('Pilih periode terlebih dahulu')
    return
  }
  if (!newMK.value.kode_mk) {
    alert('Masukkan kode MK')
    return
  }
  try {
    const payload = {
      id_kurikulum: idKurikulum,
      kode_mk: newMK.value.kode_mk,
      id_periode: selectedPeriode.value,
      sks: Number(newMK.value.sks),
      jenis_mk: newMK.value.jenis_mk,
    }
    // If MK not found in MK store, optionally create MK first
    const existingMk = mkStore.getMKByKode(newMK.value.kode_mk)
    if (!existingMk) {
      if (!newMK.value.nama_mk) {
        if (!confirm('MK dengan kode ini tidak ditemukan. Apakah Anda ingin membuat MK baru tanpa nama?')) {
          return
        }
      }
      // Create MK in MK store to register it
      await mkStore.createMK({ kode_mk: newMK.value.kode_mk, nama_mk: newMK.value.nama_mk || newMK.value.kode_mk })
      // Refresh MK list so it is available in dropdowns
      await mkStore.fetchAllMK()
    }
    const resp = await apiAddMkPeriode(payload)
    if (resp.data && resp.data.success) {
      await loadMkPeriode()
      closeAddModal()
      alert('MK-periode berhasil ditambahkan')
    } else {
      alert('Gagal menambahkan MK-periode: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error adding mk-periode:', err)
    alert('Terjadi kesalahan saat menambahkan MK-periode')
  }
}

async function saveRow(mp) {
  try {
    const payload = { sks: Number(mp._editable_sks), jenis_mk: mp._editable_jenis }
    const resp = await updateMkPeriode(mp.id_mk_periode, payload)
    if (resp.data && resp.data.success) {
      mp.sks = payload.sks
      mp.jenis_mk = payload.jenis_mk
      alert('Perubahan disimpan')
      await loadMkPeriode()
    } else {
      alert('Gagal menyimpan perubahan: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error updating mk-periode:', err)
    alert('Terjadi kesalahan saat menyimpan perubahan')
  }
}

async function deleteRow(mp) {
  if (!confirm('Hapus MK-periode ini?')) return
  try {
    const resp = await deleteMkPeriode(mp.id_mk_periode)
    if (resp.data && resp.data.success) {
      await loadMkPeriode()
      alert('MK-periode dihapus')
    } else {
      alert('Gagal menghapus: ' + (resp.data?.message || 'Unknown'))
    }
  } catch (err) {
    console.error('Error deleting mk-periode:', err)
    alert('Terjadi kesalahan saat menghapus MK-periode')
  }
}

onMounted(async () => {
  await loadPeriode()
  await mkStore.fetchAllMK()
  await nilaiMkStore.fetchMkPeriodeList()
})

const { canManageKurikulumMk, isAdmin, isDosen } = usePermissions()
</script>

<style scoped>
.mk-periode-container { padding: 24px; }
.page-header { margin-bottom: 20px; }
.controls { display:flex; gap:12px; align-items:center; margin-bottom:12px; }
.mk-table { width:100%; border-collapse:collapse; }
.mk-table th, .mk-table td { padding:12px; border:1px solid #eee; }
.modal-overlay { position:fixed; top:0; right:0; left:0; bottom:0; background:rgba(0,0,0,0.4); display:flex; align-items:center; justify-content:center; }
.modal { background:white; padding:20px; border-radius:8px; width:400px; }
.form-row { margin-bottom:10px; display:flex; flex-direction:column; gap:6px; }
.modal-actions { display:flex; gap:12px; justify-content:flex-end; }
.btn-primary { background:#16a34a; color:white; padding:8px 12px; border-radius:6px; }
.btn-secondary { background:#f3f4f6; color:#374151; padding:8px 12px; border-radius:6px; }
.loading { padding:20px; }
.empty { padding:12px; color:#666; }
</style>
