<template>
  <div class="graph-container">
    <!-- Header / Controls -->
    <div class="graph-header">
      <div class="header-left">
        <h4>Visualisasi Relasi CPMK - Mata Kuliah</h4>
        <span class="subtitle">{{ cpmkList.length }} CPMK terhubung ke {{ mkList.length }} MK</span>
      </div>
      
      <div class="header-controls">
        <div class="search-box">
          <i class="ri-search-line search-icon"></i>
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Cari Kode/Nama..." 
            class="search-input"
          />
        </div>
        <div class="view-toggles">
           <button 
            class="toggle-btn" 
            :class="{ active: !showAllLines }" 
            @click="showAllLines = !showAllLines"
            title="Sembunyikan garis yang tidak aktif agar lebih bersih"
          >
            <i :class="showAllLines ? 'ri-eye-line' : 'ri-eye-off-line'"></i>
            {{ showAllLines ? 'Semua Garis' : 'Fokus Mode' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Memuat data relasi...</p>
    </div>

    <div v-else class="graph-body" ref="graphBody">
      <!-- Kolom Kiri: CPMK -->
      <div class="column cpmk-column">
        <div class="column-header">CPMK (Capaian Pembelajaran)</div>
        <div class="list-container">
          <div 
            v-for="(cpmk, index) in filteredCpmk" 
            :key="cpmk.id_cpmk"
            class="item-card cpmk-card"
            :class="{ 
              'active': hoveredId === cpmk.id_cpmk,
              'dimmed': hoveredId && hoveredId !== cpmk.id_cpmk && !isConnected(cpmk.id_cpmk, 'cpmk')
            }"
            @mouseenter="setHover(cpmk.id_cpmk, 'cpmk')"
            @mouseleave="clearHover"
            :ref="el => setItemRef(el, 'cpmk', cpmk.id_cpmk)"
          >
            <div class="item-code">{{ cpmk.id_cpmk }}</div>
            <div class="item-desc">{{ cpmk.deskripsi_cpmk }}</div>
            <div class="connector-dot right"></div>
          </div>
        </div>
      </div>

      <!-- Kolom Tengah: SVG Lines -->
      <div class="svg-container">
        <svg class="relationship-svg" :height="svgHeight" width="100%">
          <defs>
            <linearGradient id="grad-line" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:var(--color-button);stop-opacity:1" />
              <stop offset="100%" style="stop-color:var(--color-buttonsec);stop-opacity:1" />
            </linearGradient>
          </defs>

          <!-- Render Garis -->
          <path
            v-for="link in visibleLinks"
            :key="link.id"
            :d="link.path"
            class="relation-line"
            :class="{
              'active': isLineActive(link),
              'hidden': !showAllLines && !isLineActive(link) && hoveredId
            }"
            :stroke-width="isLineActive(link) ? 3 : 1"
          />
        </svg>
      </div>

      <!-- Kolom Kanan: MK -->
      <div class="column mk-column">
        <div class="column-header">Mata Kuliah</div>
        <div class="list-container">
          <div 
            v-for="(mk, index) in filteredMk" 
            :key="mk.id_mk"
            class="item-card mk-card"
            :class="{ 
              'active': hoveredId === mk.kode_mk,
              'dimmed': hoveredId && hoveredId !== mk.kode_mk && !isConnected(mk.kode_mk, 'mk')
            }"
            @mouseenter="setHover(mk.kode_mk, 'mk')"
            @mouseleave="clearHover"
            :ref="el => setItemRef(el, 'mk', mk.kode_mk)"
          >
            <div class="connector-dot left"></div>
            <div class="item-content">
              <div class="item-code">{{ mk.kode_mk }}</div>
              <div class="item-desc">{{ mk.nama_mk }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Floating Detail (Optional) -->
    <div v-if="hoveredId" class="status-bar">
      <i class="ri-information-line"></i>
      <span v-if="hoverType === 'cpmk'">
        CPMK <strong>{{ hoveredId }}</strong> terhubung ke <strong>{{ getConnectionCount(hoveredId, 'cpmk') }}</strong> Mata Kuliah
      </span>
      <span v-else>
        MK <strong>{{ hoveredId }}</strong> memenuhi <strong>{{ getConnectionCount(hoveredId, 'mk') }}</strong> CPMK
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useCpmkMkStore } from '@/stores/cpmkMk'

const props = defineProps({
  data: { type: Array, required: true } // Data allocations {id_cpmk, id_mk}
})

const store = useCpmkMkStore()
const loading = computed(() => store.isLoading)
const searchQuery = ref('')
const showAllLines = ref(true)

