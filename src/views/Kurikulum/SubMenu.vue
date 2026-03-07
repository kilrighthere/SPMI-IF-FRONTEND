<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const userRole = computed(() => auth.user?.role?.toLowerCase())
const isDosenOrAdmin = computed(() => userRole.value === 'dosen' || userRole.value === 'admin')
const isMahasiswa = computed(() => userRole.value === 'mahasiswa')

const basePath = computed(() => `/kurikulum/${route.params.id}`)

const menuItems = computed(() => {
  const commonItems = [
    {
      key: 'profil-lulusan',
      title: 'Profil Lulusan',
      desc: 'Kelola profil lulusan program studi',
      icon: 'ri-user-star-line',
      to: `${basePath.value}/profil-lulusan`,
    },
    {
      key: 'cpl-prodi',
      title: 'CPL Prodi',
      desc: 'Capaian pembelajaran lulusan prodi',
      icon: 'ri-file-list-3-line',
      to: `${basePath.value}/cpl-prodi`,
    },
    {
      key: 'nilai-matkul',
      title: isMahasiswa.value ? 'Nilai Saya' : 'Nilai Mata Kuliah',
      desc: 'Lihat capaian nilai per mata kuliah',
      icon: 'ri-bar-chart-box-line',
      to: `${basePath.value}/nilai-matkul`,
    },
    {
      key: 'ukur-cpl',
      title: 'Pengukuran CPL Mahasiswa',
      desc: 'Ringkasan pengukuran CPL mahasiswa',
      icon: 'ri-line-chart-line',
      to: `${basePath.value}/ukur-cpl`,
    },
  ]

  if (!isDosenOrAdmin.value) return commonItems

  const dosenAdminItems = [
    {
      key: 'korelasi-cpl-pl',
      title: 'Korelasi CPL-PL',
      desc: 'Pemetaan CPL terhadap profil lulusan',
      icon: 'ri-table-line',
      to: `${basePath.value}/korelasi-cpl-pl`,
    },
    {
      key: 'cpl-sndikti',
      title: 'CPL SNDIKTI',
      desc: 'Pemetaan CPL ke standar nasional',
      icon: 'ri-government-line',
      to: `${basePath.value}/cpl-sndikti`,
    },
    {
      key: 'cpl-bk',
      title: 'CPL-BK',
      desc: 'Korelasi CPL dengan bahan kajian',
      icon: 'ri-node-tree',
      to: `${basePath.value}/cpl-bk`,
    },
    {
      key: 'bahan-kajian',
      title: 'Bahan Kajian',
      desc: 'Daftar bahan kajian kurikulum',
      icon: 'ri-book-open-line',
      to: `${basePath.value}/bahan-kajian`,
    },
    {
      key: 'struktur-matkul',
      title: 'Struktur Mata Kuliah',
      desc: 'Susunan mata kuliah pada kurikulum',
      icon: 'ri-organization-chart',
      to: `${basePath.value}/struktur-matkul`,
    },
    {
      key: 'bk-mk',
      title: 'BK MK',
      desc: 'Korelasi bahan kajian dan mata kuliah',
      icon: 'ri-database-2-line',
      to: `${basePath.value}/bk-mk`,
    },
    {
      key: 'cpmk',
      title: 'CPMK',
      desc: 'Capaian pembelajaran mata kuliah',
      icon: 'ri-file-text-line',
      to: `${basePath.value}/cpmk`,
    },
    {
      key: 'mk-periode',
      title: 'MK Periode',
      desc: 'Pengaturan mata kuliah per periode',
      icon: 'ri-calendar-check-line',
      to: `${basePath.value}/mk-periode`,
    },
    {
      key: 'bobot-cpmk',
      title: 'Bobot CPMK',
      desc: 'Pengaturan bobot penilaian CPMK',
      icon: 'ri-bar-chart-2-line',
      to: `${basePath.value}/bobot-cpmk`,
    },
    {
      key: 'nilai-cpmk',
      title: 'Nilai CPMK',
      desc: 'Rekap nilai capaian CPMK',
      icon: 'ri-line-chart-line',
      to: `${basePath.value}/nilai-cpmk`,
    },
    {
      key: 'mahasiswa',
      title: 'Mahasiswa',
      desc: 'Data mahasiswa terkait kurikulum',
      icon: 'ri-group-line',
      to: `${basePath.value}/mahasiswa`,
    },
  ]

  return [...commonItems, ...dosenAdminItems]
})
</script>

<template>
  <section class="submenu-page">
    <div class="submenu-grid">
      <RouterLink v-for="item in menuItems" :key="item.key" :to="item.to" class="submenu-card">
        <div class="card-head">
          <i :class="item.icon"></i>
          <h3>{{ item.title }}</h3>
        </div>
        <p>{{ item.desc }}</p>
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.submenu-page {
  width: 100%;
  padding: 10px 0;
}

.submenu-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.submenu-card {
  text-decoration: none;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 16px;
  color: var(--color-text);
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 120px;
  transition: all 0.25s ease;
}

.submenu-card:hover {
  transform: translateY(-3px);
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  border-color: var(--color-button);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.submenu-card:hover p{
    color: var(--color-text);
}

.card-head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-head i {
  font-size: 20px;
  color: var(--color-button);
}

.card-head h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.submenu-card p {
  margin: 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.45;
}

@media (max-width: 768px) {
  .submenu-grid {
    grid-template-columns: 1fr;
  }
}
</style>
