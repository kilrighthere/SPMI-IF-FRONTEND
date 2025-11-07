<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNilaiMkStore } from '@/stores/nilaiMk'
import { useKurikulumStore } from '@/stores/kurikulum'
import { useMKStore } from '@/stores/mataKuliah'
import { usePermissions } from '@/composables/usePermissions'
import ExcelJS from 'exceljs'

// Ref untuk file input
const excelUpload = ref(null)

const router = useRouter()
const route = useRoute()

// Initialize stores
const nilaiMkStore = useNilaiMkStore()
const kurikulumStore = useKurikulumStore()
const mkStore = useMKStore()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, userId, canManageKurikulumMk } = usePermissions()
const currentUserNim = userId

// Data
const isLoading = computed(() => nilaiMkStore.isLoading)
const error = computed(() => nilaiMkStore.error)
const selectedKurikulum = ref(route.params.id || '')

// Modal dan form
const showModal = ref(false)
const formData = ref({
  id_periode: '',
  kode_mk: '',
  nim: '',
  nilai_akhir: '',
})

// Info mahasiswa untuk validasi NIM
const mahasiswaInfo = ref({
  nim: '',
  nama: '',
})

// Combobox mata kuliah
const mkSearchQuery = ref('')
const showMkDropdown = ref(false)
const selectedMK = ref(null)
const filteredMK = ref([])

// Filter dan pencarian
const searchQuery = ref('')
const selectedMataKuliah = ref('')

// Computed
const periodeList = computed(() => nilaiMkStore.periodeList)
const selectedPeriode = computed({
  get: () => nilaiMkStore.selectedPeriode,
  set: async (value) => {
    selectedMataKuliah.value = '' // Reset mata kuliah filter
    nilaiMkStore.selectedPeriode = value

    if (value) {
      await loadNilaiData() // Load data ketika periode dipilih
    } else {
      nilaiMkStore.nilaiList = [] // Clear data jika tidak ada periode
    }
  },
})

// Data nilai yang difilter berdasarkan periode yang dipilih
const filteredNilaiList = computed(() => {
  console.log('=== filteredNilaiList computed ===')
  console.log('nilaiMkStore.filteredNilaiByPeriode:', nilaiMkStore.filteredNilaiByPeriode)
  console.log('isMahasiswa:', isMahasiswa.value)
  console.log('currentUserNim:', currentUserNim.value)
  console.log('selectedKurikulum:', selectedKurikulum.value)

  let filtered = nilaiMkStore.filteredNilaiByPeriode

  // Log sample data untuk debugging
  if (filtered.length > 0) {
    console.log('Sample nilai data structure:', filtered[0])
  }

  // Filter berdasarkan kurikulum jika ada - SKIP untuk mahasiswa karena tidak relevan
  // Mahasiswa tidak perlu filter berdasarkan kurikulum, mereka hanya perlu filter berdasarkan NIM
  if (selectedKurikulum.value && !isMahasiswa.value) {
    filtered = filtered.filter((nilai) => nilai.id_kurikulum === selectedKurikulum.value)
    console.log('After kurikulum filter:', filtered)
  } else {
    console.log('Skipping kurikulum filter (mahasiswa or no kurikulum selected)')
  }

  // Filter berdasarkan mata kuliah yang dipilih
  if (selectedMataKuliah.value) {
    filtered = filtered.filter((nilai) => nilai.kode_mk === selectedMataKuliah.value)
    console.log('After mata kuliah filter:', filtered)
  }

  // Filter berdasarkan pencarian
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(
      (nilai) =>
        nilai.kode_mk.toLowerCase().includes(query) ||
        nilai.nim.toLowerCase().includes(query) ||
        nilaiMkStore.getMataKuliahNama(nilai.kode_mk).toLowerCase().includes(query) ||
        nilaiMkStore.getMahasiswaNama(nilai.nim).toLowerCase().includes(query),
    )
    console.log('After search filter:', filtered)
  }

  // Filter untuk mahasiswa (hanya tampilkan nilai mereka sendiri)
  if (isMahasiswa.value && currentUserNim.value) {
    console.log('Filtering for mahasiswa, NIM:', currentUserNim.value)
    filtered = filtered.filter((nilai) => {
      // Convert both to string for comparison to handle type mismatch
      const nilaiNimStr = String(nilai.nim).trim()
      const currentNimStr = String(currentUserNim.value).trim()
      console.log(
        'Comparing nilai.nim:',
        nilaiNimStr,
        'with currentUserNim:',
        currentNimStr,
        'match:',
        nilaiNimStr === currentNimStr,
      )
      return nilaiNimStr === currentNimStr
    })
    console.log('After mahasiswa filter:', filtered)
  }

  console.log('Final filtered result:', filtered)
  return filtered
})

