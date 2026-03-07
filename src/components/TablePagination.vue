<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalItems: {
    type: Number,
    required: true,
  },
  currentPage: {
    type: Number,
    required: true,
  },
  itemsPerPage: {
    type: Number,
    default: 10,
  },
  showAll: {
    type: Boolean,
    default: false,
  },
  itemLabel: {
    type: String,
    default: 'data',
  },
})

const emit = defineEmits(['update:currentPage', 'update:showAll'])

const totalPages = computed(() => {
  if (props.showAll || props.itemsPerPage <= 0) return 1
  return Math.max(1, Math.ceil(props.totalItems / props.itemsPerPage))
})

const startItem = computed(() => {
  if (props.totalItems === 0) return 0
  if (props.showAll) return 1
  return (props.currentPage - 1) * props.itemsPerPage + 1
})

const endItem = computed(() => {
  if (props.totalItems === 0) return 0
  if (props.showAll) return props.totalItems
  return Math.min(props.currentPage * props.itemsPerPage, props.totalItems)
})

const visiblePages = computed(() => {
  const pages = []
  const maxVisible = 5
  let start = Math.max(1, props.currentPage - 2)
  let end = Math.min(totalPages.value, start + maxVisible - 1)

  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1)
  }

  for (let i = start; i <= end; i += 1) pages.push(i)
  return pages
})

const goToPage = (page) => {
  if (page < 1 || page > totalPages.value || page === props.currentPage) return
  emit('update:currentPage', page)
}

const toggleShowAll = () => {
  emit('update:showAll', !props.showAll)
  emit('update:currentPage', 1)
}
</script>

<template>
  <div class="table-pagination" v-if="totalItems > 0">
    <div class="pagination-info">
      Menampilkan {{ startItem }} - {{ endItem }} dari {{ totalItems }} {{ itemLabel }}
    </div>

    <div class="pagination-controls">
      <button class="show-all-btn" @click="toggleShowAll">
        {{ showAll ? 'Batasi 10 Data' : 'Tampilkan Semua' }}
      </button>

      <template v-if="!showAll && totalPages > 1">
        <button
          class="pagination-btn"
          @click="goToPage(currentPage - 1)"
          :disabled="currentPage === 1"
        >
          <i class="ri-arrow-left-s-line"></i>
          Sebelumnya
        </button>

        <button
          v-for="page in visiblePages"
          :key="page"
          class="pagination-page"
          :class="{ active: currentPage === page }"
          @click="goToPage(page)"
        >
          {{ page }}
        </button>

        <button
          class="pagination-btn"
          @click="goToPage(currentPage + 1)"
          :disabled="currentPage === totalPages"
        >
          Selanjutnya
          <i class="ri-arrow-right-s-line"></i>
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  font-family: 'Montserrat', sans-serif;
}

.pagination-info {
  color: #6b7280;
  font-size: 14px;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.show-all-btn,
.pagination-btn,
.pagination-page {
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.2s ease;
}

.show-all-btn:hover,
.pagination-btn:hover,
.pagination-page:hover {
  border-color: var(--color-button);
  color: var(--color-text);
  background: #faffec;
}

.show-all-btn {
  border-color: var(--color-button);
  color: var(--color-text);
}

.pagination-page.active {
  background: var(--color-button);
  border-color: var(--color-button);
  color: white;
}

.pagination-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 768px) {
  .table-pagination {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
