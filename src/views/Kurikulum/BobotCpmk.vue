<template>
  <div class="bobot-cpmk-container">
    <h1 class="text-2xl font-bold mb-4">Bobot CPMK</h1>

    <div class="controls" style="margin-bottom:12px;">
      <label for="periode-select" class="mr-2">Periode:</label>
      <select id="periode-select" v-model="selectedPeriode" @change="onPeriodeChange">
        <option value="">Semua Periode</option>
        <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">{{ p.id_periode }}</option>
      </select>
      <div style="float:right" v-if="isAdmin || isDosen">
        <button class="btn-primary" @click="openAddModal" :disabled="!selectedPeriode">Tambah Bobot CPMK</button>
      </div>
    </div>
    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ editing ? 'Edit' : 'Tambah' }} Bobot CPMK</h3>
          <button class="modal-close" @click="closeModal">x</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Periode</label>
            <input type="text" class="form-input" :value="selectedPeriode" disabled />
          </div>
          <div class="form-group">
            <label>Mata Kuliah</label>
            <select v-model="formData.kode_mk" class="form-input">
              <option value="">Pilih MK</option>
              <option v-for="m in mkOptions" :key="m.kode_mk" :value="m.kode_mk">{{ m.kode_mk }} - {{ m.nama_mk }}</option>
            </select>
          </div>
          <div class="form-group" v-if="mkPeriodeOptionsFiltered.length > 0">
            <label>Varian MK (Periode)</label>
            <select v-model="formData.id_mk_periode" class="form-input">
              <option value="">Pilih Varian</option>
              <option v-for="mp in mkPeriodeOptionsFiltered" :key="mp.id_mk_periode" :value="mp.id_mk_periode">{{ mp.kode_mk }} - Kurikulum {{ mp.id_kurikulum }} ({{ mp.sks }} sks)</option>
          </select>
          </div>
          <div class="form-group">
            <label>CPMK (set bobot per CPMK)</label>
            <div v-if="availableCpmks.length === 0" class="form-help error-text">
              Tidak ada CPMK terkait untuk MK/Periode ini. Pastikan CPMK telah dihubungkan ke MK melalui korelasi CPMK-MK.
              <br />
              <small>
                <router-link :to="`/kurikulum/${route.params.id}/cpmk-mk`">Hubungkan CPMK ke MK (Korelasi CPMK-MK)</router-link>
              </small>
            </div>
            <div v-else style="margin-top:8px; display:flex; flex-direction:column; gap:8px">
              <div v-for="c in availableCpmks" :key="c.id_cpmk" style="display:flex; align-items:center; gap:12px;">
                <div style="flex:1; min-width:0;">{{ c.id_cpmk }} - {{ c.deskripsi || c.deskripsi_cpmk }}</div>
                <div style="width:140px;">
                  <input list="bobot-suggestions" type="number" class="form-input" min="0" max="100" step="0.01" :value="(formData.bobots && formData.bobots[c.id_cpmk]) ?? getExistingBobotFor(c.id_cpmk) ?? ''" @input="(e) => (formData.bobots = { ...formData.bobots, [c.id_cpmk]: Number(e.target.value) })" />
                </div>
              </div>
            </div>
            <div class="form-help" style="margin-top:8px">
              <strong>Jumlah bobot saat ini: {{ currentSumPercent.toFixed(2) }}%</strong>
              <br />
              <small>Jumlah CPMK terkait: {{ availableCpmksCount }}. Bobot saat ini terisi: {{ currentBobotsForSelected.length }}. Sisa: {{ (100 - currentSumPercent).toFixed(2) }}%</small>
              <div style="margin-top:6px">
                <span v-if="isSumValid" style="color:#15803d; font-weight:600">Jumlah bobot di form: {{ formSum.toFixed(2) }}% — valid</span>
                <span v-else style="color:#b91c1c; font-weight:700">Jumlah bobot di form: {{ formSum.toFixed(2) }}% — harus 100% sebelum menyimpan</span>
              </div>
            </div>
            <datalist id="bobot-suggestions">
              <option v-for="s in bobotSuggestions" :key="s" :value="s" />
            </datalist>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Batal</button>
          <button class="btn-primary" @click="submitForm" :disabled="!isSumValid" :title="!isSumValid ? 'Total bobot harus 100% sebelum menyimpan' : 'Simpan'">Simpan</button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading">Memuat data...</div>
    <div v-if="error" class="text-red-500">{{ error }}</div>

    <div v-if="!isLoading && !error">
      <table class="min-w-full bg-white border-collapse">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b text-left">Kode MK</th>
            <th class="py-2 px-4 border-b text-left">Nama MK</th>
            <th class="py-2 px-4 border-b text-left">Bobot CPMK</th>
            <th class="py-2 px-4 border-b text-left" v-if="isAdmin || isDosen">Aksi</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="mk in mergedList" :key="mk.id_mk_periode">
            <td class="py-2 px-4 border-b">{{ mk.kode_mk }}</td>
            <td class="py-2 px-4 border-b">{{ mk.nama_mk }}</td>
            <td class="py-2 px-4 border-b">
              <div v-if="mk.bobots.length === 0">-</div>
              <ul v-else>
                <li v-for="b in mk.bobots" :key="b.id_cpmk">{{ b.id_cpmk }}: {{ formatBobotValue(b.bobot) }}</li>
              </ul>
            </td>
            <td class="py-2 px-4 border-b" v-if="isAdmin || isDosen">
              <div v-if="mk.bobots.length === 0">
                <button class="btn-secondary" @click="openAddModal(mk.kode_mk)">Tambah</button>
              </div>
              <div v-else>
                <div v-for="b in mk.bobots" :key="b.id_cpmk" style="display:flex; align-items:center; gap:8px; margin-bottom:6px">
                  <span class="text-sm">{{ b.id_cpmk }} ({{ b.bobot }}%)</span>
                  <button class="btn-secondary" @click="openEditModal(mk.id_mk_periode, b.id_cpmk, b.bobot)">Edit</button>
                  <button class="btn-danger" @click="handleDelete(mk.id_mk_periode, b.id_cpmk)">Hapus</button>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <div v-if="mergedList.length === 0" class="empty-state">Belum ada data bobot CPMK untuk periode ini.</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useBobotCpmkStore } from '@/stores/bobotCpmk'
