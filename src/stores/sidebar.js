import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSidebarStore = defineStore('sidebar', () => {
  const isMinimized = ref(false)

  function toggleSidebar() {
    isMinimized.value = !isMinimized.value
  }

  function minimize() {
    isMinimized.value = true
  }

  function expand() {
    isMinimized.value = false
  }

  return {
    isMinimized,
    toggleSidebar,
    minimize,
    expand,
  }
})
