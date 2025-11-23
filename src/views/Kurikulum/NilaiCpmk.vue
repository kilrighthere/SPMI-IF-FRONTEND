<template>
  <div>
    <h1 class="text-2xl font-bold mb-4">Nilai CPMK</h1>

    <div class="filters mb-4">
      <label for="periode" class="mr-2">Periode</label>
      <select id="periode" v-model="selectedPeriode" class="mr-4">
        <option value="">Pilih periode</option>
        <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">{{ p.id_periode }}</option>
      </select>

      <label for="mk-periode" class="mr-2">Mata Kuliah</label>
      <select id="mk-periode" v-model="selectedMataKuliah" :disabled="!selectedPeriode">
        <option value="">Pilih MK (Periode)</option>
        <option v-for="mk in mkOptions" :key="mk.kode_mk" :value="mk.kode_mk">
          {{ mk.kode_mk }} - {{ mk.nama_mk }}
        </option>
      </select>
      
      <!-- Show MK-periode variant selector if more than one variant exists for this MK--> 
      <template v-if="mkPeriodeOptionsFiltered.length > 1">
        <label for="mk-periode-variant" class="ml-4 mr-2">Varian MK</label>
        <select id="mk-periode-variant" v-model="selectedMkPeriode" :disabled="!selectedPeriode">
          <option value="">Pilih Varian MK (periode)</option>
          <option v-for="mp in mkPeriodeOptionsFiltered" :key="mp.id_mk_periode" :value="mp.id_mk_periode">
            {{ mp.kode_mk }} - {{ nilaiMkStore.getMataKuliahNama(mp.kode_mk) }} ({{ mp.sks }} sks) - Kurikulum {{ mp.id_kurikulum }}
          </option>
        </select>
      </template>
      <div style="float:right" v-if="canManageKurikulumMk">
        <button class="btn-primary" @click="openAddModal" :disabled="!selectedPeriode">Tambah Nilai CPMK</button>
      </div>
    </div>

    <div v-if="isLoading">Loading...</div>
    <div v-if="error" class="text-red-500">{{ error }}</div>

    <div v-if="!selectedPeriode && !isLoading" class="text-gray-600">Pilih periode dahulu untuk melihat data nilai CPMK.</div>

    <div v-else-if="selectedPeriode && !selectedMataKuliah && !isLoading" class="text-gray-600">Pilih Mata Kuliah (periode) untuk melihat nilai CPMK per mahasiswa.</div>

    <div v-else-if="selectedPeriode && selectedMataKuliah && !isLoading">
      <table class="min-w-full bg-white">
        <thead>
          <tr>
            <th class="py-2 px-4 border-b">NIM</th>
            <th class="py-2 px-4 border-b">Nama</th>
            <th v-for="c in cpmkIds" :key="c" class="py-2 px-4 border-b">{{ c }}<span v-if="cpmkDesc[c]"> - {{ cpmkDesc[c] }}</span></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="nim in studentNims" :key="nim">
            <td class="py-2 px-4 border-b">{{ nim }}</td>
            <td class="py-2 px-4 border-b">{{ mahasiswaMap[nim] || '-' }}</td>
            <td v-for="c in cpmkIds" :key="c" class="py-2 px-4 border-b">{{ grid[nim] && grid[nim][c] ? grid[nim][c] : '' }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- Add Nilai CPMK Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Tambah Nilai CPMK</h3>
          <button class="modal-close" @click="closeModal">x</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Periode</label>
            <input type="text" :value="selectedPeriode" disabled class="form-input" />
          </div>
          <div class="form-group">
            <label>Mata Kuliah</label>
            <select v-model="formData.kode_mk" class="form-input" @change="() => { if (!formData.id_mk_periode && formData.kode_mk) { const r = nilaiMkStore.resolveIdMkPeriode(formData.kode_mk, formData.id_periode || selectedPeriode); if (r) formData.id_mk_periode = r } }">
              <option value="">Pilih MK</option>
              <option v-for="mk in mkOptions" :key="mk.kode_mk" :value="mk.kode_mk">{{ mk.kode_mk }} - {{ mk.nama_mk }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>NIM</label>
            <div class="autocomplete-wrapper">
              <input type="text" class="form-input" v-model="formData.nim" @input="onMahasiswaInput" @focus="onMahasiswaInput" />
              <div v-if="showMahasiswaDropdown" class="autocomplete-dropdown">
                <div v-for="m in mahasiswaSuggestions" :key="m.nim" class="autocomplete-item" @mousedown.prevent="selectMahasiswaSuggestion(m)">
                  <div class="nim">{{ m.nim }}</div>
                  <div class="nama">{{ m.nama }}</div>
                </div>
              </div>
            </div>
            <div v-if="formData.nim && mahasiswaMap[formData.nim]" class="form-help">Nama: {{ mahasiswaMap[formData.nim] }}</div>
          </div>
          <div class="form-group">
            <label>Nilai CPMK (masukkan nilai untuk setiap CPMK)</label>
            <div v-if="availableCpmks.length === 0" class="form-help error-text">
              Tidak ada CPMK terkait untuk MK/Periode ini. Pastikan CPMK telah dihubungkan ke MK melalui korelasi CPMK-MK.
            </div>
            <div v-else style="display:flex; flex-direction:column; gap:8px; margin-top:6px">
              <div class="cpmk-row cpmk-header" style="font-weight:600; border-bottom:1px solid #eee; padding-bottom:6px;">
                <div class="cpmk-label">CPMK</div>
                <div class="cpmk-max">Bobot Maks</div>
                <div class="cpmk-input">Nilai</div>
                <div class="cpmk-max-hint">Status</div>
              </div>
              <div v-if="!formData.nim" class="form-help" style="color:#b91c1c">Isi NIM terlebih dahulu untuk mengaktifkan input nilai CPMK.</div>
              <div v-for="c in availableCpmks" :key="c.id_cpmk" class="cpmk-row">
                <div class="cpmk-label">{{ c.id_cpmk }} - {{ c.deskripsi || c.deskripsi_cpmk }}</div>
                <div class="cpmk-max">Max Bobot: <strong>{{ currentBobotFor(c.id_cpmk) != null ? currentBobotFor(c.id_cpmk).toFixed(2) + '%' : 'N/A' }}</strong></div>
                <div class="cpmk-input">
                  <input type="number" class="form-input" min="0" max="100" step="0.01" :disabled="!formData.nim || currentBobotFor(c.id_cpmk) === null" :value="formData.nilaiMap[c.id_cpmk] ?? getExistingNilaiFor(c.id_cpmk, formData.nim) ?? ''" @input="(e) => (formData.nilaiMap = { ...formData.nilaiMap, [c.id_cpmk]: e.target.value ? Number(e.target.value) : '' })" />
                </div>
                <div class="cpmk-max-hint">
                  <small v-if="currentBobotFor(c.id_cpmk) != null" :class="Number(formData.nilaiMap[c.id_cpmk]) > Number(currentBobotFor(c.id_cpmk)) ? 'error-text' : ''">Maks: {{ currentBobotFor(c.id_cpmk)?.toFixed(2) }}%</small>
                  <small v-else class="form-help">Bobot tidak tersedia. Silakan tentukan bobot CPMK terlebih dahulu.</small>
                </div>
                <div class="cpmk-error">
                  <small v-if="formData.nilaiMap[c.id_cpmk] !== undefined && String(formData.nilaiMap[c.id_cpmk]) !== '' && Number(formData.nilaiMap[c.id_cpmk]) > Number(currentBobotFor(c.id_cpmk))" class="error-text">Nilai melebihi bobot CPMK</small>
                </div>
              </div>
            </div>
          </div>
          <div class="form-group">
            <small class="form-help">Masukkan nilai per CPMK di sebelah kanan. Setiap nilai tidak boleh melebihi bobot maksimal yang ditentukan.</small>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="closeModal">Batal</button>
          <button class="btn-primary" @click="submitAddNilaiCpmk" :disabled="!isNilaiFormValid" :title="!isNilaiFormValid ? 'Lengkapi NIM dan minimal satu nilai yang valid' : 'Simpan Nilai CPMK'">Simpan Nilai CPMK</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed, ref, watch } from 'vue'
import { useNilaiCpmkStore } from '@/stores/nilaiCpmk'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { useCPMKStore } from '@/stores/cpmk'
import { useCpmkMkStore } from '@/stores/cpmkMk'
import { useMKStore } from '@/stores/mataKuliah'
import { useMahasiswaStore } from '@/stores/mahasiswa'
import { usePermissions } from '@/composables/usePermissions'
import { useBobotCpmkStore } from '@/stores/bobotCpmk'

const store = useNilaiCpmkStore()

const nilaiCpmkList = computed(() => store.nilaiCpmkList)
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)
            const bobotCpmkStore = useBobotCpmkStore()