import { usePermissions } from '@/composables/usePermissions'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { useMKStore } from '@/stores/mataKuliah'
import { useCpmkMkStore } from '@/stores/cpmkMk'
import { useCPMKStore } from '@/stores/cpmk'
import { useRoute } from 'vue-router'

const store = useBobotCpmkStore()
const { isAdmin, isDosen } = usePermissions()
const nilaiMkStore = useNilaiMkStore()
const mkStore = useMKStore()
const route = useRoute()
const cpmkMkStore = useCpmkMkStore()
const cpmkStore = useCPMKStore()

const bobotList = computed(() => store.bobotCpmkList)
const mergedList = computed(() => store.mergedList)
const periodeList = computed(() => store.periodeList)
const selectedPeriode = ref('')
const showModal = ref(false)
const editing = ref(false)
// formData will now contain a mapping 'bobots' : { [id_cpmk]: number }
const formData = ref({ id_periode: '', id_mk_periode: '', kode_mk: '', bobots: {} })
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)

const mkPeriodeOptions = computed(() => (selectedPeriode.value ? nilaiMkStore.getMkPeriodeByPeriode(selectedPeriode.value) : []))
const mkOptions = computed(() => {
  const mps = mkPeriodeOptions.value || []
  const uniq = {}
  mps.forEach((mp) => {
    if (!uniq[mp.kode_mk]) uniq[mp.kode_mk] = mp
  })
  return Object.values(uniq).map((mp) => ({ kode_mk: mp.kode_mk, nama_mk: mp.nama_mk || '' }))
})
const mkPeriodeOptionsFiltered = computed(() => {
  if (!selectedPeriode.value || !formData.value.kode_mk) return []
  return mkPeriodeOptions.value.filter((mp) => mp.kode_mk === formData.value.kode_mk)
})
const availableCpmks = computed(() => {
  const kode = formData.value.kode_mk
  if (!kode) return []
  const mkObj = mkStore.getMKByKode(kode)
  if (!mkObj) return []
  // Accept a few possible identifiers: numeric id, kode_mk, kode, id_mk
  const candidates = new Set()
  if (mkObj.id) candidates.add(String(mkObj.id))
  if (mkObj.id_mk) candidates.add(String(mkObj.id_mk))
  if (mkObj.kode_mk) candidates.add(String(mkObj.kode_mk))
  if (mkObj.kode) candidates.add(String(mkObj.kode))
  // Also include any mk-periode id's that reference this kode_mk (some associations use id_mk_periode)
  const mpMatches = nilaiMkStore.mkPeriodeList.filter((mp) => mp.kode_mk === kode)
  const mpIds = new Set()
  mpMatches.forEach((mp) => mpIds.add(String(mp.id_mk_periode)))

  // If a specific mk-periode has been selected, prefer items explicitly linked by id_mk_periode
  const selectedMkPeriode = formData.value.id_mk_periode
  let linked = []
  if (selectedMkPeriode) {
    linked = cpmkMkStore.items.filter((item) => String(item.id_mk_periode || '') === String(selectedMkPeriode))
  }
  if (!linked.length) {
    // Strictly match items whose id_mk equals the candidate OR id_mk equals an id_mk_periode
    linked = cpmkMkStore.items.filter((item) => {
    const val = String(item.id_mk || '')
    if (!val) return false
    if (candidates.has(val)) return true
    if (mpIds.has(val)) return true
    // Some legacy items might store a composite like `${id_kurikulum}_${id_mk}` or contain code, try to match equality with kode
    if (kode && (val === kode || val === mkObj.kode_mk || val === mkObj.kode)) return true
    return false
  })
  }
  const ids = linked.map((l) => l.id_cpmk)
  return cpmkStore.cpmkList.filter((c) => ids.includes(c.id_cpmk))
})

