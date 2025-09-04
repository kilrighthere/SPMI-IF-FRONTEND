<script setup>
import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'

import { ref, computed} from 'vue'

// === Data dan Logika Pagination ===
const kurikulumData = ref([]) // Untuk menyimpan data kurikulum dari backend
const isLoading = ref(true) // Untuk indikator loading
const error = ref(null) // Untuk penanganan error

const currentPage = ref(1) // halaman aktif
const perPage = 10 // jumlah data per halaman
const totalData = ref(1) // total data (misalnya dari API)

// Hitung index awal & akhir data yang ditampilkan
const startEntry = computed(() => (currentPage.value - 1) * perPage + 1)
const endEntry = computed(() => Math.min(currentPage.value * perPage, totalData.value))

// Hitung total halaman
const totalPages = computed(() => Math.ceil(totalData.value / perPage))

function goToPage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}
</script>

<template>
  <div class="app-layout">
    <Sidebar />
    <div class="main-content">
      <Header />
      <div class="container-Kurikulum">
        <div class="title">
          <h2>Data Kurikulum Program Studi</h2>

          <p><RouterLink to="/Dashboard" >Dashboard</RouterLink> / Data Kurikulum Program Studi</p>
        </div>
        <div class="tabel">
          <div class="header-tabel">
            <div class="button">
              <button id="add" type="button" class="btn btn-primary" @submit="addKur">Tambah Kurikulum</button>
              <button id="excel" type="button" class="btn btn-secondary">Excel</button>
              <button id="print" type="button" class="btn btn-secondary">Print</button>
            </div>
            <form @submit="searchKur" class="search">
              <label for="search">Search: </label>
              <input type="search" class="rounded"/>
            </form>
          </div>
          <div class="table-data border">
            <table class="table table-bordered border-secondary m-0">
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
                <tr>
                  <th>1</th>
                  <td>ayam</td>
                  <td>nasi oadang</td>
                  <td>nasi oadang</td>
                  <td class="opsi-btn">
                    <RouterLink to="">
                      <button id="detail-kr" type="button" class="btn btn-success" @submit="addKur">Detail</button>
                    </RouterLink>
                    <button id="edit-kr" type="button" class="btn btn-warning" @submit="addKur">Ubah</button>
                    <button id="delete-kr" type="button" class="btn btn-danger" @submit="addKur">Hapus</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="footer-table">
            <div class="pagination">
              <p>Showing {{ startEntry }} to {{ endEntry }} of {{ totalData }} entries</p>
            </div>
            <div class="btn-toolbar" role="toolbar" aria-label="Toolbar with button groups">
              <div class="btn-group me-2" role="group" aria-label="First group">
                <button @click="goToPage(currentPage - 1)" :disabled="currentPage === 1" type="button" class="btn btn-disable">Previous</button>
                <button
                  v-for="page in totalPages"
                  :key="page"
                  @click="goToPage(page)"
                  :class="{ active: currentPage === page }"
                  type="button" class="btn btn-primary"
                >
                  {{ page }}
                </button>
                <button @click="goToPage(currentPage + 1)" :disabled="currentPage === totalPages " type="button" class="btn btn-disable">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  </div>
</template>

<style>
.app-layout {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  margin-left: 256px; /* Same as sidebar width */
  margin-top: 0; /* No need for margin-top as we have padding-top in .container-Kurikulum */
  display: flex;
  flex-direction: column;
}

.container-Kurikulum{
  flex: 1; /* Take up available space */
  padding-top: 90px; /* Adjusted for new header height */
  padding-left: 30px;
  padding-right: 30px;
  padding-bottom: 70px; /* Add more bottom padding for footer */
  min-height: 100vh;
  display: flex;
  box-sizing: border-box;
  flex-direction: column;
  justify-content: flex-start;
  gap: 50px;
}

.tabel {
  border: 1px solid var(--color-border);
  padding: 20px;
  border-radius: 10px;
  box-sizing: border-box;
  justify-content: space-around;
  /* align-items: flex-start; */

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

.button {
  display: flex;
}
.header-tabel {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
}

.button{
    gap: 5px;

}

/* .button#add #excel #print{
    background-color: var(--color-button);
    border: 1px solid var(--color-border);
    border-radius: 5px;

} */

th, td{
    text-align: center;
}

.search{
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 15px;

}

.opsi-btn{
    display: flex;
    justify-content: center;
    gap: 5px;
}
.footer-table{
    display: flex;
    justify-content: space-between;
    margin-top: 30px;
}
</style>