// Available mata kuliah untuk dropdown
const availableMataKuliah = computed(() => mkStore.mataKuliahList)

// Mata kuliah yang tersedia dalam periode yang dipilih
const availableMataKuliahInPeriode = computed(() => {
  if (!selectedPeriode.value) return []

  // Ambil kode MK unik dari nilai yang ada di periode ini
  const uniqueKodeMK = [
    ...new Set(nilaiMkStore.filteredNilaiByPeriode.map((nilai) => nilai.kode_mk)),
  ]

  // Return mata kuliah yang ada dalam periode ini
  return availableMataKuliah.value.filter((mk) => uniqueKodeMK.includes(mk.kode_mk))
})

// Get current kurikulum name
function getCurrentKurikulumName() {
  if (!selectedKurikulum.value) return 'Semua Kurikulum'
  const kurikulum = kurikulumStore.kurikulumList.find(
    (k) => k.id_kurikulum === selectedKurikulum.value,
  )
  return kurikulum
    ? `${kurikulum.nama_kurikulum} (${kurikulum.id_kurikulum})`
    : `Kurikulum ${selectedKurikulum.value}`
}

// Modal functions
async function openAddModal() {
  // Pastikan data mahasiswa sudah tersedia
  if (Object.keys(nilaiMkStore.mahasiswaMap).length === 0) {
    await nilaiMkStore.fetchMahasiswaData()
  }

  formData.value = {
    id_periode: selectedPeriode.value,
    kode_mk: '',
    nim: '',
    nilai_akhir: '',
  }

  // Reset mahasiswa info
  mahasiswaInfo.value = {
    nim: '',
    nama: '',
  }

  // Reset combobox mata kuliah
  selectedMK.value = null
  mkSearchQuery.value = ''
  showMkDropdown.value = false
  filteredMK.value = availableMataKuliah.value

  showModal.value = true
}

function closeModal() {
  showModal.value = false
  formData.value = {
    id_periode: '',
    kode_mk: '',
    nim: '',
    nilai_akhir: '',
  }
  // Reset mahasiswa info
  mahasiswaInfo.value = {
    nim: '',
    nama: '',
  }
  // Reset combobox mata kuliah
  selectedMK.value = null
  mkSearchQuery.value = ''
  showMkDropdown.value = false
  filteredMK.value = []
}

// Check nama mahasiswa berdasarkan NIM
function checkMahasiswaNama() {
  const nim = formData.value.nim.trim()

  if (nim.length >= 10) {
    // Minimal 10 karakter untuk mulai check
    const nama = nilaiMkStore.getMahasiswaNama(nim)
    mahasiswaInfo.value = {
      nim: nim,
      nama: nama !== nim ? nama : '', // Jika sama dengan NIM, berarti tidak ditemukan
    }
  } else {
    mahasiswaInfo.value = {
      nim: '',
      nama: '',
    }
  }
}

// Mata kuliah combobox functions
function filterMataKuliah() {
  const query = mkSearchQuery.value.toLowerCase().trim()

  if (query === '') {
    filteredMK.value = availableMataKuliah.value
  } else {
    filteredMK.value = availableMataKuliah.value.filter(
      (mk) => mk.kode_mk.toLowerCase().includes(query) || mk.nama_mk.toLowerCase().includes(query),
    )
  }
}

function selectMataKuliah(mk) {
  selectedMK.value = mk
  formData.value.kode_mk = mk.kode_mk
  mkSearchQuery.value = `${mk.kode_mk} - ${mk.nama_mk}`
  showMkDropdown.value = false
}

function clearMataKuliah() {
  selectedMK.value = null
  formData.value.kode_mk = ''
  mkSearchQuery.value = ''
  filteredMK.value = availableMataKuliah.value
}

function hideMkDropdown() {
  // Delay untuk memungkinkan click pada option
  setTimeout(() => {
    showMkDropdown.value = false
  }, 150)
}

