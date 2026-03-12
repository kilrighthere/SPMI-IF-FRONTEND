<template>
  <div class="cpl-pl-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Korelasi CPL - Profil Lulusan</h3>
        <div v-if="isAdmin" class="header-actions">
          <button
            class="btn-save-changes"
            :disabled="!hasChanges || isLoading || isSaving"
            @click="saveChanges"
          >
            <i :class="isSaving ? 'ri-loader-4-line spin-icon' : 'ri-save-line'"></i>
            {{ isSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- CPL-PL Content -->
      <div v-if="!isLoading">
        <p class="description">
          Matriks berikut menunjukkan korelasi antara Capaian Pembelajaran Lulusan (CPL) dengan
          Profil Lulusan (PL). Pilih satu Profil Lulusan untuk setiap CPL.
          <span v-if="isDosen && !isAdmin" class="readonly-notice">
            (Mode Tampilan - Hanya Admin yang dapat mengubah)
          </span>
        </p>

        <div v-if="cplList.length === 0 || plList.length === 0" class="empty-state">
          Belum ada data CPL atau Profil Lulusan.
        </div>

        <!-- Matrix Table -->
        <div v-else class="table-responsive">
          <table class="matrix-table">
            <thead>
              <tr>
                <th class="corner-header">CPL / Profil Lulusan</th>
                <th v-for="pl in plList" :key="pl.kode_pl" class="pl-header">
                  <div class="pl-code">{{ pl.kode_pl }}</div>
                  <!--<div class="pl-desc">{{ pl.deskripsi }}</div>-->
                </th>
                <th class="pl-header none-header">
                  <div class="pl-code">Tidak Ada</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpl in cplList" :key="cpl.id_cpl">
                <td class="cpl-cell">
                  <div class="cpl-code">{{ cpl.id_cpl }}</div>
                  <!--<div class="cpl-desc">{{ cpl.deskripsi }}</div>-->
                </td>
                <td v-for="pl in plList" :key="`${cpl.id_cpl}-${pl.kode_pl}`" class="matrix-cell">
                  <input
                    type="radio"
                    :name="`cpl-${cpl.id_cpl}`"
                    :checked="isRelated(cpl.id_cpl, pl.kode_pl)"
                    @change="selectRelation(cpl.id_cpl, pl.kode_pl)"
                    :disabled="isLoading || isSaving || (isDosen && !isAdmin)"
                  />
                </td>
                <td class="matrix-cell none-cell">
                  <input
                    type="radio"
                    :name="`cpl-${cpl.id_cpl}`"
                    :checked="!hasAnyRelation(cpl.id_cpl)"
                    @change="clearRelation(cpl.id_cpl)"
                    :disabled="isLoading || isSaving || (isDosen && !isAdmin)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <ErrorPopup :message="popupError" @close="clearError" />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useKorelasiCPLPLStore } from '@/stores/korelasiCPLPL'
import { usePermissions } from '@/composables/usePermissions'
import ErrorPopup from '@/components/ErrorPopup.vue'

// Initialize store
const cplPlStore = useKorelasiCPLPLStore()

// Use centralized permissions
const { isAdmin, isDosen, isMahasiswa } = usePermissions()

// Data untuk CPL-PL
const cplList = computed(() => cplPlStore.cplList)
const plList = computed(() => cplPlStore.plList)
const matrixData = computed(() => cplPlStore.matrixData)
const isLoading = computed(() => cplPlStore.isLoading)
const error = computed(() => cplPlStore.error)
const popupError = ref('')
const isSaving = ref(false)
const baseSelection = ref({})
const draftSelection = ref({})

const hasChanges = computed(() => {
  for (const cpl of cplList.value) {
    const cplId = cpl.id_cpl
    if (String(baseSelection.value[cplId] || '') !== String(draftSelection.value[cplId] || '')) {
      return true
    }
  }
  return false
})

const buildSelectionMap = () => {
  const map = {}
  for (const cpl of cplList.value) {
    const cplId = cpl.id_cpl
    map[cplId] = ''
    for (const pl of plList.value) {
      if (matrixData.value[cplId] && matrixData.value[cplId][pl.kode_pl] === true) {
        map[cplId] = pl.kode_pl
        break
      }
    }
  }
  return map
}

const initializeDraft = () => {
  const current = buildSelectionMap()
  baseSelection.value = { ...current }
  draftSelection.value = { ...current }
}

const initializeDraftFromCurrentDraft = () => {
  baseSelection.value = { ...draftSelection.value }
}

// Check if CPL and PL are related
const isRelated = (cplId, plId) => {
  return String(draftSelection.value[cplId] || '') === String(plId)
}

// Check if CPL has any relation to any PL
const hasAnyRelation = (cplId) => {
  return Boolean(draftSelection.value[cplId])
}

// Clear all relations for a CPL
const clearRelation = (cplId) => {
  // Only admin can change the relation
  if (isDosen.value && !isAdmin.value) {
    return
  }

  draftSelection.value = {
    ...draftSelection.value,
    [cplId]: '',
  }
}

// Select relation between CPL and PL (radio button - only one PL per CPL)
const selectRelation = (cplId, plId) => {
  // Only admin can change the relation
  if (isDosen.value && !isAdmin.value) {
    return
  }

  draftSelection.value = {
    ...draftSelection.value,
    [cplId]: plId,
  }
}

const saveChanges = async () => {
  if (!hasChanges.value || isSaving.value) return

  isSaving.value = true
  try {
    for (const cpl of cplList.value) {
      const cplId = cpl.id_cpl
      const oldPl = String(baseSelection.value[cplId] || '')
      const newPl = String(draftSelection.value[cplId] || '')

      if (oldPl === newPl) continue

      if (oldPl) {
        await cplPlStore.toggleRelation(cplId, oldPl, false, {
          skipReload: true,
          silentLoading: true,
        })
      }
      if (newPl) {
        await cplPlStore.toggleRelation(cplId, newPl, true, {
          skipReload: true,
          silentLoading: true,
        })
      }
    }

    // Stop blocking UI immediately after successful submit.
    initializeDraftFromCurrentDraft()

    // Sync latest data in background without flipping the page into loading state.
    cplPlStore
      .fetchAllData({ silentLoading: true })
      .then(() => {
        if (!isSaving.value) initializeDraft()
      })
      .catch(() => {})
  } catch (err) {
    popupError.value = 'Gagal menyimpan perubahan korelasi CPL-PL'
  } finally {
    isSaving.value = false
  }
}

const clearError = () => {
  popupError.value = ''
}

// Load data saat komponen dimuat
onMounted(async () => {
  await cplPlStore.fetchAllData()
  initializeDraft()
})

watch(error, (newError) => {
  if (newError) popupError.value = newError
})

watch(
  [cplList, plList, matrixData],
  () => {
    if (!hasChanges.value && !isSaving.value) {
      initializeDraft()
    }
  },
  { deep: true },
)
</script>

<style scoped>
.cpl-pl-container {
  width: 100%;
  margin: 0 auto;
}

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

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.btn-save-changes {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1.5px solid;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.25s ease;
  font-weight: 600;
  font-size: 14px;
  font-family: 'Montserrat', sans-serif;
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

.btn-save-changes:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border-color: var(--spmi-c-green2);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(116, 183, 8, 0.3);
}

.btn-save-changes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-save-changes i {
  font-size: 16px;
}

.spin-icon {
  animation: spin 1s linear infinite;
}

.section-box h3 {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 0;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.description {
  margin-bottom: 20px;
  color: #6b7280;
  line-height: 1.6;
  font-family: 'Montserrat', sans-serif;
}

.readonly-notice {
  display: inline-block;
  margin-left: 12px;
  padding: 6px 12px;
  background: #fef3c7;
  color: #92400e;
  border-radius: 6px;
  font-size: 0.9em;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
}

.matrix-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  margin-top: 0;
  font-family: 'Montserrat', sans-serif;
}

.matrix-table th,
.matrix-table td {
  padding: 14px 12px;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
  border-right: 1px solid #e5e7eb;
}

.matrix-table th:last-child,
.matrix-table td:last-child {
  border-right: none;
}

.matrix-table tbody tr:last-child td {
  border-bottom: none;
}

.matrix-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
}

.corner-header {
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 300px;
}

.pl-header {
  color: var(--color-text);
  font-weight: 700;
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  min-width: 120px;
  vertical-align: top;
}

.none-header {
  background: #fef3c7;
  color: #92400e;
  border-left: 3px solid #fbbf24;
}

.none-cell {
  background: #fffbeb;
  border-left: 3px solid #fbbf24;
}

.pl-code {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 14px;
}

.pl-desc {
  font-size: 0.8rem;
  color: #6b7280;
  word-break: break-word;
  line-height: 1.4;
}

.cpl-cell {
  background: #f9fafb;
  vertical-align: top;
  font-weight: 700;
  color: var(--color-button);
}

.cpl-code {
  font-weight: 700;
  margin-bottom: 6px;
  font-size: 14px;
}

.cpl-desc {
  font-size: 0.85rem;
  color: #4b5563;
  line-height: 1.4;
}

.matrix-cell {
  text-align: center;
  background: white;
  vertical-align: middle;
  transition: background-color 0.2s ease;
}

.matrix-table tbody tr:hover .matrix-cell {
  background: #faffec;
}

.matrix-table tbody tr:hover .none-cell {
  background: #fef9e6;
}

/* Custom Radio Button Styling */
input[type='radio'] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 22px;
  height: 22px;
  border: 2px solid #d1d5db;
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.25s ease;
  background: white;
}

