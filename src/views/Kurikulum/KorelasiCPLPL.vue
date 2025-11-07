<template>
  <div class="cpl-pl-container">
    <div class="section-box">
      <div class="section-header">
        <h3>Korelasi CPL - Profil Lulusan</h3>
      </div>

      <!-- Loading indicator -->
      <div v-if="isLoading" class="loading">Loading...</div>

      <!-- Error message -->
      <div v-if="error" class="error-message">{{ error }}</div>

      <!-- CPL-PL Content -->
      <div v-if="!isLoading && !error">
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
                    :disabled="isLoading || (isDosen && !isAdmin)"
                  />
                </td>
                <td class="matrix-cell none-cell">
                  <input
                    type="radio"
                    :name="`cpl-${cpl.id_cpl}`"
                    :checked="!hasAnyRelation(cpl.id_cpl)"
                    @change="clearRelation(cpl.id_cpl)"
                    :disabled="isLoading || (isDosen && !isAdmin)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useKorelasiCPLPLStore } from '@/stores/korelasiCPLPL'
import { usePermissions } from '@/composables/usePermissions'

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

// Check if CPL and PL are related
const isRelated = (cplId, plId) => {
  // Pastikan kedua id valid dan matriks memiliki entri untuk mereka
  return matrixData.value[cplId] && matrixData.value[cplId][plId] === true
}

// Check if CPL has any relation to any PL
const hasAnyRelation = (cplId) => {
  if (!matrixData.value[cplId]) return false

  return Object.values(matrixData.value[cplId]).some((value) => value === true)
}

// Clear all relations for a CPL
const clearRelation = async (cplId) => {
  // Only admin can change the relation
  if (isDosen.value && !isAdmin.value) {
    return
  }

  try {
    // Uncheck all PL for this CPL
    if (matrixData.value[cplId]) {
      for (const plId in matrixData.value[cplId]) {
        if (matrixData.value[cplId][plId] === true) {
          await cplPlStore.toggleRelation(cplId, plId, false)
        }
      }
    }
  } catch (err) {
    console.error('Error clearing relation:', err)
  }
}

// Select relation between CPL and PL (radio button - only one PL per CPL)
const selectRelation = async (cplId, plId) => {
  // Only admin can change the relation
  if (isDosen.value && !isAdmin.value) {
    return
  }

  try {
    // First, uncheck all PL for this CPL
    if (matrixData.value[cplId]) {
      for (const existingPlId in matrixData.value[cplId]) {
        if (matrixData.value[cplId][existingPlId] === true && existingPlId !== plId) {
          await cplPlStore.toggleRelation(cplId, existingPlId, false)
        }
      }
    }

    // Then, check the selected PL
    await cplPlStore.toggleRelation(cplId, plId, true)
  } catch (err) {
    console.error('Error selecting relation:', err)
  }
}

// Load data saat komponen dimuat
onMounted(async () => {
  await cplPlStore.fetchAllData()
  console.log('CPL List:', cplList.value)
  console.log('PL List:', plList.value)
  console.log('Matrix Data:', matrixData.value)
  console.log('isAdmin:', isAdmin.value)
  console.log('isDosen:', isDosen.value)
})
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