// Helper to get existing bobot percentage for a cpmk in current selected mk-periode
function getExistingBobotFor(id_cpmk) {
  const idMp = formData.value.id_mk_periode
  if (!idMp) return null
  const b = store.bobotCpmkList.find((bb) => String(bb.id_mk_periode) === String(idMp) && String(bb.id_cpmk) === String(id_cpmk))
  if (!b) return null
  const val = (b.bobot ?? b.bobot_persen)
  let n = Number(val)
  if (!isNaN(n) && n > 0 && n <= 1.5) n = n * 100
  if (isNaN(n)) return null
  return Number(n)
}

const bobotSuggestions = computed(() => {
  const set = new Set()
  store.bobotCpmkList.forEach((b) => {
    let val = b.bobot ?? b.bobot_persen
    if (val === undefined || val === null) return
    const n = Number(val)
    if (!isNaN(n)) {
      // normalize fraction to percent
      const v = n > 0 && n <= 1.5 ? n * 100 : n
      set.add(Number(v).toFixed(2))
    }
  })
  return Array.from(set).sort((a,b) => Number(a) - Number(b))
})

// Helper: normalize stored or entered bobot into percent
function normalizeToPercent(val){
  const n = Number(val)
  if (isNaN(n)) return 0
  return (n > 0 && n <= 1.5) ? n * 100 : n
}

// bobots for currently selected mk-periode
const currentBobotsForSelected = computed(() => {
  if (!formData.value.id_mk_periode) return []
  return store.bobotCpmkList.filter((b) => String(b.id_mk_periode) === String(formData.value.id_mk_periode))
})

const currentSumPercent = computed(() => {
  const arr = currentBobotsForSelected.value || []
  return arr.reduce((acc, b) => {
    const v = normalizeToPercent(b.bobot ?? b.bobot_persen)
    return acc + (isNaN(v) ? 0 : v)
  }, 0)
})

