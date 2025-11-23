<template>
  <div class="matrix-map-container">
    <div class="matrix-header">
      <h4>Resource Allocation Matrix - Map View</h4>
      <div class="matrix-controls">
        <div class="zoom-controls">
          <button class="btn-zoom-control" @click="zoomOut" :disabled="zoomLevel <= minZoom">
            <i class="ri-zoom-out-line"></i>
          </button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="btn-zoom-control" @click="zoomIn" :disabled="zoomLevel >= maxZoom">
            <i class="ri-zoom-in-line"></i>
          </button>
          <button class="btn-zoom-control" @click="resetZoom" title="Reset Zoom">
            <i class="ri-focus-3-line"></i>
          </button>
        </div>
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
      class="matrix-viewport"
      ref="viewport"
      @wheel.prevent="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
    >
      <div class="matrix-canvas" :style="canvasStyle" ref="canvas">
        <!-- Y-Axis Labels (CPMK) -->
        <div class="y-axis" :style="yAxisStyle">
          <div
            v-for="(cpmk, index) in cpmkList"
            :key="cpmk.id_cpmk"
            class="y-label"
            :style="getYLabelStyle(index)"
            :title="cpmk.id_cpmk + ': ' + cpmk.deskripsi_cpmk"
          >
            <span class="label-text">{{ cpmk.id_cpmk }}</span>
          </div>
        </div>

        <!-- X-Axis Labels (MK) -->
        <div class="x-axis" :style="xAxisStyle">
          <div
            v-for="(mk, index) in mkList"
            :key="mk.id_mk"
            class="x-label"
            :style="getXLabelStyle(index)"
            :title="mk.kode_mk + ' - ' + mk.nama_mk"
          >
            <span class="label-text">{{ mk.kode_mk }}</span>
          </div>
        </div>

        <!-- Grid Lines -->
        <svg class="grid-lines" :style="gridStyle">
          <!-- Vertical lines -->
          <line
            v-for="(mk, index) in mkList"
            :key="'v-' + mk.id_mk"
            :x1="getCellX(index)"
            y1="0"
            :x2="getCellX(index)"
            :y2="gridHeight"
            class="grid-line"
          />
          <!-- Horizontal lines -->
          <line
            v-for="(cpmk, index) in cpmkList"
            :key="'h-' + cpmk.id_cpmk"
            x1="0"
            :y1="getCellY(index)"
            :x2="gridWidth"
            :y2="getCellY(index)"
            class="grid-line"
          />
        </svg>

        <!-- Allocation Dots -->
        <div class="dots-container" :style="gridStyle">
          <div
            v-for="allocation in allocations"
            :key="allocation.key"
            class="allocation-dot"
            :style="getDotStyle(allocation)"
            :class="{ active: hoveredDot?.key === allocation.key }"
            @mouseenter="handleDotHover(allocation)"
            @mouseleave="handleDotLeave"
            @click="handleDotClick(allocation)"
          ></div>
        </div>

        <!-- Hover Tooltip -->
        <div v-if="hoveredDot" class="dot-tooltip" :style="tooltipStyle">
          <div class="tooltip-header">
            <strong>{{ hoveredDot.cpmk.id_cpmk }}</strong> ×
            <strong>{{ hoveredDot.mk.kode_mk }}</strong>
          </div>
          <div class="tooltip-body">
            <div class="tooltip-item">
              <span class="tooltip-label">CPMK:</span>
              <span class="tooltip-value">{{ hoveredDot.cpmk.deskripsi_cpmk }}</span>
            </div>
            <div class="tooltip-item">
              <span class="tooltip-label">MK:</span>
              <span class="tooltip-value">{{ hoveredDot.mk.nama_mk }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Detail Modal -->
    <CpmkMkDetailModal v-if="isModalVisible" :details="selectedCellDetails" @close="closeModal" />
  </div>
</template>

<script setup>
import { onMounted, computed, ref, reactive, watch } from 'vue'
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

// Zoom functionality
const zoomLevel = ref(1)
const minZoom = 0.3
const maxZoom = 5
const zoomStep = 0.2

// Viewport and canvas
const viewport = ref(null)
const canvas = ref(null)

// Pan functionality
const isPanning = ref(false)
const panStart = reactive({ x: 0, y: 0 })
const panOffset = reactive({ x: 0, y: 0 })

// Hover state
const hoveredDot = ref(null)
const tooltipPosition = reactive({ x: 0, y: 0 })

// Base dimensions
const baseCellSize = 60 // Base cell size in pixels
const labelWidth = 100
const labelHeight = 30

// Calculate grid dimensions
const gridWidth = computed(() => mkList.value.length * baseCellSize * zoomLevel.value)
const gridHeight = computed(() => cpmkList.value.length * baseCellSize * zoomLevel.value)

// Calculate allocations with positions
const allocations = computed(() => {
  const result = []
  props.data.forEach((item) => {
    const cpmkIndex = cpmkList.value.findIndex((c) => c.id_cpmk === item.id_cpmk)
    const mkIndex = mkList.value.findIndex((m) => m.kode_mk === item.id_mk)

    if (cpmkIndex !== -1 && mkIndex !== -1) {
      const cpmk = cpmkList.value[cpmkIndex]
      const mk = mkList.value[mkIndex]
      result.push({
        key: `${item.id_cpmk}-${item.id_mk}`,
        cpmk,
        mk,
        rowIndex: cpmkIndex,
        colIndex: mkIndex,
      })
    }
  })
  return result
})

// Styles
const canvasStyle = computed(() => ({
  transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
  cursor: isPanning.value ? 'grabbing' : 'grab',
}))

const gridStyle = computed(() => ({
  width: `${gridWidth.value}px`,
  height: `${gridHeight.value}px`,
}))

const yAxisStyle = computed(() => ({
  width: `${labelWidth}px`,
  height: `${gridHeight.value}px`,
}))

const xAxisStyle = computed(() => ({
  width: `${gridWidth.value}px`,
  height: `${labelHeight}px`,
}))

const tooltipStyle = computed(() => ({
  left: `${tooltipPosition.x}px`,
  top: `${tooltipPosition.y}px`,
}))

// Methods
const getCellX = (colIndex) => {
  return (colIndex + 0.5) * baseCellSize * zoomLevel.value
}

const getCellY = (rowIndex) => {
  return (rowIndex + 0.5) * baseCellSize * zoomLevel.value
}

const getYLabelStyle = (index) => ({
  top: `${getCellY(index) - labelHeight / 2}px`,
  height: `${labelHeight}px`,
})

const getXLabelStyle = (index) => ({
  left: `${getCellX(index) - labelWidth / 2}px`,
  width: `${labelWidth}px`,
})

const getDotStyle = (allocation) => {
  const size = Math.max(8, Math.min(20, 8 * zoomLevel.value))
  return {
    left: `${getCellX(allocation.colIndex)}px`,
    top: `${getCellY(allocation.rowIndex)}px`,
    width: `${size}px`,
    height: `${size}px`,
    marginLeft: `${-size / 2}px`,
    marginTop: `${-size / 2}px`,
  }
}

const zoomIn = () => {
  if (zoomLevel.value < maxZoom) {
    zoomLevel.value = Math.min(maxZoom, zoomLevel.value + zoomStep)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > minZoom) {
    zoomLevel.value = Math.max(minZoom, zoomLevel.value - zoomStep)
    // Reset pan if zoomed out fully
    if (zoomLevel.value === minZoom) {
      panOffset.x = 0
      panOffset.y = 0
    }
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
  panOffset.x = 0
  panOffset.y = 0
}

const handleWheel = (event) => {
  const delta = -event.deltaY
  if (delta > 0) {
    zoomIn()
  } else {
    zoomOut()
  }
}

const handleMouseDown = (event) => {
  if (zoomLevel.value > 1) {
    isPanning.value = true
    panStart.x = event.clientX - panOffset.x
    panStart.y = event.clientY - panOffset.y
  }
}

const handleMouseMove = (event) => {
  if (isPanning.value) {
    const newX = event.clientX - panStart.x
    const newY = event.clientY - panStart.y

    // Calculate bounds
    const viewportRect = viewport.value.getBoundingClientRect()
    const maxOffsetX = Math.max(0, (gridWidth.value - viewportRect.width) / 2)
    const maxOffsetY = Math.max(0, (gridHeight.value - viewportRect.height) / 2)

    // Clamp pan offset
    panOffset.x = Math.max(-maxOffsetX, Math.min(maxOffsetX, newX))
    panOffset.y = Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))
  }
}

