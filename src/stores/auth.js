import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout } from '@/api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const isLoading = ref(false)
  const error = ref(null)

  // Computed properties
  const isAuthenticated = computed(() => !!token.value)

  // Actions
  async function login(credentials) {
    isLoading.value = true
    error.value = null
    
    try {
      const response = await apiLogin(credentials)
      token.value = response.data.token
      user.value = response.data.user
      
      // Save to localStorage
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
      
      return { success: true }
    } catch (err) {
      console.error('Login failed:', err)
      error.value = 'Username atau password salah'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
  }

  async function logout() {
    isLoading.value = true
    
    try {
      if (token.value) {
        await apiLogout()
      }
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear regardless of API call success
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      isLoading.value = false
    }
  }

  // Check if token exists on app startup
  function checkAuth() {
    if (token.value) {
      // Here you could add token validation logic
      // For example, check if token is expired
      return true
    }
    return false
  }

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth
  }
})