// State untuk interaksi
const hoveredId = ref(null)
const hoverType = ref(null) // 'cpmk' or 'mk'

// Refs untuk elemen DOM guna kalkulasi posisi garis
const itemRefs = ref({ cpmk: {}, mk: {} })
const graphBody = ref(null)
const svgHeight = ref(600) // Default, akan dikalkulasi ulang

// Data Preparation
const cpmkList = computed(() => store.cpmkList)
const mkList = computed(() => store.mkList)

// Filter Data
const filteredCpmk = computed(() => {
  if (!searchQuery.value) return cpmkList.value
  const q = searchQuery.value.toLowerCase()
  return cpmkList.value.filter(c => 
    c.id_cpmk.toLowerCase().includes(q) || 
    c.deskripsi_cpmk.toLowerCase().includes(q)
  )
})

const filteredMk = computed(() => {
  if (!searchQuery.value) return mkList.value
  const q = searchQuery.value.toLowerCase()
  return mkList.value.filter(m => 
    m.kode_mk.toLowerCase().includes(q) || 
    m.nama_mk.toLowerCase().includes(q)
  )
})

// Mapping Links (Garis)
// Kita perlu koordinat Y dari setiap item setelah dirender
const coordinates = ref({ cpmk: {}, mk: {} })

const updateCoordinates = () => {
  if (!graphBody.value) return
  
  const bodyRect = graphBody.value.getBoundingClientRect()
  let maxH = 0

  // Get CPMK Y centers
  filteredCpmk.value.forEach(c => {
    const el = itemRefs.value.cpmk[c.id_cpmk]
    if (el) {
      const rect = el.getBoundingClientRect()
      coordinates.value.cpmk[c.id_cpmk] = (rect.top - bodyRect.top) + (rect.height / 2)
      maxH = Math.max(maxH, (rect.top - bodyRect.top) + rect.height)
    }
  })

  // Get MK Y centers
  filteredMk.value.forEach(m => {
    const el = itemRefs.value.mk[m.kode_mk] // Note: Using kode_mk as key based on your props usage
    if (el) {
      const rect = el.getBoundingClientRect()
      coordinates.value.mk[m.kode_mk] = (rect.top - bodyRect.top) + (rect.height / 2)
      maxH = Math.max(maxH, (rect.top - bodyRect.top) + rect.height)
    }
  })
  
  // Update SVG height agar bisa scroll container
  svgHeight.value = Math.max(600, maxH + 50)
}

const visibleLinks = computed(() => {
  const links = []
  if (Object.keys(coordinates.value.cpmk).length === 0) return []

  props.data.forEach((alloc, idx) => {
    // Hanya gambar jika kedua node ada (setelah filter)
    const y1 = coordinates.value.cpmk[alloc.id_cpmk]
    const y2 = coordinates.value.mk[alloc.id_mk]

    if (y1 !== undefined && y2 !== undefined) {
      // Bezier Curve Calculation
      // M 0 y1 C 50% y1, 50% y2, 100% y2
      // Menggunakan curvature 0.5 (50%)
      links.push({
        id: `link-${idx}`,
        cpmk: alloc.id_cpmk,
        mk: alloc.id_mk,
        path: `M 0 ${y1} C 150 ${y1}, 150 ${y2}, 300 ${y2}` // 300 adalah lebar SVG container estimasi, akan di scaling CSS
      })
    }
  })
  return links
})

// Helpers
const setItemRef = (el, type, id) => {
  if (el) itemRefs.value[type][id] = el
}

const setHover = (id, type) => {
  hoveredId.value = id
  hoverType.value = type
}

const clearHover = () => {
  hoveredId.value = null
  hoverType.value = null
}

const isLineActive = (link) => {
  if (!hoveredId.value) return false
  if (hoverType.value === 'cpmk') return link.cpmk === hoveredId.value
  if (hoverType.value === 'mk') return link.mk === hoveredId.value
  return false
}

const isConnected = (targetId, targetType) => {
  if (!hoveredId.value) return false
  
  if (hoverType.value === 'cpmk' && targetType === 'mk') {
    // Check if this MK is connected to hovered CPMK
    return props.data.some(d => d.id_cpmk === hoveredId.value && d.id_mk === targetId)
  }
  
  if (hoverType.value === 'mk' && targetType === 'cpmk') {
    // Check if this CPMK is connected to hovered MK
    return props.data.some(d => d.id_mk === hoveredId.value && d.id_cpmk === targetId)
  }
  
  return false
}