const handleMouseUp = () => {
  isPanning.value = false
}

const handleDotHover = (allocation) => {
  hoveredDot.value = allocation
  // Get dot element position for tooltip
  const dotEl = event.target
  const rect = dotEl.getBoundingClientRect()
  const viewportRect = viewport.value.getBoundingClientRect()
  tooltipPosition.x = rect.left - viewportRect.left + rect.width / 2
  tooltipPosition.y = rect.top - viewportRect.top - 10
}

const handleDotLeave = () => {
  hoveredDot.value = null
}

const handleDotClick = (allocation) => {
  selectedCellDetails.value = {
    cpmk: allocation.cpmk,
    mk: allocation.mk,
  }
  isModalVisible.value = true
}

const closeModal = () => {
  isModalVisible.value = false
  selectedCellDetails.value = null
}

// Watch zoom level to reset pan when at min zoom
watch(zoomLevel, (newZoom) => {
  if (newZoom <= minZoom) {
    panOffset.x = 0
    panOffset.y = 0
  }
})

onMounted(async () => {
  await store.fetchCpmkList()
  await store.fetchMkList()
})
</script>

<style scoped>
.matrix-map-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  font-family: 'Montserrat', sans-serif;
}

.matrix-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-radius: 8px;
  border: 2px solid var(--color-button);
}