const nilaiMkStore = useNilaiMkStore()
const cpmkStore = useCPMKStore()

const selectedPeriode = ref('')
const selectedMataKuliah = ref('')
const selectedMkPeriode = ref('')
const showModal = ref(false)
const formData = ref({ id_periode: '', kode_mk: '', id_mk_periode: '', nilaiMap: {}, nim: '' })

const cpmkMkStore = useCpmkMkStore()
const mkStore = useMKStore()
const mahasiswaStore = useMahasiswaStore()
const { canManageKurikulumMk } = usePermissions()

const mahasiswaSuggestions = ref([])
const showMahasiswaDropdown = ref(false)
let mahasiswaSearchTimer = null

const periodeList = computed(() => nilaiMkStore.periodeList)
const mkPeriodeOptions = computed(() => (selectedPeriode.value ? nilaiMkStore.getMkPeriodeByPeriode(selectedPeriode.value) : []))
const mkPeriodeOptionsFiltered = computed(() => {
  if (!selectedPeriode.value || !selectedMataKuliah.value) return []
  return mkPeriodeOptions.value.filter((mp) => mp.kode_mk === selectedMataKuliah.value)
})
const mkOptions = computed(() => {
  const mps = mkPeriodeOptions.value || []
  const uniq = {}
  mps.forEach((mp) => {
    if (!uniq[mp.kode_mk]) uniq[mp.kode_mk] = mp
  })
  return Object.values(uniq).map((mp) => ({ kode_mk: mp.kode_mk, nama_mk: nilaiMkStore.getMataKuliahNama(mp.kode_mk) || mp.nama_mk || '' }))
})
const cpmkDesc = computed(() => {
  const map = {}
  cpmkStore.cpmkList.forEach((c) => (map[c.id_cpmk] = c.deskripsi || c.deskripsi_cpmk || ''))
  return map
})
const mahasiswaMap = computed(() => nilaiMkStore.mahasiswaMap)

