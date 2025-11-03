import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as apiLogin, logout as apiLogout, refreshToken, axiosInstance } from '@/api'
const api = axiosInstance

export const useAuthStore = defineStore('auth', () => {
  // access token stored in memory and optionally persisted in localStorage
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user')) || null)
  const isLoading = ref(false)
  const error = ref(null)

  // Helper to safely decode JWT payload
  function decodePayload(t) {
    try {
      return JSON.parse(atob(t.split('.')[1]))
    } catch (e) {
      return null
    }
  }

  // Check if token is valid (exists and not expired)
  function isTokenValid(t) {
    if (!t) return false
    const p = decodePayload(t)
    if (!p || !p.exp) return false
    const now = Math.floor(Date.now() / 1000)
    return p.exp > now
  }

  // Computed properties
  const isAuthenticated = computed(() => isTokenValid(token.value))

  // Helper to set Authorization header for axios when token changes
  function setAuthHeader(t) {
    if (t) {
      api.defaults.headers.common['Authorization'] = `Bearer ${t}`
    } else {
      delete api.defaults.headers.common['Authorization']
    }
  }

  // Initialize axios header if we have a token from storage
  if (isTokenValid(token.value)) setAuthHeader(token.value)

  // Actions
  async function login(credentials) {
    isLoading.value = true
    error.value = null

    // ========================================
    // DUMMY AUTH - Static Login (Server Down)
    // ========================================
    // Gunakan NIP dan Password: 111111111111111111
    try {
      const dummyNip = '111111111111111111'
      const dummyPassword = '111111111111111111'

      if (credentials.nip === dummyNip && credentials.password === dummyPassword) {
        // Generate dummy token (fake JWT format)
        const dummyToken =
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuaXAiOiIxMTExMTExMTExMTExMTExMTEiLCJuYW1lIjoiRHVtbXkgVXNlciIsInJvbGUiOiJkb3NlbiIsImV4cCI6OTk5OTk5OTk5OX0.dummysignature'
        const dummyUser = {
          nip: dummyNip,
          name: 'Dummy User',
          role: 'dosen',
          email: 'dummy@example.com',
        }

        token.value = dummyToken
        user.value = dummyUser

        // Persist token/user
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))

        // set axios default header
        setAuthHeader(token.value)

        isLoading.value = false
        return { success: true }
      } else {
        error.value = 'NIP atau password salah. Gunakan: 111111111111111111'
        isLoading.value = false
        return { success: false, error: error.value }
      }
    } catch (err) {
      console.error('Dummy login failed:', err)
      error.value = 'Terjadi kesalahan saat login'
      isLoading.value = false
      return { success: false, error: error.value }
    }

    // ========================================
    // DATABASE AUTH - Uncomment when server is back online
    // ========================================
    /*
    try {
      const response = await apiLogin(credentials)
      // Backend should return { accessToken, user }
      const accessToken = response.data.accessToken || response.data.token
      const respUser = response.data.user

      if (!accessToken) {
        throw new Error('No access token returned from server')
      }

      token.value = accessToken
      user.value = respUser

      // Persist token/user so page refresh can pick up (optional risk)
      localStorage.setItem('token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))

      // set axios default header so subsequent requests include bearer token
      setAuthHeader(token.value)

      return { success: true }
    } catch (err) {
      console.error('Login failed:', err?.response?.data || err)
      // Prefer server-provided message when available to aid debugging
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || null
      error.value = serverMsg || 'Username atau password salah'
      return { success: false, error: error.value }
    } finally {
      isLoading.value = false
    }
    */
  }

  // Call refresh endpoint to obtain a new access token using httpOnly refresh cookie
  async function refresh() {
    // ========================================
    // DUMMY AUTH - Refresh disabled (Server Down)
    // ========================================
    // Return true if token exists (dummy mode doesn't expire)
    if (token.value) return true
    return false

    // ========================================
    // DATABASE AUTH - Uncomment when server is back online
    // ========================================
    /*
    try {
      const res = await refreshToken()
      const newToken = res.data?.accessToken
      const respUser = res.data?.user
      if (newToken) {
        token.value = newToken
        if (respUser) user.value = respUser
        localStorage.setItem('token', token.value)
        if (respUser) localStorage.setItem('user', JSON.stringify(user.value))
        setAuthHeader(token.value)
        return true
      }
      return false
    } catch (err) {
      console.error('Refresh failed:', err)
      return false
    }
    */
  }

  async function logout() {
    isLoading.value = true

    // ========================================
    // DUMMY AUTH - Simple logout (Server Down)
    // ========================================
    // Just clear local storage, no API call
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setAuthHeader(null)
    isLoading.value = false

    // ========================================
    // DATABASE AUTH - Uncomment when server is back online
    // ========================================
    /*
    try {
      // Attempt to notify server to revoke refresh token & clear cookie
      await apiLogout()
    } catch (err) {
      console.error('Logout error:', err)
    } finally {
      // Clear regardless of API call success
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Remove axios default header
      setAuthHeader(null)
      isLoading.value = false
    }
    */
  }

  // Check authentication on app startup.
  // If we have a token, we trust it for now; otherwise try to refresh via cookie.
  async function checkAuth() {
    // ========================================
    // DUMMY AUTH - Always valid if token exists (Server Down)
    // ========================================
    // In dummy mode, just check if token exists in storage
    if (token.value) return true
    return false

    // ========================================
    // DATABASE AUTH - Uncomment when server is back online
    // ========================================
    /*
    // If we have a token and it's valid, we're authenticated
    if (isTokenValid(token.value)) return true

    // If token exists but expired, clear it and try refresh
    if (token.value && !isTokenValid(token.value)) {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setAuthHeader(null)
    }

    // Try silent refresh using httpOnly cookie
    const ok = await refresh()
    return ok
    */
  }

  return {
    token,
    user,
    isLoading,
    error,
    isAuthenticated,
    login,
    logout,
    checkAuth,
  }
})
