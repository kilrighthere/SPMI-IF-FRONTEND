<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'

const route = useRoute()
// cek login page
const isLoginPage = computed(() => route.path.toLowerCase() === '/login')

// cek kurikulum
const isKurikulumActive = computed(() => route.path.toLowerCase().startsWith('/kurikulum'))
const kurikulumId = computed(() => route.params.id)
</script>

<template>
  <div class="sidebar">
    <div class="menu">
      <template v-if="isLoginPage">
        <RouterLink to="/Login" class="menu-sidebar">
          <i class="ri-user-fill"></i>
          <span class="menu-title">User Login</span>
        </RouterLink>
      </template>
      <template v-else>
        <RouterLink to="/Dashboard" class="menu-sidebar">
          <i class="ri-dashboard-2-fill"></i>
          <span class="menu-title">Dashboard</span>
        </RouterLink>
        <RouterLink
          to="/Kurikulum"
          class="menu-sidebar"
          :class="{ 'router-link-active': isKurikulumActive }"
        >
          <i class="ri-folder-2-fill"></i>
          <span class="menu-title">Kurikulum</span>
        </RouterLink>

        <div class="submenu" v-if="kurikulumId">
          <RouterLink :to="`/kurikulum/${kurikulumId}/profil-lulusan`" class="menu-kurikulum">
            <span class="submenu-title">Profil Lulusan</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/cpl-prodi`" class="menu-kurikulum">
            <span class="submenu-title">CPL Prodi</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/korelasi-pl`" class="menu-kurikulum">
            <span class="submenu-title">Korelasi PL-CPL</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/cpmk`" class="menu-kurikulum">
            <span class="submenu-title">CPMK</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/struktur-matkul`" class="menu-kurikulum">
            <span class="submenu-title">Struktur Mata Kuliah</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/rps`" class="menu-kurikulum">
            <span class="submenu-title">RPS Mata Kuliah</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/nilai-matkul`" class="menu-kurikulum">
            <span class="submenu-title">Nilai Mata Kuliah</span>
          </RouterLink>
          <RouterLink :to="`/kurikulum/${kurikulumId}/ukur-cpl`" class="menu-kurikulum">
            <span class="submenu-title">Pengukuran CPL Mahasiswa</span>
          </RouterLink>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  background-color: var(--color-sidebar);
  width: 230px;
  z-index: 50; /* Lower than header (100) */
  position: fixed;
  left: 20px;
  top: 80px; /* Match header height */
  bottom: 70px;
  padding: 0 20px;
  border-radius: 12px;
  box-sizing: border-box;
  overflow: auto;
  box-shadow: 0px 0px 15px 0px rgba(33, 33, 33, 0.269);
}

.submenu {
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  margin-left: 41px;
  gap: 3px;
  flex-wrap: wrap;
  box-sizing: border-box;
}

.menu-kurikulum {
  text-decoration: none;
  color: var(--color-text-light);
  font-size: 13px;
  padding: 7px 10px;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.submenu-title {
  font-size: 13px; /* Ensure this is consistent with the menu-kurikulum font size */
  font-weight: normal;
}

.sidebar .menu {
  /* Match headline height */
  padding: 20px 0;
  display: flex;
  flex-direction: column;
  /* align-items: center; */
  gap: 5px;
  box-sizing: border-box;
  overflow: hidden;
}

.menu-kurikulum:hover {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 10px;
}
.menu-kurikulum.router-link-active {
  background-color: var(--color-buttonsec);
  border-radius: 10px;
  font-weight: 500;
}

.menu-sidebar {
  text-decoration: none;
  padding: 12px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  color: var(--color-text-light);
  transition: all 0.2s ease;
}

.menu-sidebar:hover {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 15px;
}

.menu-sidebar.router-link-active {
  background-color: var(--color-buttonsec);
  border-radius: 15px;
  /* border-left: 5px solid var(--color-text); */
  font-weight: 500;
}

.menu-sidebar i {
  font-size: 18px;
}
</style>
