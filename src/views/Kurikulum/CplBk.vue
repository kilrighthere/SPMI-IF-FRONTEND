<template>
  <div class="cpl-bk-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Korelasi CPL dengan Bahan Kajian</h3>
        <button v-if="isAdmin" class="btn-save" @click="saveChanges" :disabled="isLoading">
          {{ isLoading ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>

      <!-- Success Message -->
      <div v-if="successMessage" class="success-message">{{ successMessage }}</div>
      <!-- Error Message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <div v-if="isLoading" class="loading">Memuat data...</div>

      <!-- Restrict view to Dosen and Admin -->
      <div v-if="!isLoading && (isAdmin || isDosen)" class="table-responsive">
        <div class="help-legend">
          <p>
            Halaman ini digunakan untuk memetakan hubungan antara Capaian Pembelajaran Lulusan (CPL)
            dan Bahan Kajian (BK). Centang menunjukkan adanya korelasi antara 1 CPL dan 1 BK.
          </p>
          <p class="muted">
            <strong>Legenda:</strong>
            <span class="legend-box checked"></span> = Terkait &nbsp;•&nbsp;
            <span class="legend-box"></span> = Tidak terkait
          </p>
          <p v-if="isAdmin" class="muted">Centang kotak yang sesuai untuk menandakan adanya korelasi lalu klik "Simpan Perubahan".</p>
          <p v-if="isDosen" class="muted">Anda hanya dapat melihat data pada halaman ini.</p>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th class="sticky-col">Capaian Pembelajaran Lulusan (CPL)</th>
              <th v-for="bk in bkList" :key="bk.id_bk" class="text-center" :title="bk.deskripsi || bk.id_bk">
                {{ bk.kode_bk || bk.id_bk }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="cplList.length === 0">
              <td :colspan="bkList.length + 1" class="empty-state">
                Belum ada data CPL pada kurikulum ini.
              </td>
            </tr>
            <tr v-for="cpl in cplList" :key="cpl.id_cpl">
              <td class="sticky-col">
                <strong>{{ cpl.kode_cpl || cpl.id_cpl }}</strong>
                <small class="count">Terkait: {{ getCount(cpl.id_cpl) }} BK</small>
              </td>
              <td v-for="bk in bkList" :key="bk.id_bk" class="text-center">
                  <input
                    type="checkbox"
                    :checked="matrixState[cpl.id_cpl] && matrixState[cpl.id_cpl].has(String(bk.id_bk))"
                    :disabled="!isAdmin"
                    :aria-label="`Korelasi ${cpl.kode_cpl || cpl.id_cpl} dengan ${bk.deskripsi || bk.id_bk}`"
                    :title="`Korelasi ${cpl.kode_cpl || cpl.id_cpl} ↔ ${bk.deskripsi || bk.id_bk}`"
                    @change="handleCheckboxChange(cpl.id_cpl, bk.id_bk, $event)"
                  />
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else-if="!isLoading" class="empty-state" style="padding:20px;">
        <strong>Anda tidak memiliki akses ke halaman ini.</strong>
        <p>Halaman hanya dapat dilihat oleh dosen atau administrator.</p>
      </div>
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
const { isAdmin, isDosen } = usePermissions()

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
watch(associations, (newAssociations) => {
  const newMatrixState = {}
  cplList.value.forEach(cpl => {
    newMatrixState[cpl.id_cpl] = new Set()
  })
    newAssociations.forEach(assoc => {
    if (newMatrixState[assoc.id_cpl]) {
        newMatrixState[assoc.id_cpl].add(String(assoc.id_bk))
    }
  })
  matrixState.value = newMatrixState
}, { deep: true })


onMounted(() => {
  idKurikulum.value = route.params.id
  // Only allow loading if user is Dosen or Admin
  if (!isAdmin.value && !isDosen.value) {
    store.error = 'Akses ditolak.'
    console.error('Akses ke halaman CPL-BK ditolak: bukan dosen atau admin.')
    return
  }

  if (idKurikulum.value) {
    store.fetchAll()
  } else {
    store.error = 'ID Kurikulum tidak ditemukan di parameter URL.'
    console.error('ID Kurikulum tidak ditemukan di URL.')
  }
})

const handleCheckboxChange = (cplId, bkId, event) => {
  if (!isAdmin.value) return
  
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
  if (!isAdmin.value) return

  const payload = { associations: [] }
  for (const cplId in matrixState.value) {
    matrixState.value[cplId].forEach(bkId => {
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
.cpl-bk-container {
  width: 100%;
  margin: 0 auto;
}
.section-box {
  background: white;
  border-radius: 10px;
  padding: 24px;
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
.table-responsive {
  overflow-x: auto;
}
.data-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  font-family: 'Montserrat', sans-serif;
}
.data-table th,
.data-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}
.data-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}
.data-table th {
  color: var(--color-text);
  font-weight: 700;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  white-space: nowrap;
}
.data-table tbody tr:last-child td {
  border-bottom: none;
}
.data-table tbody tr:hover {
  background-color: #f9fafb;
}
.sticky-col {
  position: sticky;
  left: 0;
  background: white;
  z-index: 1;
  min-width: 250px;
  border-right: 1px solid #e5e7eb;
}
.data-table thead .sticky-col {
    z-index: 2;
}
.data-table tbody tr:hover .sticky-col {
  background-color: #f9fafb;
}
.sticky-col p {
  font-size: 12px;
  color: #6b7280;
  margin: 4px 0 0;
  white-space: normal;
}
.text-center {
  text-align: center;
}
input[type='checkbox'] {
  width: 18px;
  height: 18px;
  cursor: pointer;
}
input[type='checkbox']:disabled {
  cursor: not-allowed;
  opacity: 0.7;
}
.btn-save {
  background: var(--color-button);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: all 0.25s ease;
}
.btn-save:hover:not(:disabled) {
  background: var(--color-buttonsec);
  color: var(--color-text);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}
.btn-save:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
.loading,
.empty-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
}
.error-message, .success-message {
  color: #b91c1c;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 8px;
  margin: 20px 0;
}
.success-message {
  color: #047857;
  background-color: #d1fae5;
  border-color: #a7f3d0;
}
.help-legend {
  margin-bottom: 8px;
}
.help-legend .muted {
  color: #6b7280;
  font-size: 13px;
}
.legend-box {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 1px solid #c0c0c0;
  vertical-align: middle;
  margin-right: 6px;
}
.legend-box.checked {
  background: var(--color-button);
  border-color: var(--color-button);
}
.count {
  display: block;
  margin-top: 8px;
  color: #6b7280;
  font-size: 12px;
}
</style>
