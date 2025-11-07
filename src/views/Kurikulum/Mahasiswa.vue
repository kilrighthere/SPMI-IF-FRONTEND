<script setup>
import { ref, onMounted, computed } from 'vue'
import { useMahasiswaStore } from '@/stores/mahasiswa'
import { usePermissions } from '@/composables/usePermissions'
import ExcelJS from 'exceljs'

const mahasiswaStore = useMahasiswaStore()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa, userId, userRole } = usePermissions()

const mahasiswaList = computed(() => mahasiswaStore.mahasiswaList)
const isLoading = computed(() => mahasiswaStore.isLoading)
const error = computed(() => mahasiswaStore.error)

// Pagination state
const currentPage = ref(1)
const itemsPerPage = ref(10) // Jumlah data per halaman

// Computed untuk pagination
const totalPages = computed(() => Math.ceil(mahasiswaList.value.length / itemsPerPage.value))

const paginatedMahasiswaList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return mahasiswaList.value.slice(start, end)
})

// Fungsi pagination
const goToPage = (page) => {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
    // Scroll to top of table
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

// Get page numbers to display (max 5 pages at a time)
const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5

  if (totalPages.value <= maxVisible) {
    // Show all pages if total is less than max
    for (let i = 1; i <= totalPages.value; i++) {
      pages.push(i)
    }
  } else {
    // Show current page with 2 pages on each side
    let start = Math.max(1, currentPage.value - 2)
    let end = Math.min(totalPages.value, currentPage.value + 2)

    // Adjust if we're near the start or end
    if (currentPage.value <= 3) {
      end = maxVisible
    } else if (currentPage.value >= totalPages.value - 2) {
      start = totalPages.value - maxVisible + 1
    }

    for (let i = start; i <= end; i++) {
      pages.push(i)
    }
  }

  return pages
})

// Notification state
const notification = ref({
  show: false,
  type: 'success', // 'success', 'error', 'warning'
  message: '',
})

// For mahasiswa, show only their own data
const currentUserData = computed(() => {
  if (isMahasiswa.value) {
    return mahasiswaList.value.find((mhs) => mhs.nim === userId.value) || null
  }
  return null
})

const form = ref({
  nim: '',
  nama: '',
})

const isEditing = ref(false)
const showForm = ref(false)

// Excel upload state
const showUploadModal = ref(false)
const isUploading = ref(false)
const uploadFileInput = ref(null)
const uploadResults = ref(null)

// Form validation state
const formErrors = ref({
  nim: '',
  nama: '',
})

const fetchMahasiswa = async () => {
  try {
    await mahasiswaStore.fetchMahasiswa()

    // Show error notification if there was an error but fallback data was loaded
    if (mahasiswaStore.error) {
      showNotification('warning', mahasiswaStore.error)
    }
  } catch (err) {
    console.error('Error fetching mahasiswa:', err)
    const errorMessage =
      mahasiswaStore.error || 'Gagal memuat data mahasiswa. Silakan refresh halaman.'
    showNotification('error', errorMessage)
  }
}

const validateForm = () => {
  let isValid = true
  formErrors.value = { nim: '', nama: '' }

  // Validasi NIM
  if (!form.value.nim.trim()) {
    formErrors.value.nim = 'NIM tidak boleh kosong'
    isValid = false
  } else if (form.value.nim.length < 8) {
    formErrors.value.nim = 'NIM minimal 8 karakter'
    isValid = false
  } else if (!/^[0-9]+$/.test(form.value.nim)) {
    formErrors.value.nim = 'NIM hanya boleh berisi angka'
    isValid = false
  } else if (!isEditing.value) {
    // Check if NIM already exists (only when adding new)
    const existingMahasiswa = mahasiswaList.value.find((m) => m.nim === form.value.nim.trim())
    if (existingMahasiswa) {
      formErrors.value.nim = 'NIM sudah terdaftar'
      isValid = false
    }
  }

  // Validasi Nama
  if (!form.value.nama.trim()) {
    formErrors.value.nama = 'Nama Mahasiswa tidak boleh kosong'
    isValid = false
  } else if (form.value.nama.trim().length < 2) {
    formErrors.value.nama = 'Nama minimal 2 karakter'
    isValid = false
  } else if (form.value.nama.trim().length > 100) {
    formErrors.value.nama = 'Nama maksimal 100 karakter'
    isValid = false
  }

  return isValid
}