const availableCpmks = computed(() => {
  const kode = formData.value.kode_mk || selectedMataKuliah.value
  if (!kode) return []
  const mkObj = mkStore.getMKByKode(kode)
  if (!mkObj) return []
  const id_mk = mkObj.id || mkObj.kode || mkObj.id_mk || mkObj.kode_mk
  // cpmkMkStore.items have id_mk as reference; find cpmk ids
  const linked = cpmkMkStore.items.filter((item) => String(item.id_mk) === String(id_mk))
  // map to full cpmk objects
  const ids = linked.map((l) => l.id_cpmk)
  const res = cpmkStore.cpmkList.filter((c) => ids.includes(c.id_cpmk))
  return res
})


onMounted(async () => {
  await nilaiMkStore.fetchInitialData()
  await cpmkStore.fetchAllCPMK()
  await cpmkMkStore.fetchAll()
  await mkStore.fetchAllMK()
  if (selectedPeriode.value) await bobotCpmkStore.fetchAllBobotCpmk(selectedPeriode.value)
  // if there is a default periode, set it
  if (nilaiMkStore.periodeList && nilaiMkStore.periodeList.length === 1) {
    selectedPeriode.value = nilaiMkStore.periodeList[0].id_periode
  }
})

watch(selectedPeriode, async (newVal) => {
  selectedMataKuliah.value = ''
  selectedMkPeriode.value = ''
  if (newVal) {
    // clear store list and optionally fetch default when periode selected
    if (bobotCpmkStore && typeof bobotCpmkStore.fetchAllBobotCpmk === 'function') {
      await bobotCpmkStore.fetchAllBobotCpmk(newVal)
    }
  }
})

