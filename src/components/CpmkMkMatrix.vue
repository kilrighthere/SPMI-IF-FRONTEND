<template>
  <div class="matrix-container">
    <div class="matrix-header">
      <h4>Resource Allocation Matrix (CPMK vs MK)</h4>
      <div class="matrix-controls">
        <button class="btn-zoom" @click="toggleZoomMode" :class="{ active: isZoomMode }">
          <i class="ri-zoom-in-line"></i>
          {{ isZoomMode ? 'Exit Zoom Mode' : 'Zoom Mode' }}
        </button>
        <span class="matrix-info">{{ cpmkList.length }} CPMK × {{ mkList.length }} MK</span>
      </div>
    </div>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Loading matrix...</p>
    </div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <div
      v-else
      class="matrix-wrapper"
      :class="{ 'zoom-mode': isZoomMode }"
      @mousemove="handleMatrixMouseMove"
      @mouseleave="hideMagnifier"
    >
      <div class="matrix-scroll-container">
        <table class="matrix-table" ref="matrixTable">
          <thead>
            <tr>
              <th class="corner-cell">CPMK / MK</th>
              <th v-for="(mk, index) in mkList" :key="mk.id_mk" class="mk-header-cell">
                <div class="mk-header-content">
                  <span class="kode-mk" :title="mk.kode_mk + ' - ' + mk.nama_mk">{{
                    mk.kode_mk
                  }}</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(cpmk, rowIndex) in cpmkList" :key="cpmk.id_cpmk">
              <td class="cpmk-label-cell">
                <div class="cpmk-label-content" :title="cpmk.id_cpmk + ': ' + cpmk.deskripsi_cpmk">
                  <span class="id-cpmk">{{ cpmk.id_cpmk }}</span>
                </div>
              </td>
              <td
                v-for="(mk, colIndex) in mkList"
                :key="mk.id_mk"
                :class="getCellClass(cpmk, mk)"
                @click="!isZoomMode && handleCellClick(cpmk, mk)"
                :data-row="rowIndex"
                :data-col="colIndex"
                :data-cpmk-id="cpmk.id_cpmk"
                :data-mk-code="mk.kode_mk"
                class="matrix-cell"
              >
                <span class="cell-indicator" v-if="isAllocated(cpmk, mk)">●</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Magnifier Modal -->
      <div v-if="isZoomMode && showMagnifier" class="magnifier-modal" :style="magnifierStyle">
        <div class="magnifier-header">
          <i class="ri-search-eye-line"></i>
          <span>Magnifier View</span>
        </div>
        <div class="magnifier-content">
          <table class="magnifier-table">
            <thead>
              <tr>
                <th class="mag-corner">CPMK/MK</th>
                <th v-for="mk in magnifierData.mks" :key="mk.id_mk" class="mag-col-header">
                  <div class="mag-mk-content">
                    <div class="mag-mk-code">{{ mk.kode_mk }}</div>
                    <div class="mag-mk-name">{{ mk.nama_mk }}</div>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cpmk in magnifierData.cpmks" :key="cpmk.id_cpmk">
                <td class="mag-row-header">
                  <div class="mag-cpmk-content">
                    <div class="mag-cpmk-id">{{ cpmk.id_cpmk }}</div>
                    <div class="mag-cpmk-desc">{{ cpmk.deskripsi_cpmk }}</div>
                  </div>
                </td>
                <td
                  v-for="mk in magnifierData.mks"
                  :key="mk.id_mk"
                  :class="getMagnifierCellClass(cpmk, mk)"
                  class="mag-cell"
                >
                  <span v-if="isAllocated(cpmk, mk)" class="mag-indicator">●</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Detail Modal (existing) -->
    <CpmkMkDetailModal v-if="isModalVisible" :details="selectedCellDetails" @close="closeModal" />
  </div>
</template>

<script setup>
import { onMounted, computed, ref, reactive } from 'vue'
import { useCpmkMkStore } from '@/stores/cpmkMk'
import CpmkMkDetailModal from './CpmkMkDetailModal.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true,
  },
})

const store = useCpmkMkStore()

const cpmkList = computed(() => store.cpmkList)
const mkList = computed(() => store.mkList)
const loading = computed(() => store.isLoading)
const error = computed(() => store.error)

// Detail Modal
const isModalVisible = ref(false)
const selectedCellDetails = ref(null)

// Magnifier functionality
const isZoomMode = ref(false)
const showMagnifier = ref(false)
const matrixTable = ref(null)

// Magnifier data
const magnifierData = reactive({
  cpmks: [],
  mks: [],
  centerRow: 0,
  centerCol: 0,
})

const magnifierPosition = reactive({
  x: 0,
  y: 0,
})

const isAllocated = (cpmk, mk) => {
  return props.data.some((item) => item.id_cpmk === cpmk.id_cpmk && item.id_mk === mk.kode_mk)
}

const getCellClass = (cpmk, mk) => {
  const allocated = isAllocated(cpmk, mk)
  return {
    allocated: allocated,
    clickable: !isZoomMode.value && allocated,
  }
}

const getMagnifierCellClass = (cpmk, mk) => {
  const allocated = isAllocated(cpmk, mk)
  return {
    'mag-allocated': allocated,
    'mag-clickable': allocated,
  }
}

const toggleZoomMode = () => {
  isZoomMode.value = !isZoomMode.value
  if (!isZoomMode.value) {
    showMagnifier.value = false
  }
}

