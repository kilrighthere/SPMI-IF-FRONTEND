<script setup>
import { onMounted } from 'vue'
import { useMahasiswaStore } from '@/stores/mahasiswa'
import { useSidebarStore } from '@/stores/sidebar'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'

const mahasiswaStore = useMahasiswaStore()
const sidebarStore = useSidebarStore()

onMounted(() => {
  mahasiswaStore.fetchMahasiswa()
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="mahasiswa-content">
        <div class="page-header">
          <div class="page-title">
            <h2>Data Mahasiswa</h2>
            <p class="breadcrumb">
              <RouterLink to="/Dashboard">Dashboard</RouterLink>
              <span class="separator">/</span>
              <RouterLink to="/Kurikulum">Kurikulum</RouterLink>
              <span class="separator">/</span>
              <span class="current">Data Mahasiswa</span>
            </p>
          </div>
        </div>

        <div class="table-container">
          <div class="table-wrapper">
            <table class="modern-table">
              <thead>
                <tr>
                  <th class="col-no">No.</th>
                  <th class="col-nim">NIM</th>
                  <th class="col-nama">Nama Mahasiswa</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="mahasiswaStore.isLoading">
                  <td colspan="3" class="text-center">Loading...</td>
                </tr>
                <tr v-else-if="mahasiswaStore.error">
                  <td colspan="3" class="text-center error">{{ mahasiswaStore.error }}</td>
                </tr>
                <tr v-for="(mahasiswa, index) in mahasiswaStore.mahasiswaList" :key="mahasiswa.nim">
                  <td class="col-no">{{ index + 1 }}</td>
                  <td class="col-nim">{{ mahasiswa.nim }}</td>
                  <td class="col-nama">{{ mahasiswa.nama }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  margin-left: 306px;
  margin-top: 0;
  display: flex;
  flex-direction: column;
  padding: 0px 20px;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-content.minimized-sidebar {
  margin-left: 126px;
}

.mahasiswa-content {
  flex: 1;
  margin-top: 92px;
  padding: 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 28px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title h2 {
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.5px;
}

.breadcrumb {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 8px;
}

.breadcrumb a {
  color: var(--color-button);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
}

.breadcrumb a:hover {
  color: var(--color-button-hover);
}

.breadcrumb .separator {
  color: #d1d5db;
  font-weight: 400;
}

.breadcrumb .current {
  color: #9ca3af;
  font-weight: 500;
}

/* Table Container */
.table-container {
  background: white;
  border-radius: 12px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

/* Modern Table */
.modern-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Montserrat', sans-serif;
}

.modern-table th, .modern-table td {
  padding: 16px 20px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
}

.modern-table thead {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
}

.modern-table th {
  font-weight: 600;
  font-size: 13px;
  text-transform: uppercase;
}

.col-no { width: 80px; text-align: center; }
.col-nim { width: 200px; }
.col-nama { }

.text-center {
    text-align: center;
}

.error {
    color: red;
}
</style>
