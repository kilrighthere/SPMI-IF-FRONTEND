<template>
  <div class="cpl-bk-container">
    <!-- Page Header -->
    <div class="page-title">
      <h2>Korelasi CPL dengan Bahan Kajian</h2>
      <p class="subtitle">
        Memetakan hubungan antara Capaian Pembelajaran Lulusan (CPL) dan Bahan Kajian (BK)
      </p>
    </div>

    <!-- Success Message -->
    <div v-if="successMessage" class="alert alert-success">
      <i class="ri-checkbox-circle-line"></i>
      <span>{{ successMessage }}</span>
    </div>

    <!-- Error Message -->
    <div v-if="error" class="alert alert-error">
      <i class="ri-error-warning-line"></i>
      <span>{{ error }}</span>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <i class="ri-loader-4-line spin-icon"></i>
      <span>Memuat data korelasi CPL-BK...</span>
    </div>

    <!-- All roles can view -->
    <div v-if="!isLoading" class="content-section">
      <!-- Info Card -->
      <div class="info-card">
        <div class="info-header">
          <i class="ri-information-line"></i>
          <h3>Petunjuk Penggunaan</h3>
        </div>
        <div class="info-body">
          <p>
            Centang kotak untuk menandakan adanya korelasi antara CPL dan Bahan Kajian. Satu CPL
            dapat terkait dengan beberapa BK, dan sebaliknya.
          </p>
          <div class="legend">
            <span class="legend-label">Legenda:</span>
            <div class="legend-items">
              <div class="legend-item">
                <span class="legend-box checked"></span>
                <span>Terkait</span>
              </div>
              <div class="legend-item">
                <span class="legend-box"></span>
                <span>Tidak terkait</span>
              </div>
            </div>
          </div>
          <div v-if="can('cplBk', 'edit')" class="info-note">
            <i class="ri-edit-line"></i>
            <span
              >Anda dapat mengubah korelasi dengan mencentang/membatalkan centang kotak, lalu klik
              "Simpan Perubahan".</span
            >
          </div>
          <div v-else class="info-note view-only">
            <i class="ri-eye-line"></i>
            <span>Anda hanya dapat melihat data pada halaman ini (mode baca saja).</span>
          </div>
        </div>
      </div>

      <!-- Table Section -->
      <div class="table-section">
        <div class="table-header">
          <div class="table-title">
            <i class="ri-table-line"></i>
            <h3>Matriks Korelasi CPL - BK</h3>
          </div>
          <button
            v-if="can('cplBk', 'edit')"
            class="btn-save"
            @click="saveChanges"
            :disabled="isLoading"
          >
            <i class="ri-save-line"></i>
            {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sticky-col">
                  <div class="th-content">Capaian Pembelajaran Lulusan (CPL)</div>
                </th>
                <th v-for="bk in bkList" :key="bk.id_bk" class="bk-col">
                  <div class="th-content" :title="bk.deskripsi || bk.id_bk">
                    {{ bk.kode_bk || bk.id_bk }}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="cplList.length === 0">
                <td :colspan="bkList.length + 1" class="empty-cell">
                  <div class="empty-state-inline">
                    <i class="ri-inbox-line"></i>
                    <span>Belum ada data CPL pada kurikulum ini</span>
                  </div>
                </td>
              </tr>
              <tr v-for="cpl in cplList" :key="cpl.id_cpl" class="table-row">
                <td class="sticky-col">
                  <div class="cpl-info">
                    <span class="cpl-code">{{ cpl.kode_cpl || cpl.id_cpl }}</span>
                    <span class="cpl-count">
                      <i class="ri-links-line"></i>
                      {{ getCount(cpl.id_cpl) }} BK
                    </span>
                  </div>
                </td>
                <td v-for="bk in bkList" :key="bk.id_bk" class="checkbox-cell">
                  <label class="checkbox-wrapper">
                    <input
                      type="checkbox"
                      class="custom-checkbox"
                      :checked="
                        matrixState[cpl.id_cpl] && matrixState[cpl.id_cpl].has(String(bk.id_bk))
                      "
                      :disabled="!can('cplBk', 'edit')"
                      :aria-label="`Korelasi ${cpl.kode_cpl || cpl.id_cpl} dengan ${bk.deskripsi || bk.id_bk}`"
                      :title="`Korelasi ${cpl.kode_cpl || cpl.id_cpl} ↔ ${bk.deskripsi || bk.id_bk}`"
                      @change="handleCheckboxChange(cpl.id_cpl, bk.id_bk, $event)"
                    />
                    <span class="checkmark"></span>
                  </label>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Access Denied State -->
    <div v-else-if="!isLoading" class="access-denied">
      <i class="ri-lock-line"></i>
      <h3>Akses Ditolak</h3>
      <p>Anda tidak memiliki akses ke halaman ini.</p>
      <p class="hint">Halaman ini hanya dapat dilihat oleh dosen atau administrator.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useCplBkStore } from '@/stores/cplBk'
