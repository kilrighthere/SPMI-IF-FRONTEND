<template>
  <div class="matrix-container">
    <h4>Resource Allocation Matrix (CPMK vs MK)</h4>
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div v-else class="matrix">
      <table>
        <thead>
          <tr>
            <th>CPMK</th>
            <th v-for="mk in mkList" :key="mk.id_mk">
              <div class="mk-header">
                <span class="kode-mk">{{ mk.kode_mk }}</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cpmk in cpmkList" :key="cpmk.id_cpmk">
            <td>
              <div class="cpmk-cell">
                <span class="id-cpmk">{{ cpmk.id_cpmk }}</span>
              </div>
            </td>
            <td
              v-for="mk in mkList"
              :key="mk.id_mk"
              :class="getCellClass(cpmk, mk)"
              @click="handleCellClick(cpmk, mk)"
            >
              &nbsp;
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <CpmkMkDetailModal
      v-if="isModalVisible"
      :details="selectedCellDetails"
      @close="closeModal"
    />
  </div>
</template>

<script setup>
import { onMounted, computed, ref } from 'vue'
import { useCpmkMkStore } from '@/stores/cpmkMk'
import CpmkMkDetailModal from './CpmkMkDetailModal.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  }
})

const store = useCpmkMkStore()

const cpmkList = computed(() => store.cpmkList)
const mkList = computed(() => store.mkList)
const loading = computed(() => store.isLoading)
const error = computed(() => store.error)

const isModalVisible = ref(false)
const selectedCellDetails = ref(null)

const isAllocated = (cpmk, mk) => {
  return props.data.some(item => item.id_cpmk === cpmk.id_cpmk && item.id_mk === mk.kode_mk)
}

const getCellClass = (cpmk, mk) => {
  const allocated = isAllocated(cpmk, mk)
  return {
    allocated: allocated,
    clickable: allocated
  }
}

const handleCellClick = (cpmk, mk) => {
  if (isAllocated(cpmk, mk)) {
    selectedCellDetails.value = { cpmk, mk }
    isModalVisible.value = true
  }
}

const closeModal = () => {
  isModalVisible.value = false
  selectedCellDetails.value = null
}

onMounted(async () => {
  await store.fetchCpmkList()
  await store.fetchMkList()
})
</script>

<style scoped>
.matrix-container {
  margin-top: 20px;
  padding: 15px; /* Reduced padding */
  border: 1px solid var(--color-border2);
  border-radius: 10px;
  background-color: var(--color-background);
  font-family: 'Montserrat', sans-serif;
}

.matrix-container h4 {
  font-size: 16px; /* Reduced font size */
  font-weight: 700;
  margin-bottom: 12px; /* Reduced margin */
  color: var(--color-text);
}

.matrix {
  overflow-x: auto; /* Keep for very small screens if needed */
}

.matrix table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  border: 1px solid var(--color-border2);
  border-radius: 10px;
  overflow: hidden;
  table-layout: fixed;
}

.matrix th,
.matrix td {
  border-bottom: 1px solid var(--color-border2);
  padding: 4px; /* Further reduced padding */
  text-align: center;
  font-size: 10px; /* Reduced font size */
  transition: background-color 0.2s ease;
  height: 40px; /* Reduced height */
  width: 40px; /* Reduced width for data cells */
  white-space: nowrap; /* Prevent text wrapping in cells */
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix th:first-child,
.matrix td:first-child {
  width: 80px; /* Reduced width for CPMK ID column */
  text-align: left;
  padding-left: 8px;
}

.matrix th {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  font-weight: 700;
  font-size: 11px; /* Reduced font size */
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: none;
  vertical-align: middle;
}

.mk-header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.kode-mk {
  font-weight: 700;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
}

.cpmk-cell {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  text-align: left;
  height: 100%;
}

.id-cpmk {
  font-weight: 700;
}

.matrix tbody tr:last-child td {
  border-bottom: none;
}

.matrix tbody tr:hover td {
  background-color: #faffec;
}

.matrix td.allocated {
  background-color: var(--spmi-c-green2);
}

.matrix td.allocated:hover {
  background-color: var(--spmi-c-green);
}

.matrix td.clickable {
  cursor: pointer;
}
</style>