// Count of linked CPMKs for the selected MK (from availableCpmks)
const availableCpmksCount = computed(() => (availableCpmks.value || []).length)

// Compute sum of form values currently edited (formData.bobots map, else existing)
const formSum = computed(() => {
  const cpms = availableCpmks.value || []
  let s = 0
  for (const c of cpms) {
    const id = c.id_cpmk
    const provided = formData.value.bobots && Object.prototype.hasOwnProperty.call(formData.value.bobots, id) ? formData.value.bobots[id] : null
    const raw = (provided !== null && provided !== undefined) ? provided : getExistingBobotFor(id) || 0
    const n = normalizeToPercent(raw || 0)
    s += Number(isNaN(n) ? 0 : n)
  }
  return s
})

const epsilon = 0.01
const isSumValid = computed(() => Math.abs(formSum.value - 100) <= epsilon)

onMounted(async () => {
  await store.fetchAllBobotCpmk()
  await cpmkStore.fetchAllCPMK()
  await cpmkMkStore.fetchAll()
  await mkStore.fetchAllMK()
  await nilaiMkStore.fetchInitialData()
  // If there are periode options, default to the first one
  if (periodeList.value && periodeList.value.length > 0) {
    selectedPeriode.value = periodeList.value[0].id_periode
    await store.fetchAllBobotCpmk(selectedPeriode.value)
  }
})

// When kode_mk selected, auto-select mk-periode if single option available
watch(() => formData.value.kode_mk, (newVal) => {
  if (!newVal) {
    formData.value.id_mk_periode = ''
    return
  }
  const filtered = mkPeriodeOptions.value.filter((mp) => mp.kode_mk === newVal)
  if (filtered.length === 1) {
    formData.value.id_mk_periode = filtered[0].id_mk_periode
  }
})

// When mk-periode selection changes, reset selected CPMK and preselect first option if available
watch(() => formData.value.id_mk_periode, (newVal) => {
  // Reset bobot map and prefill from existing bobots for this mk-periode
  formData.value.bobots = {}
  const avail = availableCpmks.value || []
  if (avail.length === 1) {
    // If single CPMK, default to existing value or 100
    const id = avail[0].id_cpmk
    const existing = getExistingBobotFor(id)
    formData.value.bobots[id] = existing || 100
    return
  }
  // Multi-CPMK - try to prefill with existing values
  avail.forEach((c) => {
    const v = getExistingBobotFor(c.id_cpmk)
    if (v !== null && v !== undefined) formData.value.bobots[c.id_cpmk] = v
  })
})

// Log available CPMK changes for debug
watch(availableCpmks, (newVal) => {
  if (!newVal || newVal.length === 0) {
    console.warn('No CPMK found for this MK. Check CPMK-MK correlations and MK-periode mapping.', { kode: formData.value.kode_mk, id_mk_periode: formData.value.id_mk_periode })
  } else {
    console.info('Available CPMKs for this MK:', newVal.map(c=>c.id_cpmk))
  }
})

const onPeriodeChange = async () => {
  await store.fetchAllBobotCpmk(selectedPeriode.value)
}

// Helpers to open modal for create/edit
function openAddModal(prefillMK = '') {
  editing.value = false
  const firstMK = prefillMK || (mkOptions.value && mkOptions.value.length > 0 ? mkOptions.value[0].kode_mk : '')
  // Initialize bobots map with existing values or 0
  const bobotsMap = {}
  const filtered = mkPeriodeOptions.value.filter((mp) => mp.kode_mk === firstMK)
  if (filtered.length === 1) {
    formData.value.id_mk_periode = filtered[0].id_mk_periode
    // prefill bobots with existing values
    const existing = store.bobotCpmkList.filter((b) => String(b.id_mk_periode) === String(filtered[0].id_mk_periode))
    existing.forEach((b) => {
      const val = (b.bobot ?? b.bobot_persen)
      let n = Number(val)
      if (!isNaN(n) && n > 0 && n <= 1.5) n = n * 100
      bobotsMap[b.id_cpmk] = Number(n)
    })
  }
  formData.value = { id_periode: selectedPeriode.value, id_mk_periode: formData.value.id_mk_periode || '', kode_mk: firstMK, bobots: bobotsMap }
  // If there's only one mkPeriode for this MK and selectedPeriode, pick it
  showModal.value = true
}

