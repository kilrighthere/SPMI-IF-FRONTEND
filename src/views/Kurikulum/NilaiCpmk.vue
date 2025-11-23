<template>
  <div class="nilai-cpmk-container">
    <!-- Page Header -->
    <div class="page-header">
      <div class="page-title">
        <h2>Nilai CPMK</h2>
      </div>
    </div>

    <!-- Filters Section -->
    <div class="filters-container">
      <div class="filter-group">
        <div class="filter-item">
          <label for="periode" class="filter-label">
            <i class="ri-calendar-line"></i>
            Periode
          </label>
          <select id="periode" v-model="selectedPeriode" class="filter-select">
            <option value="">Pilih periode</option>
            <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">
              {{ p.id_periode }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label for="mk-periode" class="filter-label">
            <i class="ri-book-line"></i>
            Mata Kuliah
          </label>
          <select
            id="mk-periode"
            v-model="selectedMataKuliah"
            :disabled="!selectedPeriode"
            class="filter-select"
          >
            <option value="">Pilih MK (Periode)</option>
            <option v-for="mk in mkOptions" :key="mk.kode_mk" :value="mk.kode_mk">
              {{ mk.kode_mk }} - {{ mk.nama_mk }}
            </option>
          </select>
        </div>

        <!-- Show MK-periode variant selector if more than one variant exists for this MK-->
        <div v-if="mkPeriodeOptionsFiltered.length > 1" class="filter-item">
          <label for="mk-periode-variant" class="filter-label">
            <i class="ri-stack-line"></i>
            Varian MK
          </label>
          <select
            id="mk-periode-variant"
            v-model="selectedMkPeriode"
            :disabled="!selectedPeriode"
            class="filter-select"
          >
            <option value="">Pilih Varian MK (periode)</option>
            <option
              v-for="mp in mkPeriodeOptionsFiltered"
              :key="mp.id_mk_periode"
              :value="mp.id_mk_periode"
            >
              {{ mp.kode_mk }} - {{ nilaiMkStore.getMataKuliahNama(mp.kode_mk) }} ({{ mp.sks }} sks)
              - Kurikulum {{ mp.id_kurikulum }}
            </option>
          </select>
        </div>
      </div>

      <div v-if="can('nilaiCpmk', 'create')" class="filter-actions">
        <button class="btn-add" @click="openAddModal" :disabled="!selectedPeriode">
          <i class="ri-add-line"></i>
          Tambah Nilai CPMK
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error State -->
    <div v-if="error && !isLoading" class="error-state">
      <i class="ri-error-warning-line"></i>
      <p>{{ error }}</p>
    </div>

    <!-- Empty States -->
    <div v-if="!selectedPeriode && !isLoading" class="empty-state">
      <i class="ri-calendar-line"></i>
      <h3>Pilih Periode</h3>
      <p>Pilih periode terlebih dahulu untuk melihat data nilai CPMK.</p>
    </div>

    <div v-else-if="selectedPeriode && !selectedMataKuliah && !isLoading" class="empty-state">
      <i class="ri-book-line"></i>
      <h3>Pilih Mata Kuliah</h3>
      <p>Pilih mata kuliah (periode) untuk melihat nilai CPMK per mahasiswa.</p>
    </div>

    <!-- Table Container -->
    <div v-else-if="selectedPeriode && selectedMataKuliah && !isLoading" class="table-container">
      <div v-if="studentNims.length === 0" class="empty-state">
        <i class="ri-file-list-line"></i>
        <h3>Tidak Ada Data</h3>
        <p>Belum ada nilai CPMK untuk mata kuliah dan periode yang dipilih.</p>
      </div>

      <div v-else class="table-wrapper">
        <table class="modern-table">
          <thead>
            <tr>
              <th class="sticky-col">
                <div class="th-content">NIM</div>
              </th>
              <th class="sticky-col-2">
                <div class="th-content">Nama Mahasiswa</div>
              </th>
              <th v-for="c in cpmkIds" :key="c" class="cpmk-col">
                <div class="th-content cpmk-header">
                  <span class="cpmk-code">{{ c }}</span>
                  <!-- <span v-if="cpmkDesc[c]" class="cpmk-desc">{{ cpmkDesc[c] }}</span> -->
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="nim in studentNims" :key="nim" class="table-row">
              <td class="sticky-col">
                <div class="td-content">
                  <span class="nim-badge">{{ nim }}</span>
                </div>
              </td>
              <td class="sticky-col-2">
                <div class="td-content">
                  <span class="student-name">{{ mahasiswaMap[nim] || '-' }}</span>
                </div>
              </td>
              <td v-for="c in cpmkIds" :key="c" class="cpmk-value">
                <div class="td-content">
                  <span v-if="grid[nim] && grid[nim][c]" class="nilai-badge">
                    {{ grid[nim][c] }}
                  </span>
                  <span v-else class="nilai-empty">-</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add Nilai CPMK Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <i class="ri-file-add-line"></i>
            <h3>Tambah Nilai CPMK</h3>
          </div>
          <button class="modal-close" @click="closeModal">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>Periode</label>
            <input type="text" :value="selectedPeriode" disabled class="form-input" />
          </div>
          <div class="form-group">
            <label>Mata Kuliah</label>
            <select
              v-model="formData.kode_mk"
              class="form-input"
              @change="
                () => {
                  if (!formData.id_mk_periode && formData.kode_mk) {
                    const r = nilaiMkStore.resolveIdMkPeriode(
                      formData.kode_mk,
                      formData.id_periode || selectedPeriode,
                    )
                    if (r) formData.id_mk_periode = r
                  }
                }
              "
            >
              <option value="">Pilih MK</option>
              <option v-for="mk in mkOptions" :key="mk.kode_mk" :value="mk.kode_mk">
                {{ mk.kode_mk }} - {{ mk.nama_mk }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>NIM</label>
            <div class="autocomplete-wrapper">
              <input
                type="text"
                class="form-input"
                v-model="formData.nim"
                @input="onMahasiswaInput"
                @focus="onMahasiswaInput"
              />
              <div v-if="showMahasiswaDropdown" class="autocomplete-dropdown">
                <div
                  v-for="m in mahasiswaSuggestions"
                  :key="m.nim"
                  class="autocomplete-item"
                  @mousedown.prevent="selectMahasiswaSuggestion(m)"
                >
                  <div class="nim">{{ m.nim }}</div>
                  <div class="nama">{{ m.nama }}</div>
                </div>
              </div>
            </div>
            <div v-if="formData.nim && mahasiswaMap[formData.nim]" class="form-help">
              Nama: {{ mahasiswaMap[formData.nim] }}
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="ri-file-list-3-line"></i>
              Nilai CPMK (masukkan nilai untuk setiap CPMK)
            </label>
            <div v-if="availableCpmks.length === 0" class="alert alert-error">
              <i class="ri-error-warning-line"></i>
              <span
                >Tidak ada CPMK terkait untuk MK/Periode ini. Pastikan CPMK telah dihubungkan ke MK
                melalui korelasi CPMK-MK.</span
              >
            </div>
            <div v-else class="cpmk-list">
              <div class="cpmk-table-header">
                <div class="cpmk-label-col">CPMK</div>
                <div class="cpmk-bobot-col">Bobot Maks</div>
                <div class="cpmk-nilai-col">Nilai</div>
                <div class="cpmk-status-col">Status</div>
              </div>
              <div v-if="!formData.nim" class="alert alert-warning">
                <i class="ri-information-line"></i>
                <span>Isi NIM terlebih dahulu untuk mengaktifkan input nilai CPMK.</span>
              </div>
              <div v-for="c in availableCpmks" :key="c.id_cpmk" class="cpmk-item">
                <div class="cpmk-label-col">
                  <span class="cpmk-code">{{ c.id_cpmk }}</span>
                  <span class="cpmk-desc">{{ c.deskripsi || c.deskripsi_cpmk }}</span>
                </div>
                <div class="cpmk-bobot-col">
                  <span class="bobot-badge">{{
                    currentBobotFor(c.id_cpmk) != null
                      ? currentBobotFor(c.id_cpmk).toFixed(2) + '%'
                      : 'N/A'
                  }}</span>
                </div>
                <div class="cpmk-nilai-col">
                  <input
                    type="number"
                    class="form-input nilai-input"
                    min="0"
                    max="100"
                    step="0.01"
                    :disabled="!formData.nim || currentBobotFor(c.id_cpmk) === null"
                    :value="
                      formData.nilaiMap[c.id_cpmk] ??
                      getExistingNilaiFor(c.id_cpmk, formData.nim) ??
                      ''
                    "
                    @input="
                      (e) =>
                        (formData.nilaiMap = {
                          ...formData.nilaiMap,
                          [c.id_cpmk]: e.target.value ? Number(e.target.value) : '',
                        })
                    "
                  />
                </div>
                <div class="cpmk-status-col">
                  <span
                    v-if="
                      formData.nilaiMap[c.id_cpmk] !== undefined &&
                      String(formData.nilaiMap[c.id_cpmk]) !== '' &&
                      Number(formData.nilaiMap[c.id_cpmk]) > Number(currentBobotFor(c.id_cpmk))
                    "
                    class="status-badge error"
                  >
                    <i class="ri-error-warning-line"></i>
                    Melebihi bobot
                  </span>
                  <span
                    v-else-if="
                      formData.nilaiMap[c.id_cpmk] !== undefined &&
                      String(formData.nilaiMap[c.id_cpmk]) !== ''
                    "
                    class="status-badge success"
                  >
                    <i class="ri-checkbox-circle-line"></i>
                    Valid
                  </span>
                  <span v-else class="status-badge pending">
                    <i class="ri-time-line"></i>
                    Belum diisi
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="form-note">
            <i class="ri-information-line"></i>
            <span
              >Masukkan nilai per CPMK di sebelah kanan. Setiap nilai tidak boleh melebihi bobot
              maksimal yang ditentukan.</span
            >
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">
            <i class="ri-close-line"></i>
            Batal
          </button>
          <button
            class="btn-save"
            @click="submitAddNilaiCpmk"
            :disabled="!isNilaiFormValid"
            :title="
              !isNilaiFormValid
                ? 'Lengkapi NIM dan minimal satu nilai yang valid'
                : 'Simpan Nilai CPMK'
            "
          >
            <i class="ri-save-line"></i>
            Simpan Nilai CPMK
          </button>
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
const { canManageKurikulumMk, can } = usePermissions()

const mahasiswaSuggestions = ref([])
const showMahasiswaDropdown = ref(false)
let mahasiswaSearchTimer = null

const periodeList = computed(() => nilaiMkStore.periodeList)
const mkPeriodeOptions = computed(() =>
  selectedPeriode.value ? nilaiMkStore.getMkPeriodeByPeriode(selectedPeriode.value) : [],
)
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
  return Object.values(uniq).map((mp) => ({
    kode_mk: mp.kode_mk,
    nama_mk: nilaiMkStore.getMataKuliahNama(mp.kode_mk) || mp.nama_mk || '',
  }))
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
watch(
  () => formData.value.kode_mk,
  (newVal) => {
    formData.value.nilaiMap = {}
  },
)

watch(
  () => formData.value.id_mk_periode,
  (newVal) => {
    if (!newVal) return
    // If nim present, prefill nilai map for that nim
    if (formData.value.nim) prefillNilaiMapForNim(formData.value.nim)
  },
)

watch(
  () => formData.value.nim,
  (newVal) => {
    if (!newVal) return
    // Prefill nilai for selected nim
    prefillNilaiMapForNim(newVal)
  },
)

// Modal methods
async function openAddModal() {
  // ensure prerequisites
  if (!nilaiMkStore.mkPeriodeList || nilaiMkStore.mkPeriodeList.length === 0)
    await nilaiMkStore.fetchMkPeriodeList()
  if (!mahasiswaStore.mahasiswaList || mahasiswaStore.mahasiswaList.length === 0)
    await mahasiswaStore.fetchMahasiswa()
  formData.value = {
    id_periode: selectedPeriode.value,
    kode_mk: selectedMataKuliah.value,
    id_mk_periode: '',
    id_cpmk: '',
    nim: '',
    nilai: '',
  }
  formData.value.nilaiMap = {}
  // auto-select mk-periode id if kode + periode available
  if (formData.value.kode_mk && formData.value.id_periode) {
    const resolved = nilaiMkStore.resolveIdMkPeriode(
      formData.value.kode_mk,
      formData.value.id_periode,
    )
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
  const e = nilaiCpmkList.value.find(
    (n) =>
      String(n.id_mk_periode) === String(idMp) &&
      String(n.id_cpmk) === String(id_cpmk) &&
      String(n.nim) === String(nim),
  )
  if (!e) return null
  return Number(e.nilai)
}

function prefillNilaiMapForNim(nim) {
  formData.value.nilaiMap = {}
  if (!nim) return
  const idMp =
    formData.value.id_mk_periode ||
    selectedMkPeriode.value ||
    (formData.value.kode_mk && formData.value.id_periode
      ? nilaiMkStore.resolveIdMkPeriode(formData.value.kode_mk, formData.value.id_periode)
      : null)
  if (!idMp) return
  const entries = nilaiCpmkList.value.filter(
    (n) => String(n.nim) === String(nim) && String(n.id_mk_periode) === String(idMp),
  )
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
    const resolved = nilaiMkStore.resolveIdMkPeriode(
      formData.value.kode_mk,
      formData.value.id_periode,
    )
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
      alert(
        `Nilai untuk ${id_cpmk} melebihi bobot maksimal (${Number(maxBobot).toFixed(2)}%). Harap sesuaikan.`,
      )
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
    await store.fetchNilaiByFilter({
      id_mk_periode: formData.value.id_mk_periode,
      id_periode: formData.value.id_periode,
    })
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
    const idMp =
      selectedMkPeriode.value ||
      formData.value.id_mk_periode ||
      nilaiMkStore.resolveIdMkPeriode(selectedMataKuliah.value, selectedPeriode.value)
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
/* Container */
.nilai-cpmk-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Page Header */
.page-header {
  padding-bottom: 20px;
  border-bottom: 2px solid var(--color-border2);
}

.page-title h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin-bottom: 8px;
}

.breadcrumb {
  font-size: 14px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.breadcrumb a {
  color: var(--spmi-c-green2);
  text-decoration: none;
  transition: color 0.2s;
}

.breadcrumb a:hover {
  color: var(--color-buttonsec);
  text-decoration: underline;
}

.breadcrumb .separator {
  margin: 0 8px;
  color: #d1d5db;
}

.breadcrumb .current {
  color: var(--color-text);
  font-weight: 600;
}

/* Filters */
.filters-container {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
  padding: 20px;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1.5px solid #e5e7eb;
}

.filter-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  flex: 1;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 200px;
}

.filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 6px;
}

.filter-label i {
  font-size: 16px;
  color: var(--spmi-c-green2);
}

.filter-select {
  padding: 10px 14px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background-color: white;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 4px rgba(166, 214, 0, 0.1);
}

.filter-select:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
  opacity: 0.6;
}

.filter-actions {
  display: flex;
  gap: 12px;
}

.btn-add {
  padding: 10px 20px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-add:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.4);
}