const handleMatrixMouseMove = (event) => {
  if (!isZoomMode.value) return

  const target = event.target.closest('td.matrix-cell')
  if (!target) {
    showMagnifier.value = false
    return
  }

  showMagnifier.value = true

  // Get center cell position
  const centerRow = parseInt(target.dataset.row) || 0
  const centerCol = parseInt(target.dataset.col) || 0

  // Calculate magnifier area (5x5 grid around center)
  const range = 2
  const startRow = Math.max(0, centerRow - range)
  const endRow = Math.min(cpmkList.value.length - 1, centerRow + range)
  const startCol = Math.max(0, centerCol - range)
  const endCol = Math.min(mkList.value.length - 1, centerCol + range)

  // Update magnifier data
  magnifierData.cpmks = cpmkList.value.slice(startRow, endRow + 1)
  magnifierData.mks = mkList.value.slice(startCol, endCol + 1)
  magnifierData.centerRow = centerRow
  magnifierData.centerCol = centerCol

  // Update magnifier position (offset from cursor)
  const wrapperRect = event.currentTarget.getBoundingClientRect()
  magnifierPosition.x = event.clientX - wrapperRect.left
  magnifierPosition.y = event.clientY - wrapperRect.top
}

const hideMagnifier = () => {
  showMagnifier.value = false
}

const magnifierStyle = computed(() => {
  const offsetX = 30
  const offsetY = 30

  return {
    left: `${magnifierPosition.x + offsetX}px`,
    top: `${magnifierPosition.y + offsetY}px`,
  }
})

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
.cpmk-mk-matrix {
  padding: 20px;
  height: calc(100vh - 160px);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px 15px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.matrix-controls {
  display: flex;
  gap: 15px;
  align-items: center;
}

.btn-zoom {
  padding: 8px 16px;
  background: var(--color-button);
  color: white;
  border: none;
  border-radius: 6px;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s ease;
}

.btn-zoom:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
}

.btn-zoom.active {
  background: var(--color-buttonsec);
  color: var(--color-text);
  box-shadow: 0 0 0 3px rgba(166, 214, 0, 0.3);
}

.matrix-info {
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  color: #6b7280;
}

.matrix-wrapper {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.matrix-wrapper.zoom-mode {
  cursor: crosshair;
}

.matrix-overflow-x {
  height: 100%;
  overflow: auto;
  padding: 10px;
}

.matrix-table {
  border-collapse: collapse;
  width: 100%;
  background: white;
  font-family: 'Montserrat', sans-serif;
  table-layout: fixed;
}

.matrix-table th,
.matrix-table td {
  border: 1px solid #e5e7eb;
  padding: 4px;
  text-align: center;
  font-size: 11px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.matrix-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-button) 100%);
}

.matrix-table th {
  color: white;
  font-weight: 600;
  position: sticky;
  top: 0;
  z-index: 2;
}

.corner-cell {
  background: rgba(255, 255, 255, 0.2) !important;
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 3;
}

.row-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  font-weight: 600;
  position: sticky;
  left: 0;
  z-index: 1;
  text-align: left;
  padding-left: 8px;
  color: #0c4a6e;
  border-right: 2px solid #0ea5e9;
}

.col-header {
  padding: 6px 4px;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  font-weight: 600;
  color: #78350f;
  border-bottom: 2px solid #f59e0b;
}

.matrix-cell {
  cursor: default;
  position: relative;
  height: 35px;
  min-width: 40px;
}

.matrix-cell.allocated {
  background: var(--color-button);
  color: white;
  font-weight: 600;
}

.matrix-cell.clickable {
  cursor: pointer;
}

.matrix-cell.clickable:hover {
  background: var(--color-buttonsec);
  color: var(--color-text);
}

/* Magnifier Modal */
.magnifier-modal {
  position: absolute;
  width: 400px;
  background: white;
  border-radius: 12px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.3),
    0 0 0 3px var(--color-button);
  z-index: 1000;
  pointer-events: none;
  font-family: 'Montserrat', sans-serif;
  overflow: hidden;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.magnifier-header {
  padding: 12px 15px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-button) 100%);
  color: white;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.magnifier-header i {
  font-size: 18px;
}

.magnifier-content {
  padding: 10px;
  max-height: 500px;
  overflow: auto;
  background: #f9fafb;
}

.magnifier-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
}

.magnifier-table th,
.magnifier-table td {
  border: 2px solid #e5e7eb;
  padding: 10px;
  text-align: center;
  font-size: 12px;
}

.magnifier-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-button) 100%);
}

.magnifier-table th {
  color: white;
  font-weight: 600;
}

.mag-corner {
  background: rgba(255, 255, 255, 0.2) !important;
  font-size: 11px;
  padding: 8px 5px;
}

.mag-col-header {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) !important;
  color: #78350f;
  border-bottom: 3px solid #f59e0b;
  min-width: 80px;
}

.mag-mk-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mag-mk-code {
  font-size: 13px;
  font-weight: 700;
  color: #92400e;
}

.mag-mk-name {
  font-size: 10px;
  font-weight: 500;
  color: #78350f;
  line-height: 1.2;
  max-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mag-row-header {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%) !important;
  color: #0c4a6e;
  border-right: 3px solid #0ea5e9;
  text-align: left;
  min-width: 120px;
}

.mag-cpmk-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mag-cpmk-id {
  font-size: 13px;
  font-weight: 700;
  color: #0c4a6e;
}

.mag-cpmk-desc {
  font-size: 10px;
  font-weight: 500;
  color: #075985;
  line-height: 1.2;
  max-height: 30px;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
}

.mag-cell {
  width: 60px;
  height: 60px;
  position: relative;
  cursor: default;
}

.mag-cell.mag-allocated {
  background: var(--color-button);
}

.mag-indicator {
  font-size: 28px;
  color: white;
  font-weight: 700;
}

.loading-container,
.error-container {
  padding: 40px;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
}

.error-container {
  color: #dc2626;
}
</style>