const getConnectionCount = (id, type) => {
  if (type === 'cpmk') return props.data.filter(d => d.id_cpmk === id).length
  return props.data.filter(d => d.id_mk === id).length
}

// Lifecycle
onMounted(async () => {
  await store.fetchCpmkList()
  await store.fetchMkList()
  // Tunggu DOM render kartu sebelum hitung koordinat
  nextTick(() => {
    updateCoordinates()
    // Recalculate on resize
    window.addEventListener('resize', updateCoordinates)
  })
})

// Re-calculate when filter changes
watch([searchQuery, cpmkList, mkList], () => {
  nextTick(updateCoordinates)
})
</script>

<style scoped>
.graph-container {
  display: flex;
  flex-direction: column;
  height: 85vh; /* Mengisi layar */
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
  overflow: hidden;
  font-family: 'Montserrat', sans-serif;
  position: relative;
}

/* Header */
.graph-header {
  padding: 16px 24px;
  background: linear-gradient(to right, #f0fdf4, #fff);
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
}

.header-left h4 {
  margin: 0;
  color: #1f2937;
  font-weight: 700;
  font-size: 1.1rem;
}

.subtitle {
  font-size: 0.85rem;
  color: #6b7280;
}

.header-controls {
  display: flex;
  gap: 12px;
}

/* Search */
.search-box {
  position: relative;
  width: 250px;
}
.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: #9ca3af;
}
.search-input {
  width: 100%;
  padding: 8px 10px 8px 36px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}
.search-input:focus {
  border-color: var(--color-button);
}

.toggle-btn {
  background: white;
  border: 1px solid #e5e7eb;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 6px;
  color: #4b5563;
  transition: all 0.2s;
}
.toggle-btn.active {
  background: var(--color-button);
  color: white;
  border-color: var(--color-button);
}

/* Main Body */
.graph-body {
  flex: 1;
  display: flex;
  overflow-y: auto; /* Scrollable content */
  position: relative;
  padding: 20px 0;
}

/* Columns */
.column {
  flex: 1;
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  min-width: 280px;
  max-width: 350px;
  z-index: 2; /* Above SVG */
}

.column-header {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  text-transform: uppercase;
  font-size: 0.8rem;
  letter-spacing: 0.05em;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 8px;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 40px;
}

/* Cards */
.item-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  display: flex;
  align-items: center;
}

.item-card:hover {
  border-color: var(--color-button);
  transform: translateX(2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.item-card.active {
  background: var(--color-button);
  border-color: var(--color-button);
  color: white;
  transform: scale(1.02);
  z-index: 10;
}

.item-card.active .item-desc {
  color: rgba(255,255,255,0.9);
}
.item-card.active .item-code {
  color: white;
}

.item-card.dimmed {
  opacity: 0.3;
  filter: grayscale(1);
}

.item-code {
  font-weight: 700;
  font-size: 0.85rem;
  color: var(--color-button);
  margin-bottom: 2px;
  min-width: 60px;
}

.item-desc {
  font-size: 0.75rem;
  color: #6b7280;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Connector Dots */
.connector-dot {
  width: 8px;
  height: 8px;
  background: #d1d5db;
  border-radius: 50%;
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
.connector-dot.right { right: -4px; }
.connector-dot.left { left: -4px; }
.item-card:hover .connector-dot { background: var(--color-button); }
.item-card.active .connector-dot { background: white; }

/* SVG Area */
.svg-container {
  flex: 1;
  min-width: 150px;
  position: relative;
  pointer-events: none; /* Click through to underlying scroll if needed, though here it's columns */
}

.relationship-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  overflow: visible;
}

.relation-line {
  fill: none;
  stroke: #e5e7eb;
  transition: stroke 0.3s, stroke-width 0.3s, opacity 0.3s;
  opacity: 0.5;
}

.relation-line.active {
  stroke: url(#grad-line); /* Atau var(--color-button) */
  stroke: var(--color-button);
  opacity: 1;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.1));
  z-index: 5;
}

.relation-line.hidden {
  opacity: 0.05;
}

/* Status Bar */
.status-bar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: #1f2937;
  color: white;
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  z-index: 50;
  pointer-events: none;
  animation: slideUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes slideUp {
  from { transform: translate(-50%, 100%); opacity: 0; }
  to { transform: translate(-50%, 0); opacity: 1; }
}

.loading-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #9ca3af;
}
.spinner {
  width: 30px;
  height: 30px;
  border: 3px solid #e5e7eb;
  border-top-color: var(--color-button);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>