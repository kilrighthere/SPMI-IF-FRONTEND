<template>
  <div class="cpmk-mk-page">
    <CpmkMkMatrixMap :data="allocations" />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useCpmkMkStore } from '@/stores/cpmkMk'
import CpmkMkMatrixMap from '@/components/CpmkMkMatrixMap.vue'

const store = useCpmkMkStore()

// Data allocations dari store
const allocations = computed(() => store.items)

// Fetch data saat component mounted
onMounted(async () => {
  await store.fetchAll() // Fetch relasi CPMK-MK
})
</script>

<style scoped>
.cpmk-mk-page {
  height: 100%;
  width: 100%;
}
</style>