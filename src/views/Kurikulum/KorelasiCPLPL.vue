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
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-box h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0;
  color: var(--color-button);
}

.description {
  margin-bottom: 20px;
  color: #555;
}

.readonly-notice {
  display: inline-block;
  margin-left: 10px;
  padding: 4px 8px;
  background-color: #fff3cd;
  color: #856404;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: 500;
}

.table-responsive {
  overflow-x: auto;
  margin-bottom: 20px;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 15px;
}

.matrix-table th,
.matrix-table td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}

.corner-header {
  background-color: #f5f5f5;
  font-weight: bold;
  min-width: 300px;
}

.pl-header {
  background-color: #f5f5f5;
  font-weight: bold;
  min-width: 120px;
  vertical-align: top;
}

.none-header {
  background-color: #fff3cd;
  border-left: 2px solid #ffc107;
}

.none-cell {
  background-color: #fffbf0;
  border-left: 2px solid #ffc107;
}

.pl-code {
  font-weight: bold;
  margin-bottom: 5px;
}

.pl-desc {
  font-size: 0.8rem;
  color: #555;
  word-break: break-word;
}

.cpl-cell {
  background-color: #f9f9f9;
  vertical-align: top;
}

.cpl-code {
  font-weight: bold;
  margin-bottom: 5px;
}

.cpl-desc {
  font-size: 0.85rem;
  color: #333;
}

.matrix-cell {
  text-align: center;
  background-color: #ffffff;
  vertical-align: middle;
  transition: background-color 0.2s ease;
}

/* .matrix-cell:has(input[type='radio']:checked) {
  background-color: #e8f5e9;
}

.none-cell:has(input[type='radio']:checked) {
  background-color: #fff9e6;
} */

/* Custom Radio Button Styling */
input[type='radio'] {
  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid #ccc;
  border-radius: 50%;
  outline: none;
  cursor: pointer;
  position: relative;
  transition: all 0.3s ease;
  background-color: white;
}

input[type='radio']:hover:not(:disabled) {
  border-color: #2196f3;
  box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
}

input[type='radio']:checked {
  border-color: var(--color-buttonsec);
  background-color: #4caf50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.2);
}

input[type='radio']:checked::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: white;
}

input[type='radio']:disabled {
  cursor: not-allowed;
  opacity: 0.5;
  background-color: #f5f5f5;
}

input[type='radio']:disabled:checked {
  border-color: #81c784;
  background-color: #81c784;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
}

.legend-section {
  margin-top: 20px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 5px;
  font-size: 0.9rem;
}

.legend-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 1rem;
}

.legend-section ul {
  margin: 0;
  padding-left: 20px;
}
</style>