.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-add i {
  font-size: 18px;
}

/* Loading State */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: var(--spmi-c-green2);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-state p {
  font-size: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: #fef2f2;
  border-radius: 12px;
  border-left: 4px solid var(--spmi-c-red);
  color: var(--spmi-c-red);
  font-family: 'Montserrat', sans-serif;
}

.error-state i {
  font-size: 24px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  gap: 16px;
  text-align: center;
}

.empty-state i {
  font-size: 64px;
  color: #d1d5db;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.empty-state p {
  font-size: 15px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  max-width: 400px;
}

/* Table Container */
.table-container {
  margin-top: 8px;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
}

.modern-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Montserrat', sans-serif;
}

.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(166, 214, 0, 0.15);
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

.modern-table .sticky-col {
  position: sticky;
  left: 0;
  z-index: 11;
}

.modern-table .sticky-col-2 {
  position: sticky;
  left: 120px;
  z-index: 11;
}

.modern-table tbody .sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.modern-table tbody .sticky-col-2 {
  position: sticky;
  left: 120px;
  background: white;
  z-index: 5;
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.05);
}

.th-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.cpmk-header {
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.cpmk-code {
  font-size: 14px;
  font-weight: 700;
}

.cpmk-desc {
  font-size: 11px;
  font-weight: 400;
  opacity: 0.9;
  text-transform: none;
}

.table-row {
  transition: all 0.25s ease;
  background: white;
}

.table-row:hover {
  background: #faffec;
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(166, 214, 0, 0.08);
}

.modern-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
}

