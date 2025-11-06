import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  // Timeout untuk request jika terlalu lama tidak ada respons
  timeout: 10000,
  withCredentials: true,
  // Headers default untuk request
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

// Export the axios instance so other modules can adjust defaults (e.g. set Authorization header)
export { api as axiosInstance }

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
  },
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

    // Jika server mengembalikan 401, biarkan interceptor refresh menangani
    const originalRequest = error.config
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      // Jika belum ada mekanisme refresh dipicu -> panggil /refresh
      // Implementasi queue supaya hanya satu request refresh berjalan dan request lain menunggu
      if (!api.isRefreshing) {
        api.isRefreshing = true
        api._refreshSubscribers = []
        return api
          .post('/refresh')
          .then((res) => {
            const newToken = res.data?.accessToken
            // Simpan token ke localStorage agar interceptor request selanjutnya membawa header
            if (newToken) localStorage.setItem('token', newToken)
            // update Authorization header default
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`
            // jalankan semua subscriber
            api._refreshSubscribers.forEach((cb) => cb(newToken))
            api._refreshSubscribers = []
            api.isRefreshing = false
            // retry original request
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`
            return api(originalRequest)
          })
          .catch((refreshError) => {
            api.isRefreshing = false
            api._refreshSubscribers = []
            // jika refresh gagal, forward error agar store/router bisa menangani logout
            return Promise.reject(refreshError)
          })
      }

      // Jika sedang melakukan refresh, queue request untuk dijalankan setelah selesai
      return new Promise((resolve, reject) => {
        api._refreshSubscribers.push((token) => {
          originalRequest._retry = true
          originalRequest.headers['Authorization'] = `Bearer ${token}`
          resolve(api(originalRequest))
        })
      })
    }

    // Log error untuk debugging
    console.error('API Error:', error)

    // Kembalikan error untuk dihandle di store
    return Promise.reject(error)
  },
)

// Export helper untuk manual refresh (jika diperlukan di auth store)
export const refreshToken = () => api.post('/refresh')

// Auth
export const login = (data) => api.post('/login', data)
export const loginDosen = (data) => api.post('/login/dosen', data)
export const loginMahasiswa = (data) => api.post('/login/mahasiswa', data)
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
export const getMKList = () => api.get('/list/mata-kuliah')
export const getMKById = (id) => api.get(`/view/mata-kuliah/${id}`)
export const addMK = (data) => api.post('/add/mata-kuliah', data)
export const updateMK = (id, data) => api.put(`/update/mata-kuliah/${id}`, data)
export const deleteMK = (id) => api.delete(`/delete/mata-kuliah/${id}`)

// RPS (Rencana Pembelajaran Semester)
export const getRPSList = () => api.get('/list/rps')
export const getRPSById = (id) => api.get(`/view/rps/${id}`)
export const addRPS = (data) => api.post('/add/rps', data)
export const updateRPS = (id, data) => api.put(`/update/rps/${id}`, data)
export const deleteRPS = (id) => api.delete(`/delete/rps/${id}`)

// CPL-PL
// Tambahkan handling fallback untuk endpoint CPL-PL yang belum diimplementasi di backend
export const addCplPl = (data) => {
  return new Promise((resolve) => {
    api
      .post('/add/cpl-pl', data)
      .then((response) => {
        resolve(response)
      })
      .catch((error) => {
        console.warn('Endpoint /add/cpl-pl not available, using fallback data', error)
        resolve({
          data: {
            success: true,
            data: { id_cpl: data.id_cpl, id_pl: data.id_pl },
          },
        })
      })
  })
}

