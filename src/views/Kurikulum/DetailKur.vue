<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { kurikulumId, kurikulumData } from '@/stores/kurikulum'

const route = useRoute()

// sub menu aktif
const activeSubmenu = computed(() => {
  const segments = route.path.split('/')
  return segments[segments.length - 1]
})

const submenuTitles = {
  'profil-lulusan': 'Profil Lulusan',
  'cpl-prodi': 'CPL Prodi',
  'korelasi-pl': 'Korelasi PL-CPL',
  cpmk: 'CPMK',
  'struktur-matkul': 'Struktur Mata Kuliah',
  rps: 'RPS Mata Kuliah',
  'nilai-matkul': 'Nilai Mata Kuliah',
  'ukur-cpl': 'Pengukuran CPL Mahasiswa',
}
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content">
      <div class="kur-content">
        <div class="page-title">
          <h2>{{ submenuTitles[activeSubmenu] || 'Detail Kurikulum' }}</h2>
          <p>
            <RouterLink to="/Dashboard">Dashboard</RouterLink> /
            <RouterLink to="/Kurikulum">Kurikulum</RouterLink> /
            {{ submenuTitles[activeSubmenu] || 'Detail' }}
          </p>
        </div>
        <div class="submenu-container">
          <RouterView />
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
  margin-left: 256px; /* Same as sidebar width */
  margin-top: 0; /* No need for margin-top as we have padding-top in .dashboard */
  display: flex;
  flex-direction: column;
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
  font-size: 14px;
}

.page-title p a {
  color: var(--color-button);
  text-decoration: none;
}

.submenu-container {
  border-radius: 10px;
}
</style>