// Submit form
async function submitForm() {
  try {
    if (!formData.value.kode_mk || !formData.value.nim || !formData.value.nilai_akhir) {
      alert('Mohon lengkapi semua field yang diperlukan')
      return
    }

    // Validasi nilai range 0-100
    const nilai = parseFloat(formData.value.nilai_akhir)
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      alert('Nilai harus berupa angka antara 0-100')
      return
    }

    // Validasi mahasiswa ditemukan
    const namaMahasiswa = nilaiMkStore.getMahasiswaNama(formData.value.nim)
    if (namaMahasiswa === formData.value.nim) {
      alert('Mahasiswa dengan NIM tersebut tidak ditemukan. Pastikan NIM sudah benar.')
      return
    }

    // Format nilai dengan 2 desimal
    formData.value.nilai_akhir = nilai.toFixed(2)

    console.log('Submitting nilai:', formData.value)

    const result = await nilaiMkStore.createNilai(formData.value)

    console.log('Create nilai result:', result)

    if (result && (result.success === true || result.success === undefined)) {
      alert(
        `Nilai berhasil ditambahkan!\nNilai: ${formData.value.nilai_akhir}\nHuruf Mutu: ${nilaiMkStore.getHurufMutu(formData.value.nilai_akhir)}`,
      )
      closeModal()
    } else {
      alert('Gagal menambahkan nilai: ' + (result?.message || 'Unknown error'))
    }
  } catch (err) {
    console.error('Error submitting nilai:', err)
    alert('Terjadi kesalahan saat menyimpan nilai: ' + (err.message || err))
  }
}

// Get CSS class untuk huruf mutu
function getHurufMutuClass(huruf) {
  if (huruf === 'A' || huruf === 'A-') return 'huruf-a'
  if (huruf === 'B+' || huruf === 'B' || huruf === 'B-') return 'huruf-b'
  if (huruf === 'C+' || huruf === 'C' || huruf === 'C-') return 'huruf-c'
  if (huruf === 'D+' || huruf === 'D') return 'huruf-d'
  if (huruf === 'E') return 'huruf-e'
  return 'huruf-default'
}

// Load hanya periode di awal
async function loadPeriodeOnly() {
  await nilaiMkStore.fetchPeriodeList()
}

// Load nilai berdasarkan filter dan data yang diperlukan
async function loadNilaiData() {
  console.log('=== loadNilaiData called ===')
  console.log('selectedPeriode:', selectedPeriode.value)

  if (!selectedPeriode.value) {
    console.log('No periode selected, returning')
    return
  }

  const filters = { id_periode: selectedPeriode.value }
  if (selectedMataKuliah.value) {
    filters.kode_mk = selectedMataKuliah.value
  }

  console.log('Fetching with filters:', filters)

  // Load data yang diperlukan secara bersamaan hanya ketika dibutuhkan
  await Promise.all([
    nilaiMkStore.fetchNilaiByFilter(filters),
    mkStore.fetchAllMK(), // untuk dropdown mata kuliah
    nilaiMkStore.fetchMahasiswaData(), // untuk nama mahasiswa di tabel
  ])

  console.log('After fetch - nilaiList:', nilaiMkStore.nilaiList)
  console.log('After fetch - mahasiswaMap:', nilaiMkStore.mahasiswaMap)
}

