import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Timeout untuk request jika terlalu lama tidak ada respons
  timeout: 10000,
  // Headers default untuk request
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
})

// Menambahkan interceptor untuk menangani token dan error
api.interceptors.request.use(
  (config) => {
    // Tambahkan token ke header jika ada
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Tambahkan interceptor untuk handling response
api.interceptors.response.use(
  (response) => {
    // Jika response OK, langsung kembalikan
    return response
  },
  (error) => {
    // Cek jika error adalah error CORS atau network error
    if (error.message === 'Network Error') {
      console.warn('Network error detected. Using fallback data.')
      // Tidak perlu menampilkan alert, biarkan fallback data berjalan
    }
    
    // Log error untuk debugging
    console.error('API Error:', error)
    
    // Kembalikan error untuk dihandle di store
    return Promise.reject(error)
  }
)

// Auth
export const login = (data) => api.post('/login', data)
export const logout = () => api.post('/logout')

// Profil Lulusan (PL)
export const getPLList = () => api.get('/list/pl')
export const getPLById = (id) => api.get(`/view/pl/${id}`)
export const addPL = (data) => api.post('/add/pl', data)
export const updatePL = (id, data) => api.put(`/update/pl/${id}`, data)
export const deletePL = (id) => api.delete(`/delete/pl/${id}`)

// CPL (Capaian Pembelajaran Lulusan)
export const getCPLList = () => api.get('/list/cpl')
export const getCPLById = (id) => api.get(`/view/cpl/${id}`)
export const addCPL = (data) => api.post('/add/cpl', data)
export const updateCPL = (id, data) => api.put(`/update/cpl/${id}`, data)
export const deleteCPL = (id) => api.delete(`/delete/cpl/${id}`)

// CPMK (Capaian Pembelajaran Mata Kuliah)
export const getCPMKList = () => api.get('/list/cpmk')
export const getCPMKById = (id) => api.get(`/view/cpmk/${id}`)
export const addCPMK = (data) => api.post('/add/cpmk', data)
export const updateCPMK = (id, data) => api.put(`/update/cpmk/${id}`, data)
export const deleteCPMK = (id) => api.delete(`/delete/cpmk/${id}`)

// MK (Mata Kuliah)
export const getMKList = () => api.get('/list/mk')
export const getMKById = (id) => api.get(`/view/mk/${id}`)
export const addMK = (data) => api.post('/add/mk', data)
export const updateMK = (id, data) => api.put(`/update/mk/${id}`, data)
export const deleteMK = (id) => api.delete(`/delete/mk/${id}`)

// RPS (Rencana Pembelajaran Semester)
export const getRPSList = () => api.get('/list/rps')
export const getRPSById = (id) => api.get(`/view/rps/${id}`)
export const addRPS = (data) => api.post('/add/rps', data)
export const updateRPS = (id, data) => api.put(`/update/rps/${id}`, data)
export const deleteRPS = (id) => api.delete(`/delete/rps/${id}`)

// Korelasi CPL-PL
export const getKorelasiCPLPLList = () => api.get('/list/korelasi-cpl-pl')
export const getKorelasiCPLPLById = (id) => api.get(`/view/korelasi-cpl-pl/${id}`)
export const addKorelasiCPLPL = (data) => api.post('/add/korelasi-cpl-pl', data)
export const updateKorelasiCPLPL = (id, data) => api.put(`/update/korelasi-cpl-pl/${id}`, data)
export const deleteKorelasiCPLPL = (id) => api.delete(`/delete/korelasi-cpl-pl/${id}`)

// Struktur Mata Kuliah
export const getStrukturMKList = () => api.get('/list/struktur-mk')
export const getStrukturMKById = (id) => api.get(`/view/struktur-mk/${id}`)
export const addStrukturMK = (data) => api.post('/add/struktur-mk', data)
export const updateStrukturMK = (id, data) => api.put(`/update/struktur-mk/${id}`, data)
export const deleteStrukturMK = (id) => api.delete(`/delete/struktur-mk/${id}`)

// Export semua API
export default {
  login,
  logout,
  // PL
  getPLList,
  getPLById,
  addPL,
  updatePL,
  deletePL,
  // CPL
  getCPLList,
  getCPLById,
  addCPL,
  updateCPL,
  deleteCPL,
  // CPMK
  getCPMKList,
  getCPMKById,
  addCPMK,
  updateCPMK,
  deleteCPMK,
  // MK
  getMKList,
  getMKById,
  addMK,
  updateMK,
  deleteMK,
  // RPS
  getRPSList,
  getRPSById,
  addRPS,
  updateRPS,
  deleteRPS,
  // Korelasi CPL-PL
  getKorelasiCPLPLList,
  getKorelasiCPLPLById,
  addKorelasiCPLPL,
  updateKorelasiCPLPL,
  deleteKorelasiCPLPL,
  // Struktur MK
  getStrukturMKList,
  getStrukturMKById,
  addStrukturMK,
  updateStrukturMK,
  deleteStrukturMK
}