.matrix-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.matrix-controls {
  display: flex;
  gap: 20px;
  align-items: center;
}

.zoom-controls {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 5px 10px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.btn-zoom-control {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-button);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 16px;
}

.btn-zoom-control:hover:not(:disabled) {
  background: var(--color-buttonsec);
  color: var(--color-text);
}

.btn-zoom-control:disabled {
  background: #e5e7eb;
  color: #9ca3af;
  cursor: not-allowed;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-weight: 600;
  font-size: 14px;
  color: var(--color-text);
}

.matrix-info {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.matrix-viewport {
  position: relative;
  background: white;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 600px;
  width: 100%;
}

.matrix-canvas {
  position: relative;
  transition: transform 0.1s ease-out;
  will-change: transform;
}

/* Axes */
.y-axis {
  position: absolute;
  left: -100px;
  top: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}

.y-label {
  position: absolute;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 10px;
  color: #0c4a6e;
  font-size: 12px;
  font-weight: 600;
}

.x-axis {
  position: absolute;
  left: 0;
  top: -30px;
  display: flex;
  pointer-events: none;
}

.x-label {
  position: absolute;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #78350f;
  font-size: 12px;
  font-weight: 600;
}

.label-text {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

/* Grid */
.grid-lines {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.grid-line {
  stroke: #e5e7eb;
  stroke-width: 1;
}

/* Dots */
.dots-container {
  position: absolute;
  left: 0;
  top: 0;
}

.allocation-dot {
  position: absolute;
  background: var(--color-button);
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.allocation-dot:hover,
.allocation-dot.active {
  background: var(--color-buttonsec);
  transform: scale(1.5);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

/* Tooltip */
.dot-tooltip {
  position: absolute;
  background: white;
  border: 2px solid var(--color-button);
  border-radius: 8px;
  padding: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  pointer-events: none;
  z-index: 1000;
  min-width: 250px;
  max-width: 350px;
  transform: translate(-50%, -100%);
}

.tooltip-header {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-button);
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.tooltip-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-label {
  font-size: 11px;
  color: #6b7280;
  font-weight: 600;
  text-transform: uppercase;
}

.tooltip-value {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.4;
}

/* Loading and Error */
.loading,
.error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top-color: var(--color-button);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: #dc2626;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .matrix-header {
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }

  .matrix-controls {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