// Fungsi untuk memproses file Excel
async function processExcelFile(file) {
  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(await file.arrayBuffer())

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      throw new Error('Worksheet not found')
    }

    // Get header info (first 6 rows)
    const mataKuliahRow = worksheet.getRow(1).values
    const tahunAjaranRow = worksheet.getRow(2).values
    const semesterRow = worksheet.getRow(3).values

    if (!mataKuliahRow || !tahunAjaranRow || !semesterRow) {
      throw new Error('Format Excel tidak sesuai dengan template SIAP')
    }

    console.log('Debug - Mata Kuliah Row:', mataKuliahRow)
    console.log('Debug - Tahun Ajaran Row:', tahunAjaranRow)
    console.log('Debug - Semester Row:', semesterRow)

    // Extract kode_mk from ": MKK231 - Kompilator"
    let kodeMK = ''
    if (mataKuliahRow[2] && typeof mataKuliahRow[2] === 'string') {
      const parts = mataKuliahRow[2].split('-')
      if (parts[0]) {
        kodeMK = parts[0].replace(':', '').trim()
      }
    }

    // Extract tahun from ": 2020"
    let tahun = ''
    if (tahunAjaranRow[2] && typeof tahunAjaranRow[2] === 'string') {
      const match = tahunAjaranRow[2].match(/\d{4}/)
      if (match) {
        tahun = match[0]
      }
    }

    // Extract semester from ": Gasal"
    let semester = ''
    if (semesterRow[2] && typeof semesterRow[2] === 'string') {
      const semesterText = semesterRow[2].toLowerCase()
      if (semesterText.includes('gasal')) {
        semester = 'gasal'
      } else if (semesterText.includes('genap')) {
        semester = 'genap'
      }
    }

    console.log('Debug - Extracted values:', { kodeMK, tahun, semester })

    if (!kodeMK || !tahun || !semester) {
      throw new Error('Tidak dapat membaca informasi Mata Kuliah, Tahun Ajaran, atau Semester')
    }

    // Convert to id_periode format (YYYYS where S is 1 for Gasal, 2 for Genap)
    const idPeriode = tahun + (semester.toLowerCase() === 'gasal' ? '1' : '2')

    // Get data rows (start from row 8)
    const nilaiData = []

    // Find header row (containing "NIM" and "Nilai Akhir Angka")
    let headerRow = null
    let nimIndex = 1
    let nilaiAkhirIndex = 0

    // Debug: Print all rows for inspection
    console.log('Debug - All Rows:')
    worksheet.eachRow((row, rowNumber) => {
      console.log(`Row ${rowNumber}:`, row.values)
    })

    // Find the header row first
    worksheet.eachRow((row, rowNumber) => {
      const values = row.values
      if (!headerRow && values) {
        // Debug: Print each row being checked for headers
        console.log(`Checking row ${rowNumber} for headers:`, values)

        for (let i = 1; i < values.length; i++) {
          const cellValue = values[i]?.toString().toLowerCase() || ''
          if (cellValue.includes('nim')) {
            nimIndex = i
            console.log('Found NIM column at index:', i)
          }
          if (cellValue.includes('nilai akhir angka')) {
            nilaiAkhirIndex = i
            headerRow = rowNumber
            console.log('Found Nilai Akhir Angka column at index:', i)
          }
        }
      }
    })

    if (!headerRow || !nilaiAkhirIndex) {
      throw new Error(
        'Format Excel tidak sesuai: tidak dapat menemukan kolom NIM dan Nilai Akhir Angka',
      )
    }

    console.log('Debug - Header found:', { headerRow, nimIndex, nilaiAkhirIndex })

    // Read data rows
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRow) return

      const values = row.values
      console.log(`Processing row ${rowNumber}:`, values)

      if (!values || values.length <= Math.max(nimIndex, nilaiAkhirIndex)) {
        console.log(`Skipping row ${rowNumber} - insufficient columns`)
        return
      }

      const nim = values[nimIndex]
      const nilaiAkhirCell = values[nilaiAkhirIndex]

      console.log(`Row ${rowNumber} values:`, { nim, nilaiAkhirCell })

      if (nim) {
        // Debug nilai akhir cell details
        console.log(`Row ${rowNumber} nilaiAkhirCell detail:`, {
          value: nilaiAkhirCell,
          type: typeof nilaiAkhirCell,
          keys: nilaiAkhirCell ? Object.keys(nilaiAkhirCell) : [],
          text: nilaiAkhirCell?.text,
          result: nilaiAkhirCell?.result,
        })

        // Convert nilai to number and handle any formatting
        let nilaiAkhir = 0

        if (typeof nilaiAkhirCell === 'number') {
          nilaiAkhir = nilaiAkhirCell
        } else if (nilaiAkhirCell && typeof nilaiAkhirCell === 'object') {
          // Try to get value from cell object
          if (nilaiAkhirCell.result) {
            nilaiAkhir = nilaiAkhirCell.result
          } else if (nilaiAkhirCell.text) {
            nilaiAkhir = parseFloat(nilaiAkhirCell.text.replace(',', '.'))
          } else {
            // Calculate nilai akhir based on column weights
            const weights = {
              5: 0.1, // Nilai Aktivitas Partisipatif (10%)
              6: 0.4, // Nilai Hasil Proyek (40%)
              7: 0.1, // Nilai Tugas (10%)
              8: 0.1, // Nilai Quiz (10%)
              9: 0.15, // Nilai UTS (15%)
              10: 0.15, // Nilai UAS (15%)
            }

            let total = 0
            for (const [colIndex, weight] of Object.entries(weights)) {
              const nilai = parseFloat(values[colIndex] || 0)
              if (!isNaN(nilai)) {
                total += nilai * weight
              }
            }
            nilaiAkhir = total
          }
        } else if (nilaiAkhirCell) {
          const nilaiStr = nilaiAkhirCell.toString().replace(',', '.').trim()
          nilaiAkhir = parseFloat(nilaiStr)
        }

        console.log(`Row ${rowNumber} parsed nilai:`, { nilaiAkhir })

        if (!isNaN(nilaiAkhir) && nilaiAkhir >= 0) {
          const dataItem = {
            id_periode: idPeriode,
            kode_mk: kodeMK,
            nim: nim.toString(),
            nilai_akhir: Number(nilaiAkhir.toFixed(2)),
          }
          console.log(`Adding data item:`, dataItem)
          nilaiData.push(dataItem)
        }
      }
    })

    console.log('Debug - Nilai Data:', nilaiData)

    // Filter out rows with invalid NIM
    const validData = nilaiData.filter((item) => item.nim && item.nim.length >= 10)

    if (validData.length === 0) {
      alert('Tidak ada data nilai yang valid ditemukan di file Excel')
      return
    }

    // Check if selected period matches
    if (selectedPeriode.value && selectedPeriode.value !== idPeriode) {
      alert('Periode di file Excel tidak sesuai dengan periode yang dipilih')
      return
    }

    // Set periode if not already selected
    if (!selectedPeriode.value) {
      selectedPeriode.value = idPeriode
    }

    // Submit nilai satu per satu
    let successCount = 0
    let failedCount = 0

    for (const nilai of validData) {
      try {
        // Format nilai to 2 decimal places
        nilai.nilai_akhir = parseFloat(nilai.nilai_akhir.toFixed(2))

        const result = await nilaiMkStore.createNilai(nilai)
        if (result && (result.success === true || result.success === undefined)) {
          successCount++
        } else {
          failedCount++
        }
      } catch (err) {
        console.error('Error submitting nilai:', err)
        failedCount++
      }
    }

    // Show summary
    alert(`Upload selesai!\nBerhasil: ${successCount} nilai\nGagal: ${failedCount} nilai`)

    // Reload data
    await loadNilaiData()
  } catch (err) {
    console.error('Error processing Excel file:', err)
    alert('Terjadi kesalahan saat memproses file Excel: ' + err.message)
  }
}

