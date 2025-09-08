<script setup>
import { ref, computed, onMounted } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { usePLStore } from '@/stores/profilLulusan'
import { useCPLStore } from '@/stores/cpl'
import { useKorelasiCPLPLStore } from '@/stores/korelasiCPLPL'
import { kurikulumData } from '@/stores/kurikulum'

// Initialize stores
const plStore = usePLStore()
const cplStore = useCPLStore()
const korelasiStore = useKorelasiCPLPLStore()

// Data
const profilLulusanList = computed(() => plStore.profilLulusanList)
const cplList = computed(() => cplStore.cplList)
const isLoading = computed(() => plStore.isLoading || cplStore.isLoading || korelasiStore.isLoading)
const error = computed(() => plStore.error || cplStore.error || korelasiStore.error)
const showSuccess = ref(false)
const successMessage = ref('')

// Selected PL untuk menampilkan CPL yang terkait
const selectedPL = ref(null)
// CPL yang dipilih untuk dihubungkan dengan PL
const selectedCPLs = ref([])
// CPL yang belum terhubung dengan PL manapun
const unassignedCPLs = computed(() => {
  if (!cplList.value || !profilLulusanList.value) return []
  return cplList.value.filter(cpl => !cpl.id_pl || cpl.id_pl === '' || cpl.id_pl === 'PL-REL')
})

// CPL yang sudah terhubung dengan PL tertentu
const getAssignedCPLs = (plId) => {
  if (!cplList.value) return []
  // Jangan tampilkan CPL dengan id_pl "PL-REL" karena itu adalah placeholder
  return cplList.value.filter(cpl => cpl.id_pl === plId && cpl.id_pl !== "PL-REL")
}

// Fetch data
const fetchData = async () => {
  await plStore.fetchAllPL()
  await cplStore.fetchAllCPL()
  try {
    await korelasiStore.fetchAllKorelasi()
  } catch (err) {
    console.log('Tidak bisa mengambil data korelasi khusus:', err)
    // Tidak masalah karena kita juga menggunakan relasi dari CPL
  }
}

// Pilih PL untuk melihat korelasi
const selectPL = (pl) => {
  selectedPL.value = pl
  // Reset selected CPLs
  selectedCPLs.value = []
}

// Tambahkan CPL ke PL
const addCPLToPL = async () => {
  if (!selectedPL.value || selectedCPLs.value.length === 0) return
  
  try {
    // Update setiap CPL yang dipilih
    for (const cplId of selectedCPLs.value) {
      const cpl = cplList.value.find(c => c.id_cpl === cplId)
      if (cpl) {
        // Pastikan semua field yang dibutuhkan oleh API tetap ada
        await cplStore.editCPL(cpl.id_cpl, {
          id_cpl: cpl.id_cpl,
          deskripsi: cpl.deskripsi, // Tetap kirim field deskripsi
          id_pl: selectedPL.value.id_pl
        })
      }
    }
    
    // Refresh data
    await fetchData()
    
    // Tampilkan pesan sukses
    successMessage.value = 'Korelasi berhasil ditambahkan'
    showSuccess.value = true
    setTimeout(() => {
      showSuccess.value = false
    }, 3000)
    
    // Reset selected CPLs
    selectedCPLs.value = []
  } catch (err) {
    console.error('Error adding CPL to PL:', err)
  }
}