.modern-table tbody tr:last-child {
  border-bottom: none;
}

.modern-table td {
  padding: 0;
  font-size: 14px;
  color: #4b5563;
}

.td-content {
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.nim-badge {
  padding: 4px 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.student-name {
  font-weight: 500;
  color: var(--color-text);
}

.cpmk-value {
  text-align: center;
}

.nilai-badge {
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text);
}

.nilai-empty {
  color: #d1d5db;
  font-size: 16px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 24px 28px;
  border-bottom: 2px solid var(--color-border2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title i {
  font-size: 24px;
  color: var(--spmi-c-green2);
}

.modal-title h3 {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: var(--color-text);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.modal-close:hover {
  background: var(--spmi-c-red);
  color: white;
  transform: rotate(90deg);
}

.modal-body {
  padding: 24px 28px;
  overflow-y: auto;
  flex: 1;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin-bottom: 8px;
}

.form-label i {
  font-size: 18px;
  color: var(--spmi-c-green2);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  background-color: white;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 4px rgba(166, 214, 0, 0.1);
}

.form-input:disabled {
  background-color: #f3f4f6;
  cursor: not-allowed;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-dropdown {
  position: absolute;
  left: 0;
  right: 0;
  background: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  z-index: 1000;
  max-height: 220px;
  overflow: auto;
  margin-top: 4px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.autocomplete-item {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.autocomplete-item:hover {
  background: #f9fafb;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item .nim {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.autocomplete-item .nama {
  font-size: 13px;
  color: #6b7280;
}

.form-help {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.alert {
  padding: 14px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  font-size: 13px;
  font-family: 'Montserrat', sans-serif;
}

.alert i {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-error {
  background: #fef2f2;
  border: 1.5px solid #fecaca;
  color: #991b1b;
}

.alert-warning {
  background: #fef3c7;
  border: 1.5px solid #fde68a;
  color: #92400e;
}

/* CPMK List */
.cpmk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.cpmk-table-header {
  display: grid;
  grid-template-columns: 2fr 140px 120px 140px;
  gap: 12px;
  padding: 12px 16px;
  background: linear-gradient(135deg, var(--spmi-c-dgray) 0%, #3d3c42 100%);
  border-radius: 10px;
  font-weight: 700;
  font-size: 12px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cpmk-item {
  display: grid;
  grid-template-columns: 2fr 140px 120px 140px;
  gap: 12px;
  padding: 16px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1.5px solid #e5e7eb;
  align-items: center;
  transition: all 0.3s ease;
}

.cpmk-item:hover {
  border-color: var(--spmi-c-green2);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.15);
}

.cpmk-label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cpmk-label-col .cpmk-code {
  font-weight: 700;
  font-size: 14px;
  color: var(--color-text);
}

.cpmk-label-col .cpmk-desc {
  font-size: 12px;
  color: #6b7280;
}

.cpmk-bobot-col {
  text-align: center;
}

.bobot-badge {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #6b21a8;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
}

.nilai-input {
  text-align: center;
  font-weight: 600;
}

.cpmk-status-col {
  display: flex;
  justify-content: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-badge.error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.status-badge.pending {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #4b5563;
}

.form-note {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 10px;
  border: 1.5px solid #bbf7d0;
  margin-top: 12px;
  font-size: 13px;
  color: #15803d;
  font-family: 'Montserrat', sans-serif;
}

.form-note i {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.modal-footer {
  padding: 20px 28px;
  border-top: 2px solid var(--color-border2);
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f9fafb;
}

.btn-cancel {
  padding: 12px 24px;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-cancel:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.btn-save {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-save:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.4);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-container {
    flex-direction: column;
  }

  .cpmk-item,
  .cpmk-table-header {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .cpmk-bobot-col,
  .cpmk-status-col {
    text-align: left;
    justify-content: flex-start;
  }
}

@media (max-width: 768px) {
  .page-title h2 {
    font-size: 24px;
  }

  .filter-item {
    min-width: 100%;
  }

  .modal-content {
    width: 95%;
    max-height: 95vh;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px 20px;
  }
}
</style>