// Fungsi untuk trigger input file
function triggerFileInput() {
  const fileInput = document.getElementById('excelUpload')
  if (fileInput) {
    fileInput.click()
  }
}

// Fungsi untuk handle file upload
function handleFileUpload(event) {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    alert('File harus berformat Excel (.xlsx atau .xls)')
    event.target.value = '' // Clear input
    return
  }

  processExcelFile(file)
  event.target.value = '' // Clear input after processing
}

// Watch untuk perubahan filter mata kuliah
watch(selectedMataKuliah, async (newValue, oldValue) => {
  if (selectedPeriode.value && newValue !== oldValue) {
    await loadNilaiData()
  }
})

// Load data saat komponen dimuat
onMounted(async () => {
  console.log('=== NilMatkul onMounted ===')
  console.log('isMahasiswa:', isMahasiswa.value)
  console.log('isDosen:', isDosen.value)
  console.log('isAdmin:', isAdmin.value)
  console.log('currentUserNim:', currentUserNim.value)

  // Load periode terlebih dahulu
  await loadPeriodeOnly()
  console.log('periodeList after load:', periodeList.value)

  // Jika mahasiswa, otomatis pilih periode terbaru dan load data
  if (isMahasiswa.value && currentUserNim.value) {
    console.log('Loading data for mahasiswa...')
    // Ambil periode terbaru (diasumsikan sorted descending)
    if (periodeList.value.length > 0) {
      const latestPeriode = periodeList.value[0].id_periode
      console.log('Setting latest periode:', latestPeriode)
      selectedPeriode.value = latestPeriode

      // Load data untuk periode terbaru
      await loadNilaiData()
      console.log('filteredNilaiList after load:', filteredNilaiList.value)
    }

    // Load mata kuliah untuk filter
    await mkStore.fetchAllMK()
  } else {
    console.log('Loading data for admin/dosen...')
    // Untuk admin/dosen, load data seperti biasa
    await mkStore.fetchAllMK() // Load data mata kuliah
  }
})
</script>

