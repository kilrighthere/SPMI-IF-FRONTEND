<template>
  <div class="bobot-cpmk-container">
    <!-- Page Header -->
    <div class="page-title">
      <h2>Manajemen Bobot CPMK</h2>
      <p class="subtitle">
        Kelola dan atur bobot penilaian untuk setiap Capaian Pembelajaran Mata Kuliah
      </p>
    </div>

    <!-- Filters Section -->
    <div class="filters-container">
      <div class="filter-item">
        <label class="filter-label">
          <i class="ri-calendar-line"></i>
          Periode Akademik
        </label>
        <select v-model="selectedPeriode" @change="onPeriodeChange" class="filter-select">
          <option value="">Semua Periode</option>
          <option v-for="p in periodeList" :key="p.id_periode" :value="p.id_periode">
            {{ p.id_periode }}
          </option>
        </select>
      </div>
      <div class="filter-actions">
        <button
          v-if="isAdmin || isDosen"
          class="btn-add"
          @click="openAddModal"
          :disabled="!selectedPeriode"
        >
          <i class="ri-add-circle-line"></i>
          Tambah Bobot CPMK
        </button>
      </div>
    </div>
    <!-- Add / Edit Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <div class="modal-title">
            <i class="ri-percent-line"></i>
            <h3>{{ editing ? 'Edit' : 'Tambah' }} Bobot CPMK</h3>
          </div>
          <button class="modal-close" @click="closeModal">
            <i class="ri-close-line"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">
              <i class="ri-calendar-line"></i>
              Periode Akademik
            </label>
            <input type="text" class="form-input" :value="selectedPeriode" disabled />
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="ri-book-line"></i>
              Mata Kuliah
            </label>
            <select v-model="formData.kode_mk" class="form-input">
              <option value="">Pilih Mata Kuliah</option>
              <option v-for="m in mkOptions" :key="m.kode_mk" :value="m.kode_mk">
                {{ m.kode_mk }} - {{ m.nama_mk }}
              </option>
            </select>
          </div>
          <div class="form-group" v-if="mkPeriodeOptionsFiltered.length > 0">
            <label class="form-label">
              <i class="ri-list-check"></i>
              Varian MK (Periode)
            </label>
            <select v-model="formData.id_mk_periode" class="form-input">
              <option value="">Pilih Varian</option>
              <option
                v-for="mp in mkPeriodeOptionsFiltered"
                :key="mp.id_mk_periode"
                :value="mp.id_mk_periode"
              >
                {{ mp.kode_mk }} - Kurikulum {{ mp.id_kurikulum }} ({{ mp.sks }} SKS)
              </option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">
              <i class="ri-file-list-3-line"></i>
              Bobot CPMK (set bobot untuk setiap CPMK)
            </label>
            <div v-if="availableCpmks.length === 0" class="alert alert-error">
              <i class="ri-error-warning-line"></i>
              <span>
                Tidak ada CPMK terkait untuk MK/Periode ini. Pastikan CPMK telah dihubungkan ke MK
                melalui korelasi CPMK-MK.
                <router-link :to="`/kurikulum/${route.params.id}/cpmk-mk`" class="alert-link">
                  Hubungkan CPMK ke MK
                </router-link>
              </span>
            </div>
            <div v-else class="cpmk-list">
              <div class="cpmk-table-header">
                <div class="cpmk-label-col">CPMK</div>
                <div class="cpmk-bobot-col">Bobot (%)</div>
              </div>
              <div v-for="c in availableCpmks" :key="c.id_cpmk" class="cpmk-item">
                <div class="cpmk-label-col">
                  <span class="cpmk-code">{{ c.id_cpmk }}</span>
                  <span class="cpmk-desc">{{ c.deskripsi || c.deskripsi_cpmk }}</span>
                </div>
                <div class="cpmk-bobot-col">
                  <input
                    list="bobot-suggestions"
                    type="number"
                    class="form-input bobot-input"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0.00"
                    :value="
                      (formData.bobots && formData.bobots[c.id_cpmk]) ??
                      getExistingBobotFor(c.id_cpmk) ??
                      ''
                    "
                    @input="
                      (e) =>
                        (formData.bobots = {
                          ...formData.bobots,
                          [c.id_cpmk]: Number(e.target.value),
                        })
                    "
                  />
                </div>
              </div>
            </div>
            <div class="bobot-summary">
              <div class="summary-row">
                <span class="summary-label">Total Bobot Saat Ini:</span>
                <span class="summary-value">{{ currentSumPercent.toFixed(2) }}%</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">CPMK Terkait:</span>
                <span class="summary-value">{{ availableCpmksCount }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Bobot Terisi:</span>
                <span class="summary-value">{{ currentBobotsForSelected.length }}</span>
              </div>
              <div class="summary-row">
                <span class="summary-label">Sisa Bobot:</span>
                <span class="summary-value">{{ (100 - currentSumPercent).toFixed(2) }}%</span>
              </div>
              <div class="validation-result" :class="{ valid: isSumValid, invalid: !isSumValid }">
                <i :class="isSumValid ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'"></i>
                <span>Total bobot di form: {{ formSum.toFixed(2) }}%</span>
                <span class="validation-msg">{{ isSumValid ? '— Valid' : '— Harus 100%' }}</span>
              </div>
            </div>
            <datalist id="bobot-suggestions">
              <option v-for="s in bobotSuggestions" :key="s" :value="s" />
            </datalist>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">
            <i class="ri-close-line"></i>
            Batal
          </button>
          <button
            class="btn-save"
            @click="submitForm"
            :disabled="!isSumValid"
            :title="!isSumValid ? 'Total bobot harus 100% sebelum menyimpan' : 'Simpan Bobot CPMK'"
          >
            <i class="ri-save-line"></i>
            Simpan Bobot
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="ri-loader-4-line spin-icon"></i>
      <span>Memuat data bobot CPMK...</span>
    </div>

    <!-- Error State -->
    <div v-if="error" class="error-state">
      <i class="ri-error-warning-line"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Table Section -->
    <div v-if="!isLoading && !error" class="table-section">
      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>
                <div class="th-content">Kode MK</div>
              </th>
              <th>
                <div class="th-content">Nama Mata Kuliah</div>
              </th>
              <th>
                <div class="th-content">Bobot CPMK</div>
              </th>
              <th v-if="isAdmin || isDosen">
                <div class="th-content">Aksi</div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="mk in paginatedList" :key="mk.id_mk_periode" class="table-row">
              <td>
                <div class="td-content">
                  <span class="mk-code">{{ mk.kode_mk }}</span>
                </div>
              </td>
              <td>
                <div class="td-content">
                  <span class="mk-name">{{ mk.nama_mk }}</span>
                </div>
              </td>
              <td>
                <div class="td-content">
                  <div v-if="mk.bobots.length === 0" class="no-bobot">Belum diatur</div>
                  <div v-else class="bobot-list">
                    <div v-for="b in mk.bobots" :key="b.id_cpmk" class="bobot-item">
                      <span class="bobot-cpmk">{{ b.id_cpmk }}</span>
                      <span class="bobot-value">{{ formatBobotValue(b.bobot) }}</span>
                    </div>
                  </div>
                </div>
              </td>
              <td v-if="isAdmin || isDosen">
                <div class="td-content">
                  <div v-if="mk.bobots.length === 0" class="action-buttons">
                    <button class="btn-action btn-add-small" @click="openAddModal(mk.kode_mk)">
                      <i class="ri-add-line"></i>
                      Tambah
                    </button>
                  </div>
                  <div v-else class="action-list">
                    <div v-for="b in mk.bobots" :key="b.id_cpmk" class="action-item">
                      <div class="action-buttons">
                        <button
                          class="btn-action btn-edit"
                          @click="openEditModal(mk.id_mk_periode, b.id_cpmk, b.bobot)"
                        >
                          <i class="ri-edit-line"></i>
                        </button>
                        <button
                          class="btn-action btn-delete"
                          @click="handleDelete(mk.id_mk_periode, b.id_cpmk)"
                        >
                          <i class="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-if="mergedList.length === 0" class="empty-state">
        <i class="ri-inbox-line"></i>
        <h3>Belum Ada Data</h3>
        <p>Belum ada data bobot CPMK untuk periode ini.</p>
      </div>

      <!-- Pagination Controls -->
      <div v-if="mergedList.length > itemsPerPage" class="pagination-container">
        <div class="pagination-info">
          Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
          {{ Math.min(currentPage * itemsPerPage, mergedList.length) }} dari
          {{ mergedList.length }} mata kuliah
        </div>
        <div class="pagination-controls">
          <button class="pagination-btn" @click="previousPage" :disabled="currentPage === 1">
            <i class="ri-arrow-left-s-line"></i>
            Sebelumnya
          </button>
          <div class="pagination-pages">
            <button
              v-for="page in totalPages"
              :key="page"
              class="pagination-page"
              :class="{ active: currentPage === page }"
              @click="goToPage(page)"
            >
              {{ page }}
            </button>
          </div>
          <button class="pagination-btn" @click="nextPage" :disabled="currentPage === totalPages">
            Selanjutnya
            <i class="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>
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

// Pagination
const currentPage = ref(1)
const itemsPerPage = 10

const totalPages = computed(() => Math.ceil(mergedList.value.length / itemsPerPage))

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return mergedList.value.slice(start, end)
})