// Hapus korelasi CPL dengan PL
const removeCPLFromPL = async (cpl) => {
  if (!cpl) return
  
  if (confirm('Apakah anda yakin ingin menghapus korelasi ini?')) {
    try {
      console.log('Removing correlation for CPL:', cpl);
      
      // Dari data yang terlihat, "PL-REL" sepertinya digunakan sebagai nilai 
      // default atau tempat penyimpanan sementara untuk CPL yang belum memiliki relasi tetap.
      const dataToSend = {
        deskripsi: cpl.deskripsi,
        id_pl: "PL-REL" // Gunakan PL-REL sebagai placeholder untuk CPL tanpa korelasi
      };
      
      console.log('Data yang dikirim ke API:', dataToSend);
      await cplStore.editCPL(cpl.id_cpl, dataToSend);
      
      // Refresh data
      await fetchData();
      
      // Tampilkan pesan sukses
      successMessage.value = 'Korelasi berhasil dihapus';
      showSuccess.value = true;
      setTimeout(() => {
        showSuccess.value = false;
      }, 3000);
    } catch (err) {
      console.error('Error removing CPL from PL:', err);
      // Tampilkan pesan error dari API jika ada
      if (err.response && err.response.data) {
        console.log('Error response:', err.response.data);
        error.value = `Gagal menghapus korelasi: ${err.response.data.message || 'Error tidak diketahui'}`;
      } else {
        error.value = 'Gagal menghapus korelasi. Silakan coba lagi.';
      }
      
      // Tampilkan pesan error
      showSuccess.value = false;
    }
  }
}

// Toggle CPL selection
const toggleCPLSelection = (cplId) => {
  const index = selectedCPLs.value.indexOf(cplId)
  if (index === -1) {
    selectedCPLs.value.push(cplId)
  } else {
    selectedCPLs.value.splice(index, 1)
  }
}

// Load data saat komponen dimuat
onMounted(() => {
  fetchData()
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="dashboard">
        <div class="korelasi-container">
          <div class="section-box">
            <div class="section-header">
              <h3>Korelasi Profil Lulusan dan CPL</h3>
            </div>

            <!-- Loading indicator -->
            <div v-if="isLoading" class="loading">Loading...</div>
            
            <!-- Error message -->
            <div v-if="error" class="error-message">{{ error }}</div>
            
            <!-- Success message -->
            <div v-if="showSuccess" class="success-message">{{ successMessage }}</div>

            <!-- Content -->
            <div v-if="!isLoading && !error" class="korelasi-content">
              <p>
                Halaman ini digunakan untuk mengelola korelasi antara Profil Lulusan (PL) dan 
                Capaian Pembelajaran Lulusan (CPL) pada {{ kurikulumData.nama }}.
              </p>
              
              <div class="korelasi-grid">
                <!-- Daftar PL -->
                <div class="pl-list-container">
                  <h4>Profil Lulusan</h4>
                  <div v-if="profilLulusanList.length === 0" class="empty-state">
                    Belum ada data Profil Lulusan.
                  </div>
                  <ul v-else class="pl-list">
                    <li 
                      v-for="pl in profilLulusanList" 
                      :key="pl.id_pl" 
                      :class="{ 'selected': selectedPL && pl.id_pl === selectedPL.id_pl }"
                      @click="selectPL(pl)"
                    >
                      <strong>{{ pl.id_pl }}</strong>: {{ pl.deskripsi }}
                    </li>
                  </ul>
                </div>
                
                <!-- Detail Korelasi -->
                <div class="korelasi-detail">
                  <template v-if="selectedPL">
                    <h4>CPL yang terkait dengan {{ selectedPL.id_pl }}</h4>
                    <div class="assigned-cpl">
                      <div v-if="getAssignedCPLs(selectedPL.id_pl).length === 0" class="empty-state">
                        Belum ada CPL yang terkait dengan Profil Lulusan ini.
                      </div>
                      <table v-else class="cpl-table">
                        <thead>
                          <tr>
                            <th>ID CPL</th>
                            <th>Deskripsi</th>
                            <th>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="cpl in getAssignedCPLs(selectedPL.id_pl)" :key="cpl.id_cpl">
                            <td>{{ cpl.id_cpl }}</td>
                            <td>{{ cpl.deskripsi }}</td>
                            <td>
                              <button class="btn-delete" @click="removeCPLFromPL(cpl)">Hapus Korelasi</button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                    
                    <!-- Tambah CPL ke PL -->
                    <div class="add-cpl-section">
                      <h4>Tambahkan CPL ke {{ selectedPL.id_pl }}</h4>
                      <div v-if="unassignedCPLs.length === 0" class="empty-state">
                        Tidak ada CPL yang tersedia untuk ditambahkan.
                      </div>
                      <div v-else>
                        <div class="cpl-selection">
                          <div 
                            v-for="cpl in unassignedCPLs" 
                            :key="cpl.id_cpl" 
                            class="cpl-selection-item"
                            :class="{ 'selected': selectedCPLs.includes(cpl.id_cpl) }"
                            @click="toggleCPLSelection(cpl.id_cpl)"
                          >
                            <div class="checkbox">
                              <input 
                                type="checkbox" 
                                :id="`cpl-${cpl.id_cpl}`" 
                                :checked="selectedCPLs.includes(cpl.id_cpl)"
                                @change="toggleCPLSelection(cpl.id_cpl)"
                              />
                            </div>
                            <div class="cpl-info">
                              <strong>{{ cpl.id_cpl }}</strong>: {{ cpl.deskripsi }}
                            </div>
                          </div>
                        </div>
                        <div class="form-actions">
                          <button 
                            class="btn-save" 
                            @click="addCPLToPL" 
                            :disabled="selectedCPLs.length === 0"
                          >
                            Tambahkan CPL ke {{ selectedPL.id_pl }}
                          </button>
                        </div>
                      </div>
                    </div>
                  </template>
                  
                  <div v-else class="select-pl-prompt">
                    Silakan pilih Profil Lulusan dari daftar di sebelah kiri untuk melihat atau mengelola korelasi.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style scoped>
.dash-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 256px; /* Same as sidebar width */
  display: flex;
  flex-direction: column;
}

.dashboard {
  padding: 20px;
  flex: 1;
  padding-top: 90px; /* Adjusted for new header height */
}

.korelasi-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-box h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 0;
  color: var(--color-button);
}