<template>
  <div class="nilai-matkul-container">
    <div class="page-header">
      <h1 class="page-title">{{ isMahasiswa ? 'Nilai Mata Kuliah Saya' : 'Nilai Mata Kuliah' }}</h1>
      <p class="page-subtitle">
        {{ getCurrentKurikulumName() }}
        <span v-if="isMahasiswa && currentUserNim" class="nim-badge">
          NIM: {{ currentUserNim }}
        </span>
      </p>
    </div>

    <!-- Period & Mata Kuliah Selection -->
    <div class="filter-section">
      <div class="filters-container">
        <div class="filter-group">
          <label for="periode" class="filter-label">Periode:</label>
          <select id="periode" v-model="selectedPeriode" class="filter-select">
            <option value="">Pilih Periode</option>
            <option
              v-for="periode in periodeList"
              :key="periode.id_periode"
              :value="periode.id_periode"
            >
              {{ periode.id_periode }}
            </option>
          </select>
        </div>

        <div class="filter-group">
          <label for="matakuliah" class="filter-label">Mata Kuliah:</label>
          <select
            id="matakuliah"
            v-model="selectedMataKuliah"
            class="filter-select"
            :disabled="!selectedPeriode"
          >
            <option value="">Semua Mata Kuliah</option>
            <option
              v-for="mk in availableMataKuliahInPeriode"
              :key="mk.kode_mk"
              :value="mk.kode_mk"
            >
              {{ mk.kode_mk }} - {{ mk.nama_mk }}
            </option>
          </select>
        </div>
      </div>

      <!-- Action Button -->
      <div class="action-section" v-if="canManageKurikulumMk">
        <input
          type="file"
          id="excelUpload"
          ref="excelUpload"
          accept=".xlsx,.xls"
          class="hidden-input"
          @change="handleFileUpload"
        />
        <button
          @click="triggerFileInput"
          class="btn-upload"
          :disabled="isLoading"
          :title="isLoading ? 'Sedang memproses...' : 'Upload nilai dari Excel SIAP'"
        >
          <i class="ri-file-excel-2-line"></i>
          Upload SIAP
        </button>
        <button
          @click="openAddModal"
          class="btn-primary"
          :disabled="!selectedPeriode"
          :title="!selectedPeriode ? 'Pilih periode terlebih dahulu' : 'Tambah nilai baru'"
        >
          <i class="ri-add-line"></i>
          Tambah Nilai
        </button>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Memuat data...</p>
    </div>

    <!-- Error (hanya tampilkan jika error fatal, bukan untuk empty data) -->
    <div v-else-if="error && !selectedPeriode" class="error-container">
      <i class="ri-error-warning-line"></i>
      <p>{{ error }}</p>
      <button @click="loadPeriodeOnly" class="btn-retry">Coba Lagi</button>
    </div>

    <!-- Search & Content -->
    <div v-else-if="selectedPeriode" class="content-section">
      <!-- Search -->
      <div class="search-section">
        <div class="search-box">
          <i class="ri-search-line"></i>
          <input
            v-model="searchQuery"
            type="text"
            :placeholder="
              isMahasiswa
                ? 'Cari berdasarkan kode MK atau nama mata kuliah...'
                : 'Cari berdasarkan kode MK, NIM, atau nama...'
            "
            class="search-input"
          />
        </div>
      </div>

      <!-- Data Table -->
      <div class="table-container">
        <div class="table-header">
          <h2>Daftar Nilai - Periode {{ selectedPeriode }}</h2>
          <div class="table-info">
            <span class="total-items">Total: {{ filteredNilaiList.length }} data nilai</span>
          </div>
        </div>

        <div v-if="filteredNilaiList.length === 0" class="empty-state">
          <i class="ri-file-list-3-line"></i>
          <h3>{{ isMahasiswa ? 'Belum ada nilai' : 'Belum ada data nilai' }}</h3>
          <p>
            {{
              isMahasiswa
                ? 'Anda belum memiliki nilai untuk periode ' + selectedPeriode
                : 'Periode ' + selectedPeriode + ' belum memiliki data nilai'
            }}
          </p>
        </div>

        <div v-else class="table-wrapper">
          <table class="nilai-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Kode MK</th>
                <th>Mata Kuliah</th>
                <th v-if="!isMahasiswa">NIM</th>
                <th v-if="!isMahasiswa">Nama Mahasiswa</th>
                <th>Periode</th>
                <th>Nilai Akhir</th>
                <th>Huruf Mutu</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(nilai, index) in filteredNilaiList"
                :key="`${nilai.id_periode}-${nilai.kode_mk}-${nilai.nim}`"
              >
                <td>{{ index + 1 }}</td>
                <td>
                  <span class="kode-mk">{{ nilai.kode_mk }}</span>
                </td>
                <td>
                  <span class="nama-mk">{{ mkStore.getMataKuliahNama(nilai.kode_mk) }}</span>
                </td>
                <td v-if="!isMahasiswa">
                  <span class="nim">{{ nilai.nim }}</span>
                </td>
                <td v-if="!isMahasiswa">
                  <span class="nama-mhs">{{ nilaiMkStore.getMahasiswaNama(nilai.nim) }}</span>
                </td>
                <td>
                  <span class="periode">{{ nilai.id_periode }}</span>
                </td>
                <td>
                  <span class="nilai-akhir">{{ nilaiMkStore.formatNilai(nilai.nilai_akhir) }}</span>
                </td>
                <td>
                  <span
                    class="huruf-mutu"
                    :class="getHurufMutuClass(nilaiMkStore.getHurufMutu(nilai.nilai_akhir))"
                  >
                    {{ nilaiMkStore.getHurufMutu(nilai.nilai_akhir) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Empty State for No Period Selected -->
    <div v-else class="no-period-state">
      <i class="ri-calendar-line"></i>
      <h3>Pilih Periode</h3>
      <p>Silakan pilih periode untuk melihat data nilai mata kuliah</p>
    </div>

    <!-- Add Nilai Modal -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Tambah Nilai Mata Kuliah</h3>
          <button class="modal-close" @click="closeModal">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="periode" class="form-label">Periode</label>
            <input
              type="text"
              id="periode"
              :value="selectedPeriode"
              class="form-input"
              disabled
              readonly
            />
          </div>

          <div class="form-group">
            <label for="mata-kuliah" class="form-label">Mata Kuliah *</label>
            <div class="combobox-container">
              <input
                type="text"
                id="mata-kuliah"
                v-model="mkSearchQuery"
                class="form-input combobox-input"
                placeholder="Ketik kode atau nama mata kuliah..."
                required
                @input="filterMataKuliah"
                @focus="showMkDropdown = true"
                @blur="hideMkDropdown"
                autocomplete="off"
              />
              <div v-if="showMkDropdown && filteredMK.length > 0" class="combobox-dropdown">
                <div v-if="mkSearchQuery" class="combobox-header">
                  {{ filteredMK.length }} mata kuliah ditemukan
                </div>
                <div
                  v-for="mk in filteredMK"
                  :key="mk.kode_mk"
                  class="combobox-option"
                  @mousedown="selectMataKuliah(mk)"
                >
                  <span class="mk-kode">{{ mk.kode_mk }}</span>
                  <span class="mk-nama">{{ mk.nama_mk }}</span>
                </div>
              </div>
              <div
                v-if="showMkDropdown && filteredMK.length === 0 && mkSearchQuery"
                class="combobox-empty"
              >
                Mata kuliah tidak ditemukan
              </div>
            </div>
            <div v-if="selectedMK" class="selected-mk-info">
              <i class="ri-book-line"></i>
              <span class="selected-mk-text"
                >{{ selectedMK.kode_mk }} - {{ selectedMK.nama_mk }}</span
              >
              <button type="button" class="clear-mk-btn" @click="clearMataKuliah">
                <i class="ri-close-line"></i>
              </button>
            </div>
          </div>

          <div class="form-group">
            <label for="nim" class="form-label">NIM Mahasiswa *</label>
            <input
              type="text"
              id="nim"
              v-model="formData.nim"
              class="form-input"
              placeholder="Masukkan NIM mahasiswa"
              required
              @input="checkMahasiswaNama"
            />
            <div v-if="mahasiswaInfo.nim && mahasiswaInfo.nim === formData.nim" class="nim-info">
              <div v-if="mahasiswaInfo.nama" class="nim-found">
                <i class="ri-user-line"></i>
                <span class="nama-mahasiswa">{{ mahasiswaInfo.nama }}</span>
                <i class="ri-check-line check-icon"></i>
              </div>
              <div v-else class="nim-not-found">
                <i class="ri-error-warning-line"></i>
                <span class="error-text">Mahasiswa tidak ditemukan</span>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label for="nilai" class="form-label">Nilai Akhir *</label>
            <input
              type="number"
              id="nilai"
              v-model="formData.nilai_akhir"
              class="form-input"
              placeholder="0-100"
              min="0"
              max="100"
              step="0.01"
              required
            />
            <small class="form-help">
              Masukkan nilai 0-100. Contoh: 80 akan menjadi 80.00
              <br />Huruf mutu:
              {{ formData.nilai_akhir ? nilaiMkStore.getHurufMutu(formData.nilai_akhir) : '-' }}
            </small>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-secondary" @click="closeModal">Batal</button>
          <button type="button" class="btn-primary" @click="submitForm">
            <i class="ri-save-line"></i>
            Simpan Nilai
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.nilai-matkul-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #6b7280;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 12px;
}

.nim-badge {
  display: inline-block;
  background-color: #dbeafe;
  color: #1e40af;
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Monaco', 'Menlo', monospace;
}

.filter-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 20px;
  background-color: #f8fafc;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
}