watch(selectedMataKuliah, async (newVal) => {
  if (newVal) {
    // Ensure mk-periode list is available for resolution
    if (!nilaiMkStore.mkPeriodeList || nilaiMkStore.mkPeriodeList.length === 0) {
      await nilaiMkStore.fetchMkPeriodeList()
    }

    // First try a direct resolution to a single id_mk_periode
    const resolved = nilaiMkStore.resolveIdMkPeriode(newVal, selectedPeriode.value)
    if (resolved) {
      selectedMkPeriode.value = String(resolved)
      await store.fetchNilaiByFilter({ id_mk_periode: resolved })
      return
    }

    // If direct resolution failed, check if there are multiple mk-periode entries for the same kode+periode
    const candidates = mkPeriodeOptionsFiltered.value
    if (candidates && candidates.length > 0) {
      // auto-select first candidate but allow user to change
      selectedMkPeriode.value = String(candidates[0].id_mk_periode)
      await store.fetchNilaiByFilter({ id_mk_periode: selectedMkPeriode.value })
      return
    }

    // Fallback: pass kode_mk + id_periode to store (store will try to map to ids or fallback wisely)
    await store.fetchNilaiByFilter({ kode_mk: newVal, id_periode: selectedPeriode.value })
  }
})

watch(selectedMataKuliah, (val) => {
  if (val) formData.value.kode_mk = val
  else formData.value.kode_mk = ''
})

// watch for when user explicitly selects a mk-periode variant
watch(selectedMkPeriode, async (newVal) => {
  if (newVal) {
    await store.fetchNilaiByFilter({ id_mk_periode: newVal })
    formData.value.id_mk_periode = newVal
  }
})

  // When kode_mk or selectedMkPeriode change, reset nilaiMap. When selectedMkPeriode changes, ensure formData.id_mk_periode is set.
watch(() => formData.value.kode_mk, (newVal) => {
  formData.value.nilaiMap = {}
})

watch(() => formData.value.id_mk_periode, (newVal) => {
  if (!newVal) return
  // If nim present, prefill nilai map for that nim
  if (formData.value.nim) prefillNilaiMapForNim(formData.value.nim)
})

watch(() => formData.value.nim, (newVal) => {
  if (!newVal) return
  // Prefill nilai for selected nim
  prefillNilaiMapForNim(newVal)
})

// Modal methods
async function openAddModal() {
  // ensure prerequisites
  if (!nilaiMkStore.mkPeriodeList || nilaiMkStore.mkPeriodeList.length === 0) await nilaiMkStore.fetchMkPeriodeList()
  if (!mahasiswaStore.mahasiswaList || mahasiswaStore.mahasiswaList.length === 0) await mahasiswaStore.fetchMahasiswa()
  formData.value = { id_periode: selectedPeriode.value, kode_mk: selectedMataKuliah.value, id_mk_periode: '', id_cpmk: '', nim: '', nilai: '' }
  formData.value.nilaiMap = {}
  // auto-select mk-periode id if kode + periode available
  if (formData.value.kode_mk && formData.value.id_periode) {
    const resolved = nilaiMkStore.resolveIdMkPeriode(formData.value.kode_mk, formData.value.id_periode)
    if (resolved) formData.value.id_mk_periode = resolved
  }
  // override with explicit variant selection if user already selected one
  if (selectedMkPeriode.value) formData.value.id_mk_periode = selectedMkPeriode.value
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formData.value = { id_periode: '', kode_mk: '', id_mk_periode: '', nilaiMap: {}, nim: '' }
  mahasiswaSuggestions.value = []
  showMahasiswaDropdown.value = false
}

function onMahasiswaInput() {
  const q = String(formData.value.nim || '').trim()
  if (!q || q.length < 1) {
    mahasiswaSuggestions.value = []
    showMahasiswaDropdown.value = false
    return
  }
  if (mahasiswaSearchTimer) clearTimeout(mahasiswaSearchTimer)
  mahasiswaSearchTimer = setTimeout(() => {
    const qLower = q.toLowerCase()
    const matches = mahasiswaStore.mahasiswaList.filter((m) => {
      const nim = String(m.nim || '')
      const name = String(m.nama || '').toLowerCase()
      return nim.includes(qLower) || name.includes(qLower)
    })
    mahasiswaSuggestions.value = matches.slice(0, 12)
    showMahasiswaDropdown.value = mahasiswaSuggestions.value.length > 0
  }, 200)
}

function selectMahasiswaSuggestion(m) {
  formData.value.nim = m.nim
  showMahasiswaDropdown.value = false
  prefillNilaiMapForNim(m.nim)
}