const saveMahasiswa = async () => {
  try {
    if (!validateForm()) {
      // Show validation errors as notification
      const errors = Object.values(formErrors.value).filter((error) => error.trim() !== '')
      if (errors.length > 0) {
        showNotification('warning', `Perbaiki kesalahan berikut: ${errors.join(', ')}`)
      }
      return
    }

    // Trim form values before submission
    const submitData = {
      nim: form.value.nim.trim(),
      nama: form.value.nama.trim(),
    }

    let result
    if (isEditing.value) {
      result = await mahasiswaStore.editMahasiswa(submitData.nim, submitData)
      if (result && result.success) {
        showNotification('success', `Data mahasiswa ${submitData.nama} berhasil diperbarui!`)
        resetForm()
        // Stay on current page after edit
      } else {
        showNotification('error', result?.error || 'Gagal memperbarui data mahasiswa.')
      }
    } else {
      result = await mahasiswaStore.createMahasiswa(submitData)
      if (result && result.success) {
        showNotification('success', `Data mahasiswa ${submitData.nama} berhasil ditambahkan!`)
        resetForm()
        // Go to last page after adding new data
        currentPage.value = Math.ceil(mahasiswaList.value.length / itemsPerPage.value)
      } else {
        showNotification('error', result?.error || 'Gagal menambahkan data mahasiswa.')
      }
    }
  } catch (err) {
    console.error('Error saving mahasiswa:', err)
    showNotification('error', 'Gagal menyimpan data mahasiswa. Silakan coba lagi.')
  }
}

const editMahasiswa = (mahasiswa) => {
  form.value = { ...mahasiswa }
  isEditing.value = true
  showForm.value = true

  // Scroll to form section
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  })
}

const removeMahasiswa = async (nim) => {
  const mahasiswa = mahasiswaList.value.find((m) => m.nim === nim)
  const namaHapus = mahasiswa ? mahasiswa.nama : nim

  if (confirm(`Apakah anda yakin ingin menghapus mahasiswa ${namaHapus}?`)) {
    try {
      const result = await mahasiswaStore.removeMahasiswa(nim)
      if (result && result.success) {
        showNotification('success', `Data mahasiswa ${namaHapus} berhasil dihapus!`)

        // Adjust current page if needed after deletion
        const newTotalPages = Math.ceil((mahasiswaList.value.length - 1) / itemsPerPage.value)
        if (currentPage.value > newTotalPages && newTotalPages > 0) {
          currentPage.value = newTotalPages
        }
      } else {
        showNotification('error', 'Gagal menghapus data mahasiswa.')
      }
    } catch (err) {
      console.error('Error removing mahasiswa:', err)
      showNotification('error', 'Gagal menghapus data mahasiswa. Silakan coba lagi.')
    }
  }
}

const resetForm = () => {
  form.value = { nim: '', nama: '' }
  formErrors.value = { nim: '', nama: '' }
  isEditing.value = false
  showForm.value = false
}

// Notification functions
const showNotification = (type, message) => {
  notification.value = {
    show: true,
    type,
    message,
  }

  // Auto hide after 5 seconds
  setTimeout(() => {
    hideNotification()
  }, 5000)
}

const hideNotification = () => {
  notification.value.show = false
}

const getNotificationIcon = (type) => {
  switch (type) {
    case 'success':
      return 'ri-check-circle-line'
    case 'error':
      return 'ri-error-warning-line'
    case 'warning':
      return 'ri-alert-line'
    case 'info':
      return 'ri-information-line'
    default:
      return 'ri-information-line'
  }
}