function openEditModal(mkPeriodeId, id_cpmk, bobotVal) {
  editing.value = true
  const mp = store.mkPeriodeList.find((m) => String(m.id_mk_periode) === String(mkPeriodeId)) || {}
  // Prefill map of bobots for all available cpmk for the mkPeriode
  const bobotsMap = {}
  const existing = store.bobotCpmkList.filter((b) => String(b.id_mk_periode) === String(mkPeriodeId))
  existing.forEach((b) => {
    let n = Number(b.bobot ?? b.bobot_persen)
    if (!isNaN(n) && n > 0 && n <= 1.5) n = n * 100
    bobotsMap[b.id_cpmk] = Number(n)
  })
  formData.value = { id_periode: mp.id_periode || selectedPeriode.value, id_mk_periode: mkPeriodeId, kode_mk: mp.kode_mk || '', bobots: bobotsMap }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editing.value = false
  formData.value = { id_periode: '', id_mk_periode: '', kode_mk: '', bobots: {} }
}

async function submitForm() {
  // Bulk create/update bobots for all available CPMKs
  if (!formData.value.id_mk_periode || !formData.value.kode_mk) {
    alert('Pilih MK dan varian MK terlebih dahulu')
    return
  }
  const cpms = availableCpmks.value || []
  if (!cpms.length) {
    alert('Tidak ada CPMK yang terhubung ke MK ini. Hubungkan CPMK ke MK di halaman korelasi CPMK-MK terlebih dahulu.')
    return
  }
  const finalMap = {}
  for (const c of cpms) {
    const id = c.id_cpmk
    const raw = formData.value.bobots && Object.prototype.hasOwnProperty.call(formData.value.bobots, id)
      ? formData.value.bobots[id]
      : getExistingBobotFor(id) || 0
    const n = normalizeToPercent(raw || 0)
    finalMap[id] = Number(n)
  }
  const sum = Object.values(finalMap).reduce((a, b) => a + (isNaN(Number(b)) ? 0 : Number(b)), 0)
  const epsilon = 0.01
  if (Math.abs(sum - 100) > epsilon) {
    alert(`Total bobot untuk semua CPMK harus 100%. Saat ini total: ${sum.toFixed(2)}%`)
    console.warn('Bobot validation failed; sum != 100', { sum, finalMap })
    return
  }
  // Build async tasks to perform create/edit/remove where necessary
  const tasks = []
  for (const c of cpms) {
    const id = c.id_cpmk
    const newVal = finalMap[id]
    const existing = store.bobotCpmkList.find((b) => String(b.id_mk_periode) === String(formData.value.id_mk_periode) && String(b.id_cpmk) === String(id))
    if (existing) {
      const oldVal = normalizeToPercent(existing.bobot ?? existing.bobot_persen)
      if (Math.abs(oldVal - newVal) > epsilon) {
        if (newVal === 0) {
          tasks.push(store.removeBobotCpmk(formData.value.id_mk_periode, id))
        } else {
          tasks.push(store.editBobotCpmk(formData.value.id_mk_periode, id, { bobot_persen: newVal }))
        }
      }
    } else {
      if (newVal > 0) {
        tasks.push(store.createBobotCpmk({ id_mk_periode: formData.value.id_mk_periode, id_cpmk: id, bobot_persen: newVal }))
      }
    }
  }
  // Execute all tasks in parallel (if any)
  if (tasks.length) {
    try {
      await Promise.all(tasks)
    } catch (err) {
      console.error('Error saving bobot CPMK bulk update', err)
      alert('Terjadi kesalahan saat menyimpan bobot CPMK. Silakan coba lagi.')
      return
    }
  }
  // Refresh and close
  await store.fetchAllBobotCpmk(selectedPeriode.value)
  showModal.value = false
  await store.fetchAllBobotCpmk(selectedPeriode.value)
  showModal.value = false
}