.filters-container {
  display: flex;
  align-items: center;
  gap: 24px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-label {
  font-weight: 600;
  color: #374151;
  min-width: 90px;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  font-size: 14px;
  min-width: 180px;
}

.filter-select:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}

.action-section {
  display: flex;
  gap: 12px;
}

.hidden-input {
  display: none;
}

.btn-upload {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #15803d;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-upload:hover:not(:disabled) {
  background-color: #166534;
}

.btn-upload:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background-color: #45a049;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f4f6;
  border-top: 4px solid #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.error-container i {
  font-size: 48px;
  color: #ef4444;
  margin-bottom: 16px;
}

.btn-retry {
  margin-top: 16px;
  padding: 8px 16px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-section {
  margin-bottom: 24px;
}

.search-box {
  position: relative;
  max-width: 400px;
}

.search-box i {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.table-container {
  background-color: white;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.table-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-header h2 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.total-items {
  font-size: 14px;
  color: #6b7280;
}

.table-wrapper {
  overflow-x: auto;
}

.nilai-table {
  width: 100%;
  border-collapse: collapse;
}

.nilai-table th {
  background-color: #f8fafc;
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e2e8f0;
}

.nilai-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #f1f5f9;
}

.nilai-table tbody tr:hover {
  background-color: #f8fafc;
}

.kode-mk {
  font-family: 'Monaco', 'Menlo', monospace;
  background-color: #e0f2fe;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.nim {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
}

.periode {
  font-family: 'Monaco', 'Menlo', monospace;
  font-weight: 600;
  color: #6b7280;
}

.nilai-akhir {
  font-weight: 600;
  color: #1f2937;
}

.huruf-mutu {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 12px;
  text-align: center;
  min-width: 32px;
}

.huruf-a {
  background-color: #16a34a;
  color: white;
}

.huruf-b {
  background-color: #2563eb;
  color: white;
}

.huruf-c {
  background-color: #f59e0b;
  color: white;
}

.huruf-d {
  background-color: #ef4444;
  color: white;
}

.huruf-e {
  background-color: #dc2626;
  color: white;
}

.huruf-default {
  background-color: #6b7280;
  color: white;
}

.empty-state,
.no-period-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  color: #6b7280;
}

.empty-state i,
.no-period-state i {
  font-size: 64px;
  margin-bottom: 16px;
  color: #d1d5db;
}

.empty-state h3,
.no-period-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: #374151;
  margin: 0 0 8px 0;
}

