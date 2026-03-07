<script setup>
import { useRoute } from 'vue-router'
import { computed, onMounted } from 'vue'
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
  'sub-menu': 'Sub Menu Detail Kurikulum',
  'profil-lulusan': 'Profil Lulusan',
  'cpl-prodi': 'CPL Prodi',
  'cpl-sndikti': 'CPL SNDIKTI',
  'korelasi-cpl-pl': 'Korelasi CPL-PL',
  cpmk: 'CPMK',
  'bahan-kajian': 'Bahan Kajian',
  'struktur-matkul': 'Struktur Mata Kuliah',
  rps: 'RPS Mata Kuliah',
  'nilai-matkul': 'Nilai Mata Kuliah',
  'mk-periode': 'MK Periode',
  'ukur-cpl': 'Pengukuran CPL Mahasiswa',
  mahasiswa: 'Mahasiswa',
}

const subMenuPath = computed(() => `/kurikulum/${route.params.id}/sub-menu`)
const activeTitle = computed(() => submenuTitles[activeSubmenu.value] || 'Detail')
const isSubMenuLanding = computed(() => activeSubmenu.value === 'sub-menu')
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="page-header">
        <div class="page-title">
          <h2>{{ activeTitle }}</h2>
          <p class="breadcrumb">
            <RouterLink to="/kurikulum">Kurikulum</RouterLink>
            <span class="separator">/</span>
            <RouterLink :to="subMenuPath">Sub Menu Detail Kurikulum</RouterLink>
            <template v-if="!isSubMenuLanding">
              <span class="separator">/</span>
              <span>{{ activeTitle }}</span>
            </template>
          </p>
        </div>
        <Header />
      </div>

      <template v-if="isSubMenuLanding">
        <div class="kur-content-submenu">
          <div class="submenu-container">
            <RouterView />
          </div>
        </div>
      </template>
      <template v-if="!isSubMenuLanding">
        <div class="kur-content">
          <div class="submenu-container">
            <RouterView />
          </div>
        </div>

      </template>  
    </div>
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

.kur-content-submenu{
  flex: 1;
  margin: 20px 0px;
  padding: 16px 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.kur-content {
  flex: 1;
  margin: 20px 0px;
  padding: 16px 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 36px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.page-title {
  flex: 1;
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
    width: 100%;
  }

  .page-header {
    flex-direction: column;
    gap: 16px;
  }

  .page-title h2 {
    font-size: 22px;
  }
}
</style>