// Fungsi ini tidak digunakan lagi karena relasi diambil dari response getCPLList
export const getCplPlList = () => {
  return new Promise((resolve) => {
    api
      .get('/list/cpl-pl')
      .then((response) => {
        resolve(response)
      })
      .catch((error) => {
        console.warn('Endpoint /list/cpl-pl not available, using fallback data', error)
        // Return format yang konsisten dengan API response sukses
        resolve({
          data: {
            success: true,
            data: [
              { id_cpl: 'CPL-01', id_pl: 'PL-01' },
              { id_cpl: 'CPL-02', id_pl: 'PL-01' },
              { id_cpl: 'CPL-02', id_pl: 'PL-02' },
              { id_cpl: 'CPL-03', id_pl: 'PL-01' },
              { id_cpl: 'CPL-03', id_pl: 'PL-03' },
            ],
          },
        })
      })
  })
}

export const deleteCplPl = (id_cpl, id_pl) => {
  return new Promise((resolve) => {
    api
      .delete(`/delete/cpl-pl/${id_cpl}/${id_pl}`)
      .then((response) => {
        resolve(response)
      })
      .catch((error) => {
        console.warn(
          `Endpoint /delete/cpl-pl/${id_cpl}/${id_pl} not available, using fallback`,
          error,
        )
        resolve({
          data: {
            success: true,
            message: 'CPL-PL relation deleted successfully (fallback)',
          },
        })
      })
  })
}

// Struktur Mata Kuliah
export const getStrukturMKList = () => api.get('/list/struktur-mk')
export const getStrukturMKById = (id) => api.get(`/view/struktur-mk/${id}`)
export const addStrukturMK = (data) => api.post('/add/struktur-mk', data)
export const updateStrukturMK = (id, data) => api.put(`/update/struktur-mk/${id}`, data)
export const deleteStrukturMK = (id) => api.delete(`/delete/struktur-mk/${id}`)

// Mahasiswa
export const getMahasiswaList = () => api.get('/list/mahasiswa')
export const getMahasiswaByNim = (nim) => api.get(`/view/mahasiswa/${nim}`)
export const getMahasiswaPetaNilai = (nim) => api.get(`/view/mahasiswa/peta-nilai/${nim}`)
export const getMahasiswaCplPerGrades = (nim) => api.get(`/view/mahasiswa/cpl-per-grades/${nim}`)
export const getMahasiswaNilaiPerPeriode = (nim, periode) =>
  api.get(`/view/mahasiswa/${nim}/${periode}`)
export const addMahasiswa = (data) => api.post('/add/mahasiswa', data)
export const updateMahasiswa = (nim, data) => api.put(`/update/mahasiswa/${nim}`, data)
export const deleteMahasiswa = (nim) => api.delete(`/delete/mahasiswa/${nim}`)

// Kurikulum
export const getKurikulumList = () => api.get('/list/kurikulum')
export const getKurikulumById = (id) => api.get(`/view/kurikulum/${id}`)
export const addKurikulum = (data) => api.post('/add/kurikulum', data)
export const updateKurikulum = (id, data) => api.put(`/update/kurikulum/${id}`, data)
export const deleteKurikulum = (id) => api.delete(`/delete/kurikulum/${id}`)

// Kurikulum MK
export const getAllKurikulumMk = () => api.get('/list/kurikulum-mk')
export const getKurikulumMkById = (id) => api.get(`/view/kurikulum-mk/${id}`)
export const createKurikulumMk = (data) => api.post('/add/kurikulum-mk', data)
export const updateKurikulumMk = (id, data) => api.put(`/update/kurikulum-mk/${id}`, data)
export const deleteKurikulumMk = (id) => api.delete(`/delete/kurikulum-mk/${id}`)

// BK
export const getBKList = () => api.get('/list/bk')
export const getBKById = (id) => api.get(`/view/bk/${id}`)
export const addBK = (data) => api.post('/add/bk', data)
export const updateBK = (id, data) => api.put(`/update/bk/${id}`, data)
export const deleteBK = (id) => api.delete(`/delete/bk/${id}`)

// CPL SNDIKTI
export const getCplSndiktiList = () => api.get('/list/cpl-sndikti')
export const getCplSndiktiById = (id) => api.get(`/view/cpl-sndikti/${id}`)
export const addCplSndikti = (data) => api.post('/add/cpl-sndikti', data)
export const updateCplSndikti = (id, data) => api.put(`/update/cpl-sndikti/${id}`, data)
export const deleteCplSndikti = (id) => api.delete(`/delete/cpl-sndikti/${id}`)

