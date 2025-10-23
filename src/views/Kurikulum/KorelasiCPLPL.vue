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
          Profil Lulusan (PL). Centang kotak untuk mengalokasikan CPL ke Profil Lulusan tertentu.
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
                    type="checkbox" 
                    :checked="isRelated(cpl.id_cpl, pl.kode_pl)" 
                    @change="toggleRelation(cpl.id_cpl, pl.kode_pl, $event.target.checked)"
                    :disabled="isLoading"
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

// Initialize store
const cplPlStore = useKorelasiCPLPLStore()

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

// Toggle relation between CPL and PL
const toggleRelation = async (cplId, plId, isChecked) => {
  try {
    await cplPlStore.toggleRelation(cplId, plId, isChecked)
  } catch (err) {
    console.error('Error toggling relation:', err)
  }
}

// Load data saat komponen dimuat
onMounted(() => {
  cplPlStore.fetchAllData()
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
}

input[type="checkbox"] {
  transform: scale(1.3);
  cursor: pointer;
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