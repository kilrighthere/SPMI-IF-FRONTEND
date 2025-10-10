<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { computed } from 'vue'
import { kurikulumId, kurikulumData } from '@/stores/kurikulum'
import { useSidebarStore } from '@/stores/sidebar'

const router = useRouter()
const sidebarStore = useSidebarStore()

// No loading needed for static data
const isLoading = ref(false)

// Use the static data as an array for v-for rendering
const kurikulumDataArray = ref([kurikulumData])

// Handler tombol
const handleDetail = () => {
  router.push(`/kurikulum/${kurikulumId}/profil-lulusan`)
}
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="kur-content">
        <div class="page-title">
          <h2>Data Kurikulum Program Studi</h2>
          <p><RouterLink to="/Dashboard">Dashboard</RouterLink> / Data Kurikulum Program Studi</p>
        </div>
        <div class="tabel">
          <div class="header-tabel">
            <div class="button">
              <button id="excel" type="button" class="btn-secondary">Excel</button>
              <button id="print" type="button" class="btn-secondary">Print</button>
            </div>
          </div>
          <div class="data-tabel">
            <table class="data-kurikulum">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Nama Kurikulum</th>
                  <th>Tahun Mulai Berlaku</th>
                  <th>Jumlah SKS Minimal</th>
                  <th>Opsi</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(kurikulum, index) in kurikulumDataArray" :key="kurikulum.id">
                  <td>{{ index + 1 }}</td>
                  <td>{{ kurikulum.nama }}</td>
                  <td>{{ kurikulum.tahun_berlaku }}</td>
                  <td>{{ kurikulum.min_sks }}</td>
                  <td>
                    <button class="btn-info" @click="handleDetail()">Detail</button>
                  </td>
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

.kur-content {
  flex: 1;
  margin-top: 92px;
  padding-top: 30px;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 50px;
  border-radius: 20px;
  border: 2px solid var(--color-border2);
  box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.08);
  background: white;
  transition: all 0.3s ease;
}

.tabel {
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 10px;
  box-sizing: border-box;
  justify-content: space-around;
}

.tabel-data {
  width: 100%;
  overflow-x: auto;
}

.data-kurikulum {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.data-kurikulum th,
.data-kurikulum td {
  border: 1px solid #ddd;
  padding: 12px 15px;
  text-align: center;
  line-height: 1.5;
}

.opsi-cell {
  margin-right: 5px;
}

.data-kurikulum thead {
  background-color: #f4f4f4;
  font-weight: bold;
}

.data-kurikulum tbody tr:nth-child(even) {
  background-color: #fafafa;
}

.data-kurikulum tbody tr:hover {
  background-color: #f1f1f1;
}

.title {
  padding: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title h2 {
  font-weight: bold;
  font-size: 25px;
}

.page-title {
  margin-bottom: 24px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  font-weight: 700;
  font-size: 26px;
  margin-bottom: 5px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.page-title p {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.page-title p a {
  color: var(--color-button);
  text-decoration: none;
  transition: color 0.2s ease;
}

.page-title p a:hover {
  color: var(--color-button-hover);
  text-decoration: underline;
}

.button {
  display: flex;
  gap: 5px;
}

.header-tabel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 15px;
}

.footer-table {
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
}

.btn-info {
  background-color: var(--color-button);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 14px;
}

.btn-info:hover {
  background-color: var(--color-button-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(218, 42, 45, 0.2);
}

.btn-info:active {
  transform: translateY(0);
}

.btn-secondary {
  background-color: var(--color-buttonsec);
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 600;
  font-size: 14px;
}

.btn-secondary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn-secondary:active {
  transform: translateY(0);
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
  }
}

@media (max-width: 768px) {
  .main-content {
    margin-left: 256px;
    padding: 0 16px;
  }

  .main-content.minimized-sidebar {
    margin-left: 100px;
  }

  .kur-content {
    margin-top: 76px;
    padding: 24px 20px 40px;
  }

  .page-title {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .page-title h2 {
    font-size: 22px;
  }
}
</style>