input[type='radio']:hover:not(:disabled) {
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.1);
  transform: scale(1.1);
}

input[type='radio']:checked {
  border-color: var(--color-button);
  background: var(--color-button);
  box-shadow: 0 0 0 3px rgba(116, 183, 8, 0.2);
}

input[type='radio']:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: white;
}

input[type='radio']:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background: #f3f4f6;
}

input[type='radio']:disabled:checked {
  border-color: #a3e635;
  background: #a3e635;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6b7280;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

.error-message {
  color: #b91c1c;
  background-color: #fee2e2;
  border: 1px solid #fecaca;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-family: 'Montserrat', sans-serif;
}
.empty-state {
  text-align: center;
  padding: 40px;
  color: #9ca3af;
  font-style: italic;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
}

.legend-section {
  margin-top: 24px;
  padding: 20px;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  font-family: 'Montserrat', sans-serif;
}

.legend-section h4 {
  margin-top: 0;
  margin-bottom: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}

.legend-section ul {
  margin: 0;
  padding-left: 24px;
  color: #6b7280;
}

.legend-section li {
  margin-bottom: 8px;
  line-height: 1.6;
}

@media (max-width: 768px) {
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .header-actions {
    width: 100%;
  }

  .btn-save-changes {
    width: 100%;
    justify-content: center;
  }

  .readonly-notice {
    margin-left: 0;
    margin-top: 8px;
  }

  .matrix-table th,
  .matrix-table td {
    padding: 10px 8px;
    font-size: 13px;
  }
}
</style>