import { usePermissions } from '@/composables/usePermissions'

const route = useRoute()
const store = useCplBkStore()
const { isAdmin, isDosen, can } = usePermissions()

const cplList = computed(() => store.cplList)
const bkList = computed(() => store.bkList)
const associations = computed(() => store.items)
const isLoading = computed(() => store.isLoading)
const error = computed(() => store.error)

const successMessage = ref('')
const idKurikulum = ref(null)

// Reactive state for the matrix of checkboxes
const matrixState = ref({})

// Watch for the initial data load from the store and populate the matrixState
watch(
  associations,
  (newAssociations) => {
    const newMatrixState = {}
    cplList.value.forEach((cpl) => {
      newMatrixState[cpl.id_cpl] = new Set()
    })
    newAssociations.forEach((assoc) => {
      if (newMatrixState[assoc.id_cpl]) {
        newMatrixState[assoc.id_cpl].add(String(assoc.id_bk))
      }
    })
    matrixState.value = newMatrixState
  },
  { deep: true },
)

onMounted(() => {
  idKurikulum.value = route.params.id
  // All roles can view, just different permission for editing

  if (idKurikulum.value) {
    store.fetchAll()
  } else {
    store.error = 'ID Kurikulum tidak ditemukan di parameter URL.'
    console.error('ID Kurikulum tidak ditemukan di URL.')
  }
})

const handleCheckboxChange = (cplId, bkId, event) => {
  if (!can('cplBk', 'edit')) return

  const isChecked = event.target.checked
  if (!matrixState.value[cplId]) {
    matrixState.value[cplId] = new Set()
  }

  if (isChecked) {
    matrixState.value[cplId].add(String(bkId))
  } else {
    matrixState.value[cplId].delete(String(bkId))
  }
}

const saveChanges = async () => {
  if (!can('cplBk', 'edit')) return

  const payload = { associations: [] }
  for (const cplId in matrixState.value) {
    matrixState.value[cplId].forEach((bkId) => {
      // Keep id_cpl as string (e.g., "CPL-06") because that's how API returns it
      // Convert id_bk to number if possible (many APIs expect integer id for BK)
      payload.associations.push({ id_cpl: cplId, id_bk: String(bkId) })
    })
  }

  try {
    await store.updateCplBk(payload)

    successMessage.value = 'Data korelasi CPL-BK berhasil diperbarui.'
    setTimeout(() => {
      successMessage.value = ''
    }, 3000)
  } catch (err) {
    // error is already set by the store, so we just log it
    console.error('Gagal menyimpan data:', err)
  }
}

const getCount = (cplId) => {
  if (!matrixState.value[cplId]) return 0
  return matrixState.value[cplId].size
}
</script>

<style scoped>
/* Container */
.cpl-bk-container {
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

/* Alerts */
.alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-radius: 12px;
  margin-bottom: 20px;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
}

.alert i {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 1.5px solid #a7f3d0;
  color: #065f46;
}

.alert-error {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  border: 1.5px solid #fca5a5;
  color: #991b1b;
}

/* Loading State */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  font-size: 16px;
}

.loading-state i {
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

/* Content Section */
.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Info Card */
.info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.info-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-bottom: 2px solid #bbf7d0;
}

.info-header i {
  font-size: 24px;
  color: #15803d;
}

.info-header h3 {
  font-size: 16px;
  font-weight: 700;
  color: #15803d;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.info-body {
  padding: 20px 24px;
}