// Excel functions
const downloadTemplate = async () => {
  try {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Template Mahasiswa')

    // Set column headers
    worksheet.columns = [
      { header: 'NIM', key: 'nim', width: 20 },
      { header: 'Nama Mahasiswa', key: 'nama', width: 40 },
    ]

    // Style the header row
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFA6D600' },
    }

    // Add sample data dengan catatan untuk dihapus
    const sampleRow1 = worksheet.addRow({
      nim: '24060120140001',
      nama: 'Contoh Mahasiswa 1 (HAPUS BARIS INI)',
    })
    const sampleRow2 = worksheet.addRow({
      nim: '24060120140002',
      nama: 'Contoh Mahasiswa 2 (HAPUS BARIS INI)',
    })

    // Style sample rows dengan warna berbeda
    sampleRow1.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEAA7' },
    }
    sampleRow2.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFEAA7' },
    }

    // Add instructions sheet
    const instructionSheet = workbook.addWorksheet('Petunjuk')
    instructionSheet.addRow(['PETUNJUK PENGGUNAAN TEMPLATE UPLOAD MAHASISWA'])
    instructionSheet.addRow([])
    instructionSheet.addRow(['1. Isi data mahasiswa pada sheet "Template Mahasiswa"'])
    instructionSheet.addRow([
      '2. Kolom NIM: Masukkan NIM mahasiswa (hanya angka, minimal 8 karakter)',
    ])
    instructionSheet.addRow(['3. Kolom Nama: Masukkan nama lengkap mahasiswa (2-100 karakter)'])
    instructionSheet.addRow(['4. Hapus baris contoh sebelum upload'])
    instructionSheet.addRow(['5. Simpan file dan upload melalui sistem'])
    instructionSheet.addRow([])
    instructionSheet.addRow(['CATATAN:'])
    instructionSheet.addRow(['- NIM tidak boleh duplikat'])
    instructionSheet.addRow(['- Maksimal 100 mahasiswa per upload'])
    instructionSheet.addRow(['- Format file: .xlsx'])

    // Style instruction sheet
    instructionSheet.getRow(1).font = { bold: true, size: 14 }
    instructionSheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6F3FF' },
    }
    instructionSheet.getRow(9).font = { bold: true }

    instructionSheet.getColumn(1).width = 60

    // Generate and download file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })

    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Template_Upload_Mahasiswa.xlsx'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    showNotification('success', 'Template berhasil didownload!')
  } catch (error) {
    console.error('Error generating template:', error)
    showNotification('error', 'Gagal mendownload template')
  }
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  // Validate file type
  if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
    showNotification('error', 'File harus berformat Excel (.xlsx atau .xls)')
    return
  }

  // Validate file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    showNotification('error', 'Ukuran file maksimal 5MB')
    return
  }

  isUploading.value = true
  uploadResults.value = null

  try {
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(file)

    const worksheet = workbook.getWorksheet('Template Mahasiswa') || workbook.getWorksheet(1)
    if (!worksheet) {
      throw new Error('Sheet tidak ditemukan')
    }

    const mahasiswaData = []
    const errors = []
    const existingNIMs = new Set(mahasiswaList.value.map((m) => m.nim))
    const uploadNIMs = new Set()

    // Process each row (skip header)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return // Skip header

      const nim = row.getCell(1).text?.trim()
      const nama = row.getCell(2).text?.trim()

      // Skip empty rows
      if (!nim && !nama) return

      // Validate NIM
      if (!nim) {
        errors.push(`Baris ${rowNumber}: NIM tidak boleh kosong`)
        return
      }

      if (nim.length < 8) {
        errors.push(`Baris ${rowNumber}: NIM minimal 8 karakter`)
        return
      }

      if (!/^[0-9]+$/.test(nim)) {
        errors.push(`Baris ${rowNumber}: NIM hanya boleh berisi angka`)
        return
      }

      if (existingNIMs.has(nim)) {
        errors.push(`Baris ${rowNumber}: NIM ${nim} sudah terdaftar`)
        return
      }

      if (uploadNIMs.has(nim)) {
        errors.push(`Baris ${rowNumber}: NIM ${nim} duplikat dalam file`)
        return
      }

      // Validate nama
      if (!nama) {
        errors.push(`Baris ${rowNumber}: Nama tidak boleh kosong`)
        return
      }

      if (nama.length < 2) {
        errors.push(`Baris ${rowNumber}: Nama minimal 2 karakter`)
        return
      }

      if (nama.length > 100) {
        errors.push(`Baris ${rowNumber}: Nama maksimal 100 karakter`)
        return
      }

      // Add to upload data
      mahasiswaData.push({ nim, nama })
      uploadNIMs.add(nim)
    })

    // Check if no valid data
    if (mahasiswaData.length === 0 && errors.length === 0) {
      errors.push('Tidak ada data mahasiswa yang valid ditemukan')
    }

    // Check maximum limit
    if (mahasiswaData.length > 100) {
      errors.push('Maksimal 100 mahasiswa per upload')
    }

    uploadResults.value = {
      validData: mahasiswaData,
      errors,
      totalRows: mahasiswaData.length + errors.length,
    }
  } catch (error) {
    console.error('Error processing Excel file:', error)
    showNotification('error', 'Gagal memproses file Excel. Pastikan format file benar.')
  } finally {
    isUploading.value = false
  }
}

