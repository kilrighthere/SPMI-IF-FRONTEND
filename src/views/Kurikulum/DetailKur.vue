<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { kurikulumId, kurikulumData } from '@/stores/kurikulum'
import { useSidebarStore } from '@/stores/sidebar'

const route = useRoute()
const sidebarStore = useSidebarStore()

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
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
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

.submenu-container {
  border-radius: 10px;
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