.section-box h4 {
  font-size: 16px;
  font-weight: bold;
  margin-top: 20px;
  margin-bottom: 10px;
  color: var(--color-button);
}

.korelasi-content p {
  margin-bottom: 20px;
  line-height: 1.6;
}

.korelasi-grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 20px;
}

.pl-list-container {
  border-right: 1px solid #eee;
  padding-right: 20px;
}

.pl-list {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

.pl-list li {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.pl-list li:hover {
  background-color: #f5f5f5;
}

.pl-list li.selected {
  background-color: #e3f2fd;
  border-color: #2196F3;
}

.korelasi-detail {
  padding-left: 20px;
}

.cpl-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.cpl-table th,
.cpl-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.cpl-table th {
  background-color: #f5f5f5;
  font-weight: 600;
}

.cpl-table tr:hover {
  background-color: #f9f9f9;
}

.cpl-selection {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.cpl-selection-item {
  display: flex;
  align-items: flex-start;
  padding: 10px;
  border-bottom: 1px solid #eee;
  cursor: pointer;
}

.cpl-selection-item:last-child {
  border-bottom: none;
}

.cpl-selection-item:hover {
  background-color: #f5f5f5;
}

.cpl-selection-item.selected {
  background-color: #e3f2fd;
}

.checkbox {
  margin-right: 10px;
  display: flex;
  align-items: center;
}

.cpl-info {
  flex: 1;
}

.form-actions {
  margin-top: 15px;
  display: flex;
  justify-content: flex-end;
}

.btn-save {
  background-color: #4caf50;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-save:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.btn-delete {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error-message {
  color: #f44336;
  padding: 10px;
  background-color: #ffebee;
  border-radius: 4px;
  margin-bottom: 15px;
}

.success-message {
  color: #4caf50;
  padding: 10px;
  background-color: #e8f5e9;
  border-radius: 4px;
  margin-bottom: 15px;
}

.empty-state {
  text-align: center;
  padding: 20px;
  color: #666;
  font-style: italic;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.select-pl-prompt {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  background-color: #f9f9f9;
  border-radius: 4px;
  font-size: 16px;
}

.add-cpl-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px dashed #ddd;
}
</style>