const confirmUpload = async () => {
  if (!uploadResults.value || uploadResults.value.validData.length === 0) {
    return
  }

  isUploading.value = true
  let successCount = 0
  let failCount = 0
  const failedItems = []

  try {
    for (const mahasiswa of uploadResults.value.validData) {
      try {
        const result = await mahasiswaStore.createMahasiswa(mahasiswa)
        if (result && result.success) {
          successCount++
        } else {
          failCount++
          failedItems.push(
            `${mahasiswa.nim} - ${mahasiswa.nama}: ${result?.error || 'Unknown error'}`,
          )
        }
      } catch (error) {
        failCount++
        failedItems.push(`${mahasiswa.nim} - ${mahasiswa.nama}: ${error.message}`)
      }
    }

    // Show results
    if (successCount > 0 && failCount === 0) {
      showNotification('success', `Berhasil menambahkan ${successCount} mahasiswa`)
      // Go to last page after bulk upload
      currentPage.value = Math.ceil(mahasiswaList.value.length / itemsPerPage.value)
    } else if (successCount > 0 && failCount > 0) {
      showNotification(
        'warning',
        `Berhasil: ${successCount}, Gagal: ${failCount}. Periksa detail di bawah.`,
      )
    } else {
      showNotification('error', `Gagal menambahkan semua data (${failCount} gagal)`)
    }

    // Update results for display
    uploadResults.value = {
      ...uploadResults.value,
      uploaded: true,
      successCount,
      failCount,
      failedItems,
    }
  } catch (error) {
    console.error('Error during bulk upload:', error)
    showNotification('error', 'Terjadi kesalahan saat upload data')
  } finally {
    isUploading.value = false
  }
}

const closeUploadModal = () => {
  showUploadModal.value = false
  uploadResults.value = null
  if (uploadFileInput.value) {
    uploadFileInput.value.value = ''
  }
}

const openUploadModal = () => {
  // Close form if open
  if (showForm.value) {
    resetForm()
  }
  showUploadModal.value = true
  uploadResults.value = null
}

onMounted(() => {
  fetchMahasiswa()
})
</script>