const mkPeriodeOptions = computed(() =>
  selectedPeriode.value ? nilaiMkStore.getMkPeriodeByPeriode(selectedPeriode.value) : [],
)
const mkOptions = computed(() => {
  const mps = mkPeriodeOptions.value || []
  const uniq = {}
  mps.forEach((mp) => {
    if (!uniq[mp.kode_mk]) uniq[mp.kode_mk] = mp
  })
  return Object.values(uniq).map((mp) => {
    const mkObj = mkStore.getMKByKode(mp.kode_mk)
    const nama_mk = mkObj?.nama_mk || mkObj?.nama || mp.nama_mk || ''
    return { kode_mk: mp.kode_mk, nama_mk }
  })
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
    linked = cpmkMkStore.items.filter(
      (item) => String(item.id_mk_periode || '') === String(selectedMkPeriode),
    )
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
  const b = store.bobotCpmkList.find(
    (bb) => String(bb.id_mk_periode) === String(idMp) && String(bb.id_cpmk) === String(id_cpmk),
  )
  if (!b) return null
  const val = b.bobot ?? b.bobot_persen
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
  return Array.from(set).sort((a, b) => Number(a) - Number(b))
})

// Helper: normalize stored or entered bobot into percent
function normalizeToPercent(val) {
  const n = Number(val)
  if (isNaN(n)) return 0
  return n > 0 && n <= 1.5 ? n * 100 : n
}