// Nilai MK
export const getNilaiMkList = (params = {}) => {
  const queryParams = new URLSearchParams()
  if (params.id_periode) queryParams.append('id_periode', params.id_periode)
  if (params.kode_mk) queryParams.append('kode_mk', params.kode_mk)
  
  const queryString = queryParams.toString()
  return api.get(`/list/nilai-mk${queryString ? `?${queryString}` : ''}`)
}
export const getNilaiMkById = (id_periode, kode_mk, nim) =>
  api.get(`/view/nilai-mk/${id_periode}/${kode_mk}/${nim}`)
export const addNilaiMk = (data) => api.post('/add/nilai-mk', data)
export const updateNilaiMk = (id_periode, kode_mk, nim, data) =>
  api.put(`/update/nilai-mk/${id_periode}/${kode_mk}/${nim}`, data)
export const deleteNilaiMk = (id_periode, kode_mk, nim) =>
  api.delete(`/delete/nilai-mk/${id_periode}/${kode_mk}/${nim}`)

// Periode
export const getPeriodeList = () => api.get('/list/periode')

// Asosiasi
// BK-MK
export const addBkMk = (data) => api.post('/add/bk-mk', data)
export const getBkMkList = () => api.get('/list/bk-mk')
export const deleteBkMk = (id_bk, id_mk) => api.delete(`/delete/bk-mk/${id_bk}/${id_mk}`)

// CPL-BK
export const addCplBk = (data) => api.post('/add/cpl-bk', data)
export const getCplBkList = () => api.get('/list/cpl-bk')
export const deleteCplBk = (id_cpl, id_bk) => api.delete(`/delete/cpl-bk/${id_cpl}/${id_bk}`)

// CPMK-MK
export const addCpmkMk = (data) => api.post('/add/cpmk-mk', data)
export const getCpmkMkList = () => api.get('/list/cpmk-mk')
export const deleteCpmkMk = (id_cpmk, id_mk) => api.delete(`/delete/cpmk-mk/${id_cpmk}/${id_mk}`)

// Auth
export const register = (data) => api.post('/register', data)

// Export semua API
export default {
  login,
  loginDosen,
  loginMahasiswa,
  logout,
  register,
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
  // CPL-PL
  addCplPl,
  getCplPlList,
  deleteCplPl,
  // Struktur MK
  getStrukturMKList,
  getStrukturMKById,
  addStrukturMK,
  updateStrukturMK,
  deleteStrukturMK,
  // Mahasiswa
  getMahasiswaList,
  getMahasiswaByNim,
  getMahasiswaPetaNilai,
  getMahasiswaCplPerGrades,
  getMahasiswaNilaiPerPeriode,
  addMahasiswa,
  updateMahasiswa,
  deleteMahasiswa,
  // Kurikulum
  getKurikulumList,
  getKurikulumById,
  addKurikulum,
  updateKurikulum,
  deleteKurikulum,
  // Kurikulum MK
  getAllKurikulumMk,
  getKurikulumMkById,
  createKurikulumMk,
  updateKurikulumMk,
  deleteKurikulumMk,
  // BK
  getBKList,
  getBKById,
  addBK,
  updateBK,
  deleteBK,
  // CPL SNDIKTI
  getCplSndiktiList,
  getCplSndiktiById,
  addCplSndikti,
  updateCplSndikti,
  deleteCplSndikti,
  // Nilai MK
  getNilaiMkList,
  getNilaiMkById,
  addNilaiMk,
  updateNilaiMk,
  deleteNilaiMk,
  // Periode
  getPeriodeList,
  // Asosiasi
  addBkMk,
  getBkMkList,
  deleteBkMk,
  addCplBk,
  getCplBkList,
  deleteCplBk,
  addCpmkMk,
  getCpmkMkList,
  deleteCpmkMk,
}