<template>
  <div class="mahasiswa-container">
    <!-- Notification -->
    <div v-if="notification.show" :class="['notification', `notification-${notification.type}`]">
      <div class="notification-content">
        <i :class="getNotificationIcon(notification.type)"></i>
        <span>{{ notification.message }}</span>
        <button @click="hideNotification" class="notification-close">
          <i class="ri-close-line"></i>
        </button>
      </div>
    </div>

    <!-- View untuk Mahasiswa - hanya profil sendiri -->
    <div v-if="isMahasiswa" class="section-box">
      <div class="section-header">
        <h3>Profil Saya</h3>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <!-- Profile data -->
      <div v-else-if="currentUserData" class="profile-container">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar">
              {{ currentUserData.nama?.substring(0, 2).toUpperCase() }}
            </div>
            <div class="profile-info">
              <h4>{{ currentUserData.nama }}</h4>
              <p>NIM: {{ currentUserData.nim }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- No data found -->
      <div v-else class="no-data">Data profil tidak ditemukan</div>
    </div>

    <!-- View untuk Dosen/Admin - manajemen semua mahasiswa -->
    <div v-else-if="isDosen || isAdmin" class="section-box">
      <div class="section-header">
        <h3>Data Mahasiswa</h3>
        <div class="header-actions" v-if="isAdmin">
          <button class="btn-upload" @click="openUploadModal">
            <i class="ri-upload-2-line"></i> Upload Excel
          </button>
          <button class="btn-add" @click="showForm ? resetForm() : (showForm = true)">
            {{ showForm ? 'Batal' : 'Tambah Mahasiswa' }}
          </button>
        </div>
      </div>

      <!-- Form tambah/edit mahasiswa -->
      <div v-if="showForm" class="form-container">
        <div class="form-group">
          <label>NIM</label>
          <input
            type="text"
            v-model="form.nim"
            placeholder="Nomor Induk Mahasiswa"
            :disabled="isEditing"
            :class="{ 'input-error': formErrors.nim }"
          />
          <div v-if="formErrors.nim" class="error-text">{{ formErrors.nim }}</div>
        </div>
        <div class="form-group">
          <label>Nama Mahasiswa</label>
          <input
            type="text"
            v-model="form.nama"
            placeholder="Nama lengkap mahasiswa"
            :class="{ 'input-error': formErrors.nama }"
          />
          <div v-if="formErrors.nama" class="error-text">{{ formErrors.nama }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-save" @click="saveMahasiswa">
            {{ isEditing ? 'Update' : 'Simpan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-else-if="error" class="error-message">{{ error }}</div>

      <!-- Mahasiswa List -->
      <div v-else class="mahasiswa-content">
        <div v-if="mahasiswaList.length === 0" class="empty-state">Belum ada data mahasiswa.</div>

        <div v-else>
          <table class="mahasiswa-table">
            <thead>
              <tr>
                <th width="10%">No.</th>
                <th width="20%">NIM</th>
                <th width="50%">Nama Mahasiswa</th>
                <th width="20%" class="aksi-title" v-if="isAdmin">Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(mahasiswa, index) in paginatedMahasiswaList" :key="mahasiswa.nim">
                <td class="text-center">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                <td>{{ mahasiswa.nim }}</td>
                <td>{{ mahasiswa.nama }}</td>
                <td class="action-button" v-if="isAdmin">
                  <button class="btn-edit" @click="editMahasiswa(mahasiswa)">Edit</button>
                  <button class="btn-delete" @click="removeMahasiswa(mahasiswa.nim)">Hapus</button>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination Controls -->
          <div class="pagination-container">
            <div class="pagination-info">
              Menampilkan {{ (currentPage - 1) * itemsPerPage + 1 }} -
              {{ Math.min(currentPage * itemsPerPage, mahasiswaList.length) }}
              dari {{ mahasiswaList.length }} data
            </div>

            <div class="pagination-controls">
              <button
                class="pagination-btn"
                @click="prevPage"
                :disabled="currentPage === 1"
                title="Halaman sebelumnya"
              >
                <i class="ri-arrow-left-s-line"></i>
              </button>

              <button v-if="visiblePages[0] > 1" class="pagination-btn" @click="goToPage(1)">
                1
              </button>

              <span v-if="visiblePages[0] > 2" class="pagination-dots">...</span>

              <button
                v-for="page in visiblePages"
                :key="page"
                class="pagination-btn"
                :class="{ active: page === currentPage }"
                @click="goToPage(page)"
              >
                {{ page }}
              </button>

              <span
                v-if="visiblePages[visiblePages.length - 1] < totalPages - 1"
                class="pagination-dots"
                >...</span
              >

              <button
                v-if="visiblePages[visiblePages.length - 1] < totalPages"
                class="pagination-btn"
                @click="goToPage(totalPages)"
              >
                {{ totalPages }}
              </button>

              <button
                class="pagination-btn"
                @click="nextPage"
                :disabled="currentPage === totalPages"
                title="Halaman berikutnya"
              >
                <i class="ri-arrow-right-s-line"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Excel Modal -->
    <div v-if="showUploadModal" class="modal-overlay" @click="closeUploadModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>Upload Data Mahasiswa Excel</h4>
          <button class="modal-close" @click="closeUploadModal">
            <i class="ri-close-line"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- Step 1: Download Template -->
          <div class="upload-step">
            <h5><i class="ri-download-line"></i> Langkah 1: Download Template</h5>
            <p>Download template Excel terlebih dahulu, isi data mahasiswa sesuai format.</p>
            <button class="btn-template" @click="downloadTemplate">
              <i class="ri-file-excel-line"></i> Download Template
            </button>
          </div>

          <!-- Step 2: Upload File -->
          <div class="upload-step">
            <h5><i class="ri-upload-line"></i> Langkah 2: Upload File</h5>
            <div class="file-upload-area">
              <input
                type="file"
                ref="uploadFileInput"
                @change="handleFileUpload"
                accept=".xlsx,.xls"
                class="file-input"
                :disabled="isUploading"
              />
              <div class="file-upload-content">
                <i class="ri-file-excel-2-line"></i>
                <p><strong>Pilih file Excel</strong> atau drag & drop</p>
                <p class="file-info">Format: .xlsx, .xls (Max: 5MB)</p>
              </div>
            </div>
          </div>

          <!-- Loading -->
          <div v-if="isUploading && !uploadResults" class="upload-loading">
            <div class="spinner"></div>
            <p>Memproses file Excel...</p>
          </div>

          <!-- Upload Results -->
          <div v-if="uploadResults" class="upload-results">
            <h5><i class="ri-file-list-line"></i> Hasil Validasi</h5>

            <!-- Summary -->
            <div class="results-summary">
              <div class="summary-item valid" v-if="uploadResults.validData.length > 0">
                <i class="ri-check-circle-line"></i>
                <span>{{ uploadResults.validData.length }} data valid</span>
              </div>
              <div class="summary-item error" v-if="uploadResults.errors.length > 0">
                <i class="ri-error-warning-line"></i>
                <span>{{ uploadResults.errors.length }} error</span>
              </div>
            </div>

            <!-- Valid Data Preview -->
            <div v-if="uploadResults.validData.length > 0" class="valid-data-preview">
              <h6>Data yang akan diupload:</h6>
              <div class="data-preview-table">
                <table>
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>NIM</th>
                      <th>Nama</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(item, index) in uploadResults.validData.slice(0, 5)" :key="index">
                      <td>{{ index + 1 }}</td>
                      <td>{{ item.nim }}</td>
                      <td>{{ item.nama }}</td>
                    </tr>
                  </tbody>
                </table>
                <p v-if="uploadResults.validData.length > 5" class="preview-note">
                  ...dan {{ uploadResults.validData.length - 5 }} data lainnya
                </p>
              </div>
            </div>

            <!-- Errors -->
            <div v-if="uploadResults.errors.length > 0" class="error-list">
              <h6>Error yang ditemukan:</h6>
              <ul>
                <li v-for="error in uploadResults.errors" :key="error">{{ error }}</li>
              </ul>
            </div>

            <!-- Upload Results (after upload) -->
            <div v-if="uploadResults.uploaded" class="upload-final-results">
              <div class="final-summary">
                <div class="summary-item success" v-if="uploadResults.successCount > 0">
                  <i class="ri-check-circle-line"></i>
                  <span>{{ uploadResults.successCount }} berhasil diupload</span>
                </div>
                <div class="summary-item error" v-if="uploadResults.failCount > 0">
                  <i class="ri-error-warning-line"></i>
                  <span>{{ uploadResults.failCount }} gagal diupload</span>
                </div>
              </div>

              <div v-if="uploadResults.failedItems.length > 0" class="failed-items">
                <h6>Item yang gagal diupload:</h6>
                <ul>
                  <li v-for="item in uploadResults.failedItems" :key="item">{{ item }}</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeUploadModal">Tutup</button>
          <button
            v-if="uploadResults && uploadResults.validData.length > 0 && !uploadResults.uploaded"
            class="btn-confirm"
            @click="confirmUpload"
            :disabled="isUploading"
          >
            <span v-if="isUploading"> <i class="ri-loader-4-line spin"></i> Mengupload... </span>
            <span v-else>
              <i class="ri-upload-2-line"></i> Upload {{ uploadResults.validData.length }} Data
            </span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
}

.section-box h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.mahasiswa-content {
  line-height: 1.6;
}

.mahasiswa-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.mahasiswa-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.mahasiswa-table th {
  padding: 16px 14px;
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
  text-align: center;
}

.mahasiswa-table td {
  padding: 16px 14px;
  border-bottom: 1px solid #f3f4f6;
  vertical-align: middle;
  color: #4b5563;
  font-size: 14px;
}

.mahasiswa-table .text-center {
  text-align: center;
  font-weight: 600;
  color: #6b7280;
}

.mahasiswa-table .action-button {
  text-align: center;
  white-space: nowrap;
}

.mahasiswa-table tbody tr {
  transition: all 0.2s ease;
  background: white;
}

.mahasiswa-table tbody tr:hover {
  background: #faffec;
  transform: scale(1.001);
}

.mahasiswa-table tbody tr:last-child td {
  border-bottom: none;
}

.form-container {
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

.form-group input:disabled {
  background-color: #f0f0f0;
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-button) !important;
}

.error-text {
  color: var(--color-button);
  font-size: 14px;
  margin-top: 3px;
}

.form-actions {
  display: flex;
  gap: 10px;
}

.btn-add {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.btn-add:hover {
  background-color: var(--color-buttonter);
  color: white;
}

.btn-save {
  background-color: var(--color-buttonter);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-save:hover {
  opacity: 0.9;
}

.btn-edit {
  background-color: var(--color-buttonsec);
  color: var(--color-text);
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-right: 5px;
  transition: all 0.2s ease;
}

.btn-edit:hover {
  background-color: var(--color-buttonter);
  color: white;
}

.btn-delete {
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s ease;
}

.btn-delete:hover {
  opacity: 0.9;
}

/* Profile Styles for Mahasiswa */
.profile-container {
  margin-top: 20px;
}

.profile-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  box-shadow: 0 4px 16px rgba(166, 214, 0, 0.3);
}

.profile-info h4 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.profile-info p {
  margin: 0;
  font-size: 14px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.no-data {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-style: italic;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  color: var(--color-button);
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
  text-align: center;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

/* Pagination Styles */
.pagination-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 16px 0;
  border-top: 1px solid #e0e0e0;
  flex-wrap: wrap;
  gap: 12px;
}

.pagination-info {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 6px;
}

.pagination-btn {
  min-width: 36px;
  height: 36px;
  padding: 0 8px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--color-buttonsec);
  border-color: var(--color-buttonsec);
  color: var(--color-text);
  transform: translateY(-1px);
}

.pagination-btn.active {
  background: var(--color-buttonter);
  border-color: var(--color-buttonter);
  color: white;
  font-weight: 600;
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  background: #f3f4f6;
}

.pagination-btn i {
  font-size: 18px;
}

.pagination-dots {
  padding: 0 4px;
  color: #9ca3af;
  font-weight: 600;
  user-select: none;
}

/* Responsive Pagination */
@media (max-width: 768px) {
  .pagination-container {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }

  .pagination-info {
    text-align: center;
  }

  .pagination-controls {
    justify-content: center;
    flex-wrap: wrap;
  }

  .pagination-btn {
    min-width: 32px;
    height: 32px;
    font-size: 13px;
  }
}

:placeholder-shown {
  font-family: 'Inter', Arial, Helvetica, sans-serif;
}

/* Notification Styles */
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  min-width: 320px;
  max-width: 500px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  background: white;
  border-radius: 8px;
  border-left: 4px solid;
}

.notification-success {
  border-left-color: #10b981;
}

.notification-success .notification-content {
  background: #f0fdf4;
  color: #065f46;
}

.notification-error {
  border-left-color: #ef4444;
}

.notification-error .notification-content {
  background: #fef2f2;
  color: #991b1b;
}

.notification-warning {
  border-left-color: #f59e0b;
}

.notification-warning .notification-content {
  background: #fffbeb;
  color: #92400e;
}

.notification-info {
  border-left-color: #3b82f6;
}

.notification-info .notification-content {
  background: #eff6ff;
  color: #1e40af;
}

.notification-content i:first-child {
  font-size: 20px;
  flex-shrink: 0;
}

.notification-content span {
  flex: 1;
  font-weight: 500;
  font-size: 14px;
  line-height: 1.4;
}

.notification-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.notification-close:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.1);
}

.notification-close i {
  font-size: 16px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

/* Responsive notification */
@media (max-width: 768px) {
  .notification {
    top: 10px;
    right: 10px;
    left: 10px;
    min-width: auto;
    max-width: none;
  }

  .notification-content {
    padding: 12px 16px;
  }

  .notification-content span {
    font-size: 13px;
  }
}

/* Header Actions */
.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.btn-upload {
  background-color: var(--color-buttonter);
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-upload:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 700px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: linear-gradient(90deg, #a6d600 0%, #d5ff5f 100%);
}

.modal-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #2c3e50;
  transition: background-color 0.2s;
}

.modal-close:hover {
  background: rgba(44, 62, 80, 0.1);
}

.modal-close i {
  font-size: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: #f8f9fa;
}

/* Upload Steps */
.upload-step {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.upload-step:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.upload-step h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.upload-step h5 i {
  color: var(--color-buttonter);
}

.upload-step p {
  margin: 0 0 16px 0;
  color: #666;
  line-height: 1.5;
}

.btn-template {
  background: linear-gradient(90deg, #10b981 0%, #34d399 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-template:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* File Upload Area */
.file-upload-area {
  position: relative;
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 32px 20px;
  text-align: center;
  transition: all 0.2s;
  background: #f9fafb;
}

.file-upload-area:hover {
  border-color: var(--color-buttonter);
  background: #f0fff4;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-input:disabled {
  cursor: not-allowed;
}

.file-upload-content i {
  font-size: 48px;
  color: var(--color-buttonter);
  margin-bottom: 12px;
}

.file-upload-content p {
  margin: 8px 0;
  color: #374151;
}

.file-upload-content .file-info {
  font-size: 14px;
  color: #6b7280;
}

/* Upload Loading */
.upload-loading {
  text-align: center;
  padding: 32px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-left-color: var(--color-buttonter);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Upload Results */
.upload-results {
  margin-top: 20px;
}

.upload-results h5 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.results-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.summary-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-weight: 500;
  font-size: 14px;
}

.summary-item.valid,
.summary-item.success {
  background: #f0fdf4;
  color: #166534;
}

.summary-item.error {
  background: #fef2f2;
  color: #991b1b;
}

.valid-data-preview,
.upload-final-results {
  margin: 20px 0;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
}

.valid-data-preview h6,
.upload-final-results h6,
.error-list h6,
.failed-items h6 {
  margin: 0 0 12px 0;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
}

.data-preview-table {
  overflow-x: auto;
}

.data-preview-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.data-preview-table th,
.data-preview-table td {
  padding: 8px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.data-preview-table th {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
}

.preview-note {
  margin: 12px 0 0 0;
  font-size: 13px;
  color: #6b7280;
  font-style: italic;
}

.error-list,
.failed-items {
  margin: 16px 0;
  padding: 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
}

.error-list ul,
.failed-items ul {
  margin: 0;
  padding-left: 20px;
}

.error-list li,
.failed-items li {
  margin: 4px 0;
  color: #991b1b;
  font-size: 14px;
}

.final-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

/* Modal Buttons */
.btn-cancel {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #e5e7eb;
}

.btn-confirm {
  background: var(--color-buttonter);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-confirm:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-confirm:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spin {
  animation: spin 1s linear infinite;
}

/* Responsive Modal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 10px;
  }

  .modal-content {
    max-width: none;
  }

  .modal-header,
  .modal-body,
  .modal-footer {
    padding: 16px;
  }

  .results-summary,
  .final-summary {
    flex-direction: column;
    gap: 8px;
  }

  .header-actions {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .btn-upload,
  .btn-add {
    width: 100%;
    justify-content: center;
  }
}
</style>