.empty-state p,
.no-period-state p {
  font-size: 14px;
  margin: 0;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background-color: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
}

.modal-body {
  padding: 24px;
}

.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  margin-bottom: 6px;
  font-weight: 600;
  color: #374151;
}

.form-input,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-help {
  display: block;
  margin-top: 6px;
  font-size: 12px;
  color: #6b7280;
}

/* NIM Info Styles */
.nim-info {
  margin-top: 8px;
}

.nim-found {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 14px;
}

.nim-found i.ri-user-line {
  color: #0284c7;
}

.nama-mahasiswa {
  color: #0c4a6e;
  font-weight: 500;
  flex-grow: 1;
}

.check-icon {
  color: #16a34a;
  font-size: 16px;
}

.nim-not-found {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 6px;
  font-size: 14px;
}

.nim-not-found i.ri-error-warning-line {
  color: #dc2626;
}

.error-text {
  color: #991b1b;
  font-weight: 500;
}

/* Combobox Styles */
.combobox-container {
  position: relative;
}

.combobox-input {
  width: 100%;
  padding-right: 32px;
}

.combobox-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  max-height: 240px;
  overflow-y: auto;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

/* Custom scrollbar untuk dropdown */
.combobox-dropdown::-webkit-scrollbar {
  width: 6px;
}

.combobox-dropdown::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 3px;
}

.combobox-dropdown::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

.combobox-dropdown::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

.combobox-header {
  padding: 8px 12px;
  font-size: 12px;
  color: #6b7280;
  background-color: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  font-weight: 500;
  position: sticky;
  top: 0;
  z-index: 1;
}

.combobox-option {
  padding: 10px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  border-bottom: 1px solid #f1f5f9;
}

.combobox-option:hover {
  background-color: #f8fafc;
}

.combobox-option:last-child {
  border-bottom: none;
}

.mk-kode {
  font-weight: 600;
  color: #374151;
  min-width: 80px;
}

.mk-nama {
  color: #6b7280;
  flex-grow: 1;
}

.combobox-empty {
  padding: 8px 12px;
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  font-style: italic;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
}

.selected-mk-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  padding: 8px 12px;
  background-color: #f0f9ff;
  border: 1px solid #bae6fd;
  border-radius: 6px;
  font-size: 14px;
}

.selected-mk-info i.ri-book-line {
  color: #0284c7;
}

.selected-mk-text {
  color: #0c4a6e;
  font-weight: 500;
  flex-grow: 1;
}

.clear-mk-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  border-radius: 50%;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-mk-btn:hover {
  background-color: rgba(75, 85, 99, 0.1);
  color: #374151;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.btn-secondary {
  padding: 8px 16px;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary:hover {
  background-color: #e5e7eb;
}

/* Responsive */
@media (max-width: 768px) {
  .nilai-matkul-container {
    padding: 16px;
  }

  .filter-section {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .filters-container {
    flex-direction: column;
    gap: 16px;
  }

  .filter-group {
    justify-content: center;
  }

  .filter-label {
    min-width: auto;
  }

  .filter-select {
    min-width: 200px;
  }

  .action-section {
    justify-content: center;
  }

  .table-header {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .modal-content {
    margin: 16px;
    max-height: calc(100vh - 32px);
  }
}
</style>
