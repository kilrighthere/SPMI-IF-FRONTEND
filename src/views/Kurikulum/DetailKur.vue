<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useKurikulumStore } from '@/stores/kurikulum'
import { useSidebarStore } from '@/stores/sidebar'

const route = useRoute()
const sidebarStore = useSidebarStore()
const kurikulumStore = useKurikulumStore()

// Get kurikulum data from store
const currentKurikulum = computed(() => kurikulumStore.currentKurikulum)

// Load kurikulum data when component is mounted
onMounted(async () => {
  const kurikulumId = route.params.id
  if (kurikulumId) {
    await kurikulumStore.fetchKurikulumById(kurikulumId)
  }
})

// sub menu aktif
const activeSubmenu = computed(() => {
  const segments = route.path.split('/')
  return segments[segments.length - 1]
})

const submenuTitles = {
  'profil-lulusan': 'Profil Lulusan',
  'cpl-prodi': 'CPL Prodi',
  'cpl-sndikti': 'CPL SNDIKTI',
  'korelasi-cpl-pl': 'Korelasi CPL-PL',
  cpmk: 'CPMK',
  'bahan-kajian': 'Bahan Kajian',
  'struktur-matkul': 'Struktur Mata Kuliah',
  rps: 'RPS Mata Kuliah',
  'nilai-matkul': 'Nilai Mata Kuliah',
  'ukur-cpl': 'Pengukuran CPL Mahasiswa',
  mahasiswa: 'Mahasiswa',
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
  padding: 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.page-title {
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
}

.page-title h2 {
  font-weight: 700;
  font-size: 28px;
  margin-bottom: 8px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.5px;
}

.page-title p {
  color: #6b7280;
  font-size: 14px;
  font-weight: 500;
}

.page-title p a {
  color: var(--color-button);
  text-decoration: none;
  transition: all 0.2s ease;
  font-weight: 600;
}

.page-title p a:hover {
  color: var(--color-button-hover);
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
    padding: 20px;
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
