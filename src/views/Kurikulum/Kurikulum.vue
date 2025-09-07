<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { computed } from 'vue'
import { kurikulumId, kurikulumData } from '@/stores/kurikulum'

const router = useRouter()

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
    <div class="main-content">
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
  /* min-height: 100vh; */
}

.main-content {
  flex: 1;
  margin-left: 256px; /* Same as sidebar width */
  margin-top: 0; /* No need for margin-top as we have padding-top in .dashboard */
  display: flex;
  flex-direction: column;
  /* border: 3px solid brown; */
  padding: 0px 20px;
}

.kur-content {
  flex: 1; /* Take up available space */
  margin-top: 80px; /* Adjusted for new header height */
  padding-top: 30px;
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 50px; /* Add bottom padding for footer space */
  border-radius: 20px;
  border: 2px solid var(--color-border2);
}

.tabel {
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 10px;
  box-sizing: border-box;
  justify-content: space-around;
  /* align-items: flex-start; */
}

.tabel-data {
  width: 100%;
  overflow-x: auto;
}

.data-kurikulum {
  width: 100%;
  border-collapse: collapse; /* biar border rapi */
  table-layout: fixed; /* kolom proporsional, nggak ngepas isi */
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
  background-color: #fafafa; /* zebra striping */
}

.data-kurikulum tbody tr:hover {
  background-color: #f1f1f1; /* hover effect */
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
  margin-bottom: 20px;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  font-weight: bold;
  font-size: 25px;
  margin-bottom: 5px;
}

.page-title p {
  color: var(--color-border);
  font-size: 16px;
}

.page-title p a {
  color: var(--color-button);
  text-decoration: none;
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
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-info:hover {
  background-color: var(--color-button-hover);
}

.btn-secondary {
  background-color: var(--color-buttonsec);
  color: white;
  border: none;
  padding: 5px 10px;
  border-radius: 5px;
  cursor: pointer;
}
</style>