// bobots for currently selected mk-periode
const currentBobotsForSelected = computed(() => {
  if (!formData.value.id_mk_periode) return []
  return store.bobotCpmkList.filter(
    (b) => String(b.id_mk_periode) === String(formData.value.id_mk_periode),
  )
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
    const provided =
      formData.value.bobots && Object.prototype.hasOwnProperty.call(formData.value.bobots, id)
        ? formData.value.bobots[id]
        : null
    const raw =
      provided !== null && provided !== undefined ? provided : getExistingBobotFor(id) || 0
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
watch(
  () => formData.value.kode_mk,
  (newVal) => {
    if (!newVal) {
      formData.value.id_mk_periode = ''
      return
    }
    const filtered = mkPeriodeOptions.value.filter((mp) => mp.kode_mk === newVal)
    if (filtered.length === 1) {
      formData.value.id_mk_periode = filtered[0].id_mk_periode
    }
  },
)

// When mk-periode selection changes, reset selected CPMK and preselect first option if available
watch(
  () => formData.value.id_mk_periode,
  (newVal) => {
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
  },
)

// Log available CPMK changes for debug
watch(availableCpmks, (newVal) => {
  if (!newVal || newVal.length === 0) {
    console.warn('No CPMK found for this MK. Check CPMK-MK correlations and MK-periode mapping.', {
      kode: formData.value.kode_mk,
      id_mk_periode: formData.value.id_mk_periode,
    })
  } else {
    console.info(
      'Available CPMKs for this MK:',
      newVal.map((c) => c.id_cpmk),
    )
  }
})

const onPeriodeChange = async () => {
  await store.fetchAllBobotCpmk(selectedPeriode.value)
  currentPage.value = 1
}

// Pagination functions
function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function previousPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

// Reset pagination when filters change
watch([selectedPeriode], () => {
  currentPage.value = 1
})

// Helpers to open modal for create/edit
function openAddModal(prefillMK = '') {
  editing.value = false
  const firstMK =
    prefillMK || (mkOptions.value && mkOptions.value.length > 0 ? mkOptions.value[0].kode_mk : '')
  // Initialize bobots map with existing values or 0
  const bobotsMap = {}
  const filtered = mkPeriodeOptions.value.filter((mp) => mp.kode_mk === firstMK)
  if (filtered.length === 1) {
    formData.value.id_mk_periode = filtered[0].id_mk_periode
    // prefill bobots with existing values
    const existing = store.bobotCpmkList.filter(
      (b) => String(b.id_mk_periode) === String(filtered[0].id_mk_periode),
    )
    existing.forEach((b) => {
      const val = b.bobot ?? b.bobot_persen
      let n = Number(val)
      if (!isNaN(n) && n > 0 && n <= 1.5) n = n * 100
      bobotsMap[b.id_cpmk] = Number(n)
    })
  }
  formData.value = {
    id_periode: selectedPeriode.value,
    id_mk_periode: formData.value.id_mk_periode || '',
    kode_mk: firstMK,
    bobots: bobotsMap,
  }
  // If there's only one mkPeriode for this MK and selectedPeriode, pick it
  showModal.value = true
}

function openEditModal(mkPeriodeId, id_cpmk, bobotVal) {
  editing.value = true
  const mp = store.mkPeriodeList.find((m) => String(m.id_mk_periode) === String(mkPeriodeId)) || {}
  // Prefill map of bobots for all available cpmk for the mkPeriode
  const bobotsMap = {}
  const existing = store.bobotCpmkList.filter(
    (b) => String(b.id_mk_periode) === String(mkPeriodeId),
  )
  existing.forEach((b) => {
    let n = Number(b.bobot ?? b.bobot_persen)
    if (!isNaN(n) && n > 0 && n <= 1.5) n = n * 100
    bobotsMap[b.id_cpmk] = Number(n)
  })
  formData.value = {
    id_periode: mp.id_periode || selectedPeriode.value,
    id_mk_periode: mkPeriodeId,
    kode_mk: mp.kode_mk || '',
    bobots: bobotsMap,
  }
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
    alert(
      'Tidak ada CPMK yang terhubung ke MK ini. Hubungkan CPMK ke MK di halaman korelasi CPMK-MK terlebih dahulu.',
    )
    return
  }
  const finalMap = {}
  for (const c of cpms) {
    const id = c.id_cpmk
    const raw =
      formData.value.bobots && Object.prototype.hasOwnProperty.call(formData.value.bobots, id)
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
    const existing = store.bobotCpmkList.find(
      (b) =>
        String(b.id_mk_periode) === String(formData.value.id_mk_periode) &&
        String(b.id_cpmk) === String(id),
    )
    if (existing) {
      const oldVal = normalizeToPercent(existing.bobot ?? existing.bobot_persen)
      if (Math.abs(oldVal - newVal) > epsilon) {
        if (newVal === 0) {
          tasks.push(store.removeBobotCpmk(formData.value.id_mk_periode, id))
        } else {
          tasks.push(
            store.editBobotCpmk(formData.value.id_mk_periode, id, { bobot_persen: newVal }),
          )
        }
      }
    } else {
      if (newVal > 0) {
        tasks.push(
          store.createBobotCpmk({
            id_mk_periode: formData.value.id_mk_periode,
            id_cpmk: id,
            bobot_persen: newVal,
          }),
        )
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
  const old = store.bobotCpmkList.find(
    (b) => String(b.id_mk_periode) === String(mkPeriodeId) && String(b.id_cpmk) === String(id_cpmk),
  )
  const oldVal = old ? normalizeToPercent(old.bobot ?? old.bobot_persen) : 0
  const newSum = currentSumPercent.value - (oldVal || 0)
  const availableCount = availableCpmksCount.value
  const existingCountAfter = (currentBobotsForSelected.value.length || 0) - 1
  const epsilon = 0.01
  if (existingCountAfter > 0 && Math.abs(newSum - 100) > epsilon) {
    if (
      !confirm(
        `Setelah penghapusan, total bobot akan menjadi ${newSum.toFixed(2)}% (tidak sama dengan 100%). Apakah Anda yakin ingin melanjutkan?`,
      )
    )
      return
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
/* Container */
.bobot-cpmk-container {
  width: 100%;
  max-width: 1600px;
  margin: 0 auto;
  font-family: 'Montserrat', sans-serif;
}

/* Page Title */
.page-title {
  margin-bottom: 24px;
}

.page-title h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
  font-family: 'Montserrat', sans-serif;
}

.subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

/* Filters */
.filters-container {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  padding: 20px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-item {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.filter-label i {
  font-size: 18px;
  color: var(--spmi-c-green2);
}

.filter-select {
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  background: white;
  transition: all 0.3s ease;
  cursor: pointer;
}

.filter-select:hover {
  border-color: var(--spmi-c-green2);
}

.filter-select:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.1);
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn-add {
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 12px;
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

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'Montserrat', sans-serif;
}

.loading-state {
  color: var(--color-text);
  font-size: 16px;
}

.error-state {
  color: #dc2626;
  font-size: 16px;
}

.loading-state i,
.error-state i {
  font-size: 32px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Table Section */
.table-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
}

.data-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  position: sticky;
  top: 0;
  z-index: 10;
}

.data-table th {
  padding: 0;
  text-align: left;
  font-weight: 600;
  color: var(--spmi-c-dgray);
  border: none;
}

.th-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.data-table tbody tr {
  border-bottom: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.data-table tbody tr:hover {
  background-color: #f9fafb;
}

.data-table td {
  padding: 0;
  border: none;
}

.td-content {
  padding: 16px 20px;
  font-size: 14px;
  color: var(--color-text);
}

.mk-code {
  display: inline-block;
  padding: 6px 12px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #1e40af;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
}

.mk-name {
  font-weight: 500;
  color: var(--color-text);
}

.no-bobot {
  color: #9ca3af;
  font-style: italic;
  font-size: 13px;
}

.bobot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bobot-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.bobot-cpmk {
  font-weight: 600;
  color: var(--spmi-c-dgray);
  font-size: 13px;
}

.bobot-value {
  margin-left: auto;
  padding: 4px 10px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--spmi-c-dgray);
  border-radius: 6px;
  font-weight: 600;
  font-size: 13px;
}

/* Actions */
.action-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px;
  background: #f9fafb;
  border-radius: 8px;
}

.action-label {
  font-size: 13px;
  color: var(--color-text);
  font-weight: 500;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.btn-action {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  background: white;
}

.btn-add-small {
  border: 1.5px solid var(--color-text);
  color: var(--color-text);
}

.btn-add-small:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.btn-edit {
  border: 1.5px solid var(--color-text);
  color: var(--color-text);
  padding: 6px 10px;
}

.btn-edit:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  transform: scale(1.05);
}

.btn-delete {
  border: 1.5px solid var(--color-text);
  color: var(--color-text);
  padding: 6px 10px;
}

.btn-delete:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  transform: scale(1.05);
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  color: #9ca3af;
  font-family: 'Montserrat', sans-serif;
}

.empty-state i {
  font-size: 64px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.empty-state p {
  font-size: 14px;
  margin: 0;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
}

.modal-header {
  padding: 20px 28px;
  border-bottom: 2px solid var(--color-border2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-title i {
  font-size: 28px;
  color: var(--spmi-c-green2);
}

.modal-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.modal-close {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  border: none;
  background: white;
  color: var(--color-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  font-size: 20px;
}

.modal-close:hover {
  background: #fee2e2;
  color: #dc2626;
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
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.form-label i {
  font-size: 18px;
  color: var(--spmi-c-green2);
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  background: white;
  transition: all 0.3s ease;
}

.form-input:hover:not(:disabled) {
  border-color: #d1d5db;
}

.form-input:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.1);
}

.form-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

/* CPMK List in Modal */
.cpmk-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 12px;
  border-radius: 10px;
  overflow: hidden;
  border: 1.5px solid #e5e7eb;
}

.cpmk-table-header {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  font-weight: 700;
  font-size: 13px;
  color: var(--spmi-c-dgray);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.cpmk-item {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 16px;
  padding: 14px 16px;
  background: white;
  border-top: 1px solid #f3f4f6;
  transition: background-color 0.2s ease;
}

.cpmk-item:hover {
  background: #f9fafb;
}

.cpmk-label-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cpmk-code {
  font-weight: 700;
  color: var(--spmi-c-dgray);
  font-size: 14px;
}

.cpmk-desc {
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.cpmk-bobot-col {
  display: flex;
  align-items: center;
}

.bobot-input {
  width: 100%;
  text-align: right;
  font-weight: 600;
}

/* Bobot Summary */
.bobot-summary {
  margin-top: 16px;
  padding: 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 10px;
  border: 1.5px solid #bbf7d0;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
  font-size: 13px;
}

.summary-label {
  color: #15803d;
  font-weight: 500;
}

.summary-value {
  font-weight: 700;
  color: var(--spmi-c-dgray);
}

.validation-result {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  margin-top: 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
}

.validation-result.valid {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.validation-result.invalid {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.validation-result i {
  font-size: 20px;
}

.validation-msg {
  margin-left: auto;
}

/* Alert */
.alert {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: 10px;
  font-size: 13px;
  margin-top: 12px;
}

.alert-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}

.alert i {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 2px;
}

.alert-link {
  color: #991b1b;
  text-decoration: underline;
  font-weight: 600;
  margin-left: 4px;
}

.alert-link:hover {
  color: #7f1d1d;
}

/* Modal Footer */
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

/* Pagination */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: white;
  border-top: 2px solid #f3f4f6;
  gap: 20px;
  flex-wrap: wrap;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
  font-family: 'Montserrat', sans-serif;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination-btn {
  padding: 10px 18px;
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
  gap: 6px;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f9fafb;
}

.pagination-pages {
  display: flex;
  gap: 6px;
}

.pagination-page {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.pagination-page:hover {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.pagination-page.active {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  color: var(--spmi-c-dgray);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

/* Responsive */
@media (max-width: 1024px) {
  .filters-container {
    flex-direction: column;
  }

  .filter-item {
    min-width: 100%;
  }

  .cpmk-item,
  .cpmk-table-header {
    grid-template-columns: 1fr;
    gap: 8px;
  }
}

@media (max-width: 768px) {
  .page-title h2 {
    font-size: 24px;
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

  .pagination-container {
    flex-direction: column;
    gap: 12px;
  }

  .pagination-controls {
    width: 100%;
    justify-content: center;
  }
}
</style>