function getExistingNilaiFor(id_cpmk, nim) {
  if (!nim) return null
  const idMp = formData.value.id_mk_periode || selectedMkPeriode.value
  if (!idMp) return null
  const e = nilaiCpmkList.value.find((n) => String(n.id_mk_periode) === String(idMp) && String(n.id_cpmk) === String(id_cpmk) && String(n.nim) === String(nim))
  if (!e) return null
  return Number(e.nilai)
}

function prefillNilaiMapForNim(nim) {
  formData.value.nilaiMap = {}
  if (!nim) return
  const idMp = formData.value.id_mk_periode || selectedMkPeriode.value || (formData.value.kode_mk && formData.value.id_periode ? nilaiMkStore.resolveIdMkPeriode(formData.value.kode_mk, formData.value.id_periode) : null)
  if (!idMp) return
  const entries = nilaiCpmkList.value.filter((n) => String(n.nim) === String(nim) && String(n.id_mk_periode) === String(idMp))
  const ids = new Set(entries.map((x) => x.id_cpmk))
  for (const c of availableCpmks.value) {
    if (ids.has(c.id_cpmk)) {
      const e = entries.find((x) => x.id_cpmk === c.id_cpmk)
      if (e) formData.value.nilaiMap[c.id_cpmk] = Number(e.nilai)
    }
  }
}

async function submitAddNilaiCpmk() {
  // Basic validation
  if (!formData.value.nim || !formData.value.kode_mk) {
    alert('Lengkapi semua field: NIM dan Mata Kuliah')
    return
  }
  // prefer explicit selectedMkPeriode if available
  if (selectedMkPeriode.value) {
    formData.value.id_mk_periode = selectedMkPeriode.value
  }
  // resolve id_mk_periode if not present and kode/id_periode provided
  if (!formData.value.id_mk_periode && formData.value.kode_mk && formData.value.id_periode) {
    const resolved = nilaiMkStore.resolveIdMkPeriode(formData.value.kode_mk, formData.value.id_periode)
    if (resolved) formData.value.id_mk_periode = resolved
    else {
      alert('Tidak dapat menemukan MK-Periode untuk MK dan periode yang dipilih')
      return
    }
  }
  if (!formData.value.nilaiMap || Object.keys(formData.value.nilaiMap).length === 0) {
    alert('Masukkan setidaknya satu nilai CPMK untuk disimpan.')
    return
  }
  // Validate each entered nilai: 0-100 and <= bobot
  const toSave = []
  for (const [id_cpmk, valRaw] of Object.entries(formData.value.nilaiMap)) {
    if (valRaw === '' || valRaw === null || valRaw === undefined) continue
    const v = Number(valRaw)
    if (isNaN(v) || v < 0 || v > 100) {
      alert(`Nilai untuk ${id_cpmk} harus berupa angka antara 0 dan 100`)
      return
    }
    const maxBobot = currentBobotFor.value(id_cpmk)
    if (maxBobot !== null && !isNaN(Number(maxBobot)) && v > Number(maxBobot)) {
      alert(`Nilai untuk ${id_cpmk} melebihi bobot maksimal (${Number(maxBobot).toFixed(2)}%). Harap sesuaikan.`)
      return
    }
    toSave.push({ id_cpmk, nilai: v })
  }
  if (toSave.length === 0) {
    alert('Tidak ada nilai CPMK yang diisi untuk disimpan.')
    return
  }
  // prepare payload (bulk handled below)
  // Build tasks for bulk save
  const tasks = []
  for (const s of toSave) {
    const p = { nim: formData.value.nim, id_cpmk: s.id_cpmk, nilai: s.nilai }
    if (formData.value.id_mk_periode) p.id_mk_periode = formData.value.id_mk_periode
    else if (formData.value.kode_mk && formData.value.id_periode) {
      p.kode_mk = formData.value.kode_mk
      p.id_periode = formData.value.id_periode
    }
    tasks.push(store.createNilaiCpmk(p, { id_periode: formData.value.id_periode }))
  }
  try {
    await Promise.all(tasks)
    alert('Nilai CPMK berhasil disimpan')
    await store.fetchNilaiByFilter({ id_mk_periode: formData.value.id_mk_periode, id_periode: formData.value.id_periode })
    closeModal()
  } catch (err) {
    console.error('Error saving nilai CPMK bulk', err)
    alert('Terjadi kesalahan saat menyimpan beberapa nilai. Periksa konsol dan coba lagi.')
  }
}