.info-body p {
  font-size: 14px;
  color: var(--color-text);
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.legend {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 16px;
}

.legend-label {
  font-weight: 600;
  font-size: 13px;
  color: var(--color-text);
}

.legend-items {
  display: flex;
  gap: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #6b7280;
}
.legend-box {
  width: 16px;
  height: 16px;
  border: 2px solid #d1d5db;
  border-radius: 4px;
  flex-shrink: 0;
}

.legend-box.checked {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
  position: relative;
}

.legend-box.checked::after {
  content: '✓';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: var(--spmi-c-dgray);
  font-size: 11px;
  font-weight: 700;
}

.info-note {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  border-radius: 10px;
  font-size: 13px;
  color: #1e40af;
  margin-top: 12px;
}

.info-note.view-only {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.info-note i {
  font-size: 18px;
  flex-shrink: 0;
}

/* Table Section */
.table-section {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: #f9fafb;
  border-bottom: 2px solid #e5e7eb;
}

.table-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-title i {
  font-size: 24px;
  color: var(--spmi-c-green2);
}

.table-title h3 {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  font-family: 'Montserrat', sans-serif;
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
  font-weight: 700;
  color: var(--spmi-c-dgray);
  border: none;
}

.th-content {
  padding: 16px 20px;
  display: flex;
  align-items: center;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.bk-col .th-content {
  justify-content: center;
  white-space: nowrap;
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

.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 5;
  min-width: 280px;
  border-right: 2px solid #e5e7eb;
}

.data-table thead .sticky-col {
  z-index: 11;
}

.data-table tbody tr:hover .sticky-col {
  background-color: #f9fafb;
}

.cpl-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
}

.cpl-code {
  font-weight: 700;
  font-size: 14px;
  color: var(--spmi-c-dgray);
}

.cpl-count {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.cpl-count i {
  font-size: 14px;
}

.checkbox-cell {
  text-align: center;
  padding: 16px 20px;
}

/* Custom Checkbox */
.checkbox-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

.custom-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  width: 0;
  height: 0;
}

.checkmark {
  display: inline-block;
  width: 22px;
  height: 22px;
  border: 2px solid #d1d5db;
  border-radius: 6px;
  background: white;
  transition: all 0.3s ease;
  position: relative;
}

.custom-checkbox:hover ~ .checkmark {
  border-color: var(--spmi-c-green2);
}

.custom-checkbox:checked ~ .checkmark {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--spmi-c-green2);
}

.custom-checkbox:checked ~ .checkmark::after {
  content: '';
  position: absolute;
  left: 7px;
  top: 3px;
  width: 5px;
  height: 10px;
  border: solid var(--spmi-c-dgray);
  border-width: 0 2.5px 2.5px 0;
  transform: rotate(45deg);
}

.custom-checkbox:disabled ~ .checkmark {
  opacity: 0.5;
  cursor: not-allowed;
}

.checkbox-wrapper:has(.custom-checkbox:disabled) {
  cursor: not-allowed;
}

/* Empty States */
.empty-cell {
  padding: 64px 24px !important;
  text-align: center;
}

.empty-state-inline {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #9ca3af;
}

.empty-state-inline i {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state-inline span {
  font-size: 14px;
}
/* Save Button */
.btn-save {
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

.btn-save i {
  font-size: 16px;
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

/* Access Denied */
.access-denied {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 64px 24px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  text-align: center;
}

.access-denied i {
  font-size: 64px;
  color: #dc2626;
  opacity: 0.7;
}

.access-denied h3 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0;
  font-family: 'Montserrat', sans-serif;
}

.access-denied p {
  font-size: 14px;
  color: #6b7280;
  margin: 0;
}

.access-denied .hint {
  font-size: 13px;
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 1024px) {
  .table-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .btn-save {
    width: 100%;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .page-title h2 {
    font-size: 24px;
  }

  .info-card,
  .table-section {
    border-radius: 12px;
  }

  .info-header,
  .info-body,
  .table-header {
    padding: 16px 20px;
  }

  .legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .legend-items {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }

  .sticky-col {
    min-width: 200px;
  }

  .th-content,
  .cpl-info {
    padding: 12px 16px;
  }
}
</style>