async function handleDelete(mkPeriodeId, id_cpmk) {
  if (!confirm('Hapus bobot CPMK ini?')) return
  // Compute sum after deletion and warn if total won't equal 100
  const old = store.bobotCpmkList.find((b) => String(b.id_mk_periode) === String(mkPeriodeId) && String(b.id_cpmk) === String(id_cpmk))
  const oldVal = old ? normalizeToPercent(old.bobot ?? old.bobot_persen) : 0
  const newSum = currentSumPercent.value - (oldVal || 0)
  const availableCount = availableCpmksCount.value
  const existingCountAfter = (currentBobotsForSelected.value.length || 0) - 1
  const epsilon = 0.01
  if (existingCountAfter > 0 && Math.abs(newSum - 100) > epsilon) {
    if (!confirm(`Setelah penghapusan, total bobot akan menjadi ${newSum.toFixed(2)}% (tidak sama dengan 100%). Apakah Anda yakin ingin melanjutkan?`)) return
  }
  await store.removeBobotCpmk(mkPeriodeId, id_cpmk)
  await store.fetchAllBobotCpmk(selectedPeriode.value)
}

// compute cpmk options for a given mk
const cpmkOptionsForMk = (kode_mk) => {
  const mpEntries = nilaiMkStore.mkPeriodeList.filter((mp) => mp.kode_mk === kode_mk)
  const mkIds = new Set(mpEntries.map((mp) => String(mp.id_mk_periode)))
  // cpmkMkStore.items contain id_mk references, need to find cpmk for mk
  const mkObjs = mkStore.getMKByKode(kode_mk) || {}
  const id_mk = mkObjs.id || mkObjs.kode || mkObjs.id_mk || mkObjs.kode_mk
  if (!id_mk) return []
  const linked = cpmkMkStore.items.filter((item) => String(item.id_mk) === String(id_mk))
  const ids = linked.map((l) => l.id_cpmk)
  return cpmkStore.cpmkList.filter((c) => ids.includes(c.id_cpmk))
}

function formatBobotValue(v) {
  if (v === null || v === undefined) return '-'
  const num = Number(v)
  if (isNaN(num)) return String(v)
  // If small fractional, multiply by 100
  if (num > 0 && num <= 1.5) return (num * 100).toFixed(2) + '%'
  return num.toFixed(2) + '%'
}
</script>

<style scoped>
.bobot-cpmk-container {
  width: 100%;
}
.empty-state {
  margin-top: 24px;
  color: #6b7280;
}
.loading {
  color: #6b7280;
}
.modal-overlay{ position: fixed; inset:0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000 }
.modal-content{ background:#fff; border-radius:8px; width:90%; max-width:560px; max-height:90vh; overflow:auto; box-shadow:0 20px 25px rgba(0,0,0,0.1) }
.modal-header{ padding:12px 16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center }
.modal-body{ padding:16px }
.modal-footer{ padding:12px 16px; border-top:1px solid #eee; display:flex; justify-content:flex-end; gap:8px }
.form-group{ margin-bottom:12px }
.form-input{ width:100%; padding:8px; border-radius:6px; border:1px solid #d1d5db }
.btn-primary{ padding:8px 12px; background:#15803d; color:#fff; border: none; border-radius:6px }
.btn-secondary{ padding:6px 10px; background:#f3f4f6; color:#374151; border: 1px solid #d1d5db; border-radius:6px }
.btn-danger{ padding:6px 10px; background:#ef4444; color:#fff; border:none; border-radius:6px }
.form-help{ font-size:12px; color:#6b7280; margin-top:6px }
</style>