// compute grid
const cpmkIds = computed(() => {
  const set = new Set(nilaiCpmkList.value.map((i) => i.id_cpmk))
  return Array.from(set)
})

            // Return bobot entry for the current selected Mk-periode and CPMK as integer percentage
            const currentBobotFor = computed(() => {
              return (id_cpmk) => {
                // prefer the currently selected mk-periode if explicitly selected in UI
                const idMp = selectedMkPeriode.value || formData.value.id_mk_periode || nilaiMkStore.resolveIdMkPeriode(selectedMataKuliah.value, selectedPeriode.value)
                if (!idMp) return null
                const mp = bobotCpmkStore.mergedList.find((m) => String(m.id_mk_periode) === String(idMp))
                if (!mp || !mp.bobots) return null
                const b = mp.bobots.find((bb) => bb.id_cpmk === id_cpmk)
                if (!b || b.bobot === undefined || b.bobot === null) return null
                let val = Number(b.bobot)
                // If bobot is fractional (e.g., 0.41) convert to percent
                if (!isNaN(val) && val > 0 && val <= 1.5) {
                  val = val * 100
                }
                return Number(val)
              }
            })
const studentNims = computed(() => {
  const set = new Set(nilaiCpmkList.value.map((i) => i.nim))
  return Array.from(set)
})

const grid = computed(() => {
  const g = {}
  nilaiCpmkList.value.forEach((i) => {
    if (!g[i.nim]) g[i.nim] = {}
    g[i.nim][i.id_cpmk] = i.nilai
  })
  return g
})

// (No selectedBobot computed implemented; using currentBobotFor() directly per CPMK.)

  // Compute whether any nilai in the form exceeds bobot or invalid
  const hasInvalidNilai = computed(() => {
    if (!formData.value.nilaiMap) return false
    for (const [id, v] of Object.entries(formData.value.nilaiMap)) {
      if (v === '' || v === null || v === undefined) continue
      const n = Number(v)
      if (isNaN(n) || n < 0 || n > 100) return true
      const max = currentBobotFor.value ? currentBobotFor.value(id) : null
      if (max !== null && !isNaN(Number(max)) && n > Number(max)) return true
    }
    return false
  })

  const isNilaiFormValid = computed(() => {
    if (!formData.value.nim) return false
    // must have at least one nilai set
    const keys = Object.keys(formData.value.nilaiMap || {})
    if (!keys.length) return false
    if (hasInvalidNilai.value) return false
    return true
  })
</script>

<style scoped>
/* Minimal modal styles reused from NilMatkul */
.modal-overlay{ position: fixed; top:0; left:0; right:0; bottom:0; background: rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:1000 }
.modal-content{ background:#fff; border-radius:8px; width:90%; max-width:500px; max-height:90vh; overflow:auto; box-shadow: 0 20px 25px rgba(0,0,0,0.1); }
.modal-header{ padding:16px; border-bottom:1px solid #eee; display:flex; justify-content:space-between; align-items:center }
.modal-body{ padding:16px }
.modal-footer{ padding:12px 16px; border-top:1px solid #eee; display:flex; justify-content:flex-end; gap:8px }
.form-group{ margin-bottom:12px }
.form-input{ width:100%; padding:8px; border-radius:6px; border:1px solid #d1d5db }
.btn-primary{ padding:8px 12px; background:#15803d; color:#fff; border:none; border-radius:6px }
.btn-secondary{ padding:8px 12px; background:#f3f4f6; color:#374151; border:1px solid #d1d5db; border-radius:6px }
.autocomplete-dropdown{ position:absolute; left:0; right:0; background:#fff; border:1px solid #ddd; z-index:1000; max-height:220px; overflow:auto }
.autocomplete-item{ padding:8px 12px; display:flex; gap:8px; align-items:center; cursor:pointer }
.form-help{ display:block; margin-top:6px; font-size:12px; color:#6b7280 }
.error-text{ color:#991b1b; font-weight:600; margin-top:6px; display:block }
.cpmk-row{ display:grid; grid-template-columns: 1fr 160px 120px 180px; gap:12px; align-items:center }
.cpmk-label{ overflow:hidden; text-overflow:ellipsis; white-space:nowrap }
.cpmk-max{ text-align:right }
.cpmk-input input.form-input{ width:100% }
.cpmk-max-hint, .cpmk-error { text-align:left }
.cpmk-header { font-size:13px }
</style>
