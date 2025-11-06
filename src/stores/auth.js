import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { loginDosen, loginMahasiswa, logout as apiLogout, refreshToken, axiosInstance } from '@/api'
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
  async function login(credentials, role = 'dosen') {
    isLoading.value = true
    error.value = null

    // ========================================
    // DUMMY AUTH - Static Login (Server Down)
    // ========================================
    // Data dummy users
    const dummyUsers = {
      // Admin - shakilaAdmin
      '444444444444444444': {
        password: '444444444444444444',
        user: {
          nip: '444444444444444444',
          name: 'shakilaAdmin',
          role: 'admin',
          email: 'shakila.admin@if.undip.ac.id',
        },
      },
      // Dosen - haidarDosen
      '5555555555555555555': {
        password: '5555555555555555555',
        user: {
          nip: '5555555555555555555',
          name: 'haidarDosen',
          role: 'dosen',
          email: 'haidar.dosen@if.undip.ac.id',
        },
      },
      // Mahasiswa 1 - Galih Nanda Wibowo
      24060120140005: {
        password: '24060120140005',
        user: {
          nim: '24060120140005',
          name: 'Galih Nanda Wibowo',
          role: 'mahasiswa',
          email: 'galih@students.undip.ac.id',
        },
      },
      // Mahasiswa 2 - Gibran Mahasiswa
      24060120111111: {
        password: '24060120111111',
        user: {
          nim: '24060120111111',
          name: 'Gibran Mahasiswa',
          role: 'mahasiswa',
          email: 'gibran@students.undip.ac.id',
        },
      },
    }

    try {
      const inputCredential = credentials.nip || credentials.nim
      const dummyAccount = dummyUsers[inputCredential]

      if (dummyAccount && dummyAccount.password === credentials.password) {
        // Validasi role: admin dan dosen harus login lewat endpoint dosen
        if (
          (dummyAccount.user.role === 'admin' || dummyAccount.user.role === 'dosen') &&
          role !== 'dosen'
        ) {
          error.value = 'Admin dan Dosen harus login melalui pilihan "Dosen"'
          isLoading.value = false
          return { success: false, error: error.value }
        }

        // Validasi role: mahasiswa harus login lewat endpoint mahasiswa
        if (dummyAccount.user.role === 'mahasiswa' && role !== 'mahasiswa') {
          error.value = 'Mahasiswa harus login melalui pilihan "Mahasiswa"'
          isLoading.value = false
          return { success: false, error: error.value }
        }

        // Generate dummy token (fake JWT format)
        const dummyToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
          JSON.stringify({
            id: inputCredential,
            role: dummyAccount.user.role,
            exp: 9999999999,
          }),
        )}.dummysignature`

        token.value = dummyToken
        user.value = dummyAccount.user

        // Persist token/user
        localStorage.setItem('token', token.value)
        localStorage.setItem('user', JSON.stringify(user.value))

        // set axios default header
        setAuthHeader(token.value)

        isLoading.value = false
        return { success: true }
      } else {
        error.value = 'NIP/NIM atau password salah'
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
       // Pilih endpoint berdasarkan role
      const loginApi = role === 'mahasiswa' ? loginMahasiswa : loginDosen
      const response = await loginApi(credentials)
      
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
