<script setup>
import { useRoute } from 'vue-router'
import { computed } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const sidebarStore = useSidebarStore()
const auth = useAuthStore()

// cek login page
const isLoginPage = computed(() => route.path.toLowerCase() === '/login')

// cek kurikulum
const isKurikulumActive = computed(() => route.path.toLowerCase().startsWith('/kurikulum'))
const kurikulumId = computed(() => route.params.id)

// cek role user
const userRole = computed(() => auth.user?.role?.toLowerCase())
const isMahasiswa = computed(() => userRole.value === 'mahasiswa')
const isDosen = computed(() => userRole.value === 'dosen' || userRole.value === 'admin')
</script>

<template>
  <div class="sidebar" :class="{ minimized: sidebarStore.isMinimized }">
    <div class="menu">
      <!-- Toggle Button -->
      <button
        class="sidebar-toggle"
        @click="sidebarStore.toggleSidebar"
        :title="sidebarStore.isMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'"
      >
        <i :class="sidebarStore.isMinimized ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'"></i>
      </button>

      <template v-if="isLoginPage">
        <RouterLink
          to="/Login"
          class="menu-sidebar"
          :title="sidebarStore.isMinimized ? 'User Login' : ''"
        >
          <i class="ri-user-fill"></i>
          <span class="menu-title" v-show="!sidebarStore.isMinimized">User Login</span>
        </RouterLink>
      </template>
      <template v-else>
        <RouterLink
          to="/Dashboard"
          class="menu-sidebar"
          :title="sidebarStore.isMinimized ? 'Dashboard' : ''"
        >
          <i class="ri-dashboard-2-fill"></i>
          <span class="menu-title" v-show="!sidebarStore.isMinimized">Dashboard</span>
        </RouterLink>
        <RouterLink
          to="/Kurikulum"
          class="menu-sidebar"
          :class="{ 'router-link-active': isKurikulumActive }"
          :title="sidebarStore.isMinimized ? 'Kurikulum' : ''"
          v-if="!isMahasiswa"
        >
          <i class="ri-folder-2-fill"></i>
          <span class="menu-title" v-show="!sidebarStore.isMinimized">Kurikulum</span>
        </RouterLink>

        <!-- Submenu - Show when kurikulumId exists -->
        <div class="submenu" v-if="kurikulumId | isMahasiswa" >
          <RouterLink
            :to="`/kurikulum/${kurikulumId}/profil-lulusan`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? 'Profil Lulusan' : ''"
          >
            <i class="ri-user-star-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized">Profil Lulusan</span>
          </RouterLink>
          <RouterLink
            :to="`/kurikulum/${kurikulumId}/cpl-prodi`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? 'CPL Prodi' : ''"
          >
            <i class="ri-file-list-3-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized">CPL Prodi</span>
          </RouterLink>
          <!-- Menu khusus untuk Dosen/Admin -->
          <template v-if="isDosen">
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/cpl-sndikti`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'CPL SNDIKTI' : ''"
            >
              <i class="ri-government-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">CPL SNDIKTI</span>
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/korelasi-cpl-pl`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'Korelasi CPL-PL' : ''"
            >
              <i class="ri-table-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">Korelasi CPL-PL</span>
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/cpmk`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'CPMK' : ''"
            >
              <i class="ri-file-text-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">CPMK</span>
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/bahan-kajian`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'Bahan Kajian' : ''"
            >
              <i class="ri-book-open-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">Bahan Kajian</span>
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/cpmk-mk`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'Korelasi CPMK MK' : ''"
            >
              <i class="ri-links-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">CPMK MK</span>
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/struktur-matkul`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'Struktur Mata Kuliah' : ''"
            >
              <i class="ri-organization-chart"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized"
                >Struktur Mata Kuliah</span
              >
            </RouterLink>
            <RouterLink
              :to="`/kurikulum/${kurikulumId}/kurikulum-mk`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'Kurikulum Mata Kuliah' : ''"
            >
              <i class="ri-file-list-3-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">Kurikulum MK</span>
            </RouterLink>
            <!-- <RouterLink
              :to="`/kurikulum/${kurikulumId}/rps`"
              class="menu-kurikulum"
              :title="sidebarStore.isMinimized ? 'RPS Mata Kuliah' : ''"
            >
              <i class="ri-book-2-line"></i>
              <span class="submenu-title" v-show="!sidebarStore.isMinimized">RPS Mata Kuliah</span>
            </RouterLink> -->
          </template>

          <!-- Menu Nilai Mata Kuliah - untuk semua role -->
          <RouterLink
            :to="`/kurikulum/${kurikulumId}/nilai-matkul`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? (isMahasiswa ? 'Nilai Saya' : 'Nilai Mata Kuliah') : ''"
          >
            <i class="ri-bar-chart-box-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized">
              {{ isMahasiswa ? 'Nilai Saya' : 'Nilai Mata Kuliah' }}
            </span>
          </RouterLink>
          <RouterLink
            :to="`/kurikulum/${kurikulumId}/ukur-cpl`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? 'Pengukuran CPL Mahasiswa' : ''"
          >
            <i class="ri-line-chart-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized"
              >Pengukuran CPL Mahasiswa</span
            >
          </RouterLink>
          <!-- Menu Mahasiswa - berbeda untuk mahasiswa dan dosen -->
          <RouterLink
            v-if="isDosen"
            :to="`/kurikulum/${kurikulumId}/mahasiswa`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? 'Mahasiswa' : ''"
          >
            <i class="ri-group-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized">Mahasiswa</span>
          </RouterLink>
          <!-- <RouterLink
            v-else-if="isMahasiswa"
            :to="`/kurikulum/${kurikulumId}/mahasiswa`"
            class="menu-kurikulum"
            :title="sidebarStore.isMinimized ? 'Profil Saya' : ''"
          >
            <i class="ri-user-line"></i>
            <span class="submenu-title" v-show="!sidebarStore.isMinimized">Profil Saya</span>
          </RouterLink> -->
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.sidebar {
  background: linear-gradient(90deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  width: 260px;
  z-index: 50;
  position: fixed;
  left: 20px;
  top: 92px;
  bottom: 90px;
  padding: 16px;
  border-radius: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.sidebar.minimized {
  width: 80px;
  padding: 16px 12px;
}

/* Custom Scrollbar */
.sidebar::-webkit-scrollbar {
  width: 6px;
}

.sidebar::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.sidebar::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  transition: background 0.2s ease;
}

.sidebar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

/* Toggle Button */
.sidebar-toggle {
  position: relative;
  width: auto;
  height: auto;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  margin-bottom: 12px;
  align-self: flex-start;
}

.sidebar.minimized .sidebar-toggle {
  align-self: center;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.25);
  color: var(--color-text);
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.sidebar-toggle:active {
  transform: scale(0.98);
}

.sidebar-toggle i {
  font-size: 20px;
  line-height: 1;
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Menu Container */
.menu {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  box-sizing: border-box;
}

/* Main Menu Items */
.menu-sidebar {
  text-decoration: none;
  padding: 13px 16px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 14px;
  color: var(--color-text);
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 12px;
  position: relative;
  font-weight: 500;
  font-size: 14.5px;
  white-space: nowrap;
  overflow: hidden;
  border: 2px solid transparent;
}

.sidebar.minimized .menu-sidebar {
  justify-content: center;
  padding: 13px;
  gap: 0;
}

.menu-sidebar:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: var(--color-text);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar:not(.minimized) .menu-sidebar:hover {
  transform: translateX(3px);
}

.sidebar.minimized .menu-sidebar:hover {
  transform: scale(1.08);
}

.menu-sidebar.router-link-active {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.98) 100%);
  color: var(--color-button);
  font-weight: 700;
  border-color: var(--color-button);
  box-shadow: 0 4px 16px var(--color-button) 0 0 0 1px var(--color-buttonsec);
}

.menu-sidebar.router-link-active i {
  color: var(--color-button);
}

.menu-sidebar.router-link-active:hover {
  box-shadow:
    0 6px 20px var(--color-text) 0.5,
    0 0 0 1px var(--color-buttonsec);
}

.sidebar:not(.minimized) .menu-sidebar.router-link-active:hover {
  transform: scale(1.03);
}

.sidebar.minimized .menu-sidebar.router-link-active:hover {
  transform: scale(1.1);
}

.menu-sidebar i {
  font-size: 21px;
  flex-shrink: 0;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.9;
  min-width: 21px;
  text-align: center;
}

.menu-sidebar:hover i {
  opacity: 1;
}

.sidebar:not(.minimized) .menu-sidebar:hover i {
  transform: scale(1.15);
}

.sidebar.minimized .menu-sidebar:hover i {
  transform: scale(1.1);
}

.menu-sidebar.router-link-active i {
  opacity: 1;
  filter: drop-shadow(0 2px 4px rgba(218, 42, 45, 0.3));
}

.sidebar:not(.minimized) .menu-sidebar.router-link-active i {
  transform: scale(1.05);
}

.sidebar.minimized .menu-sidebar.router-link-active i {
  transform: scale(1);
}

.menu-title {
  flex: 1;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  font-family: 'Montserrat', sans-serif;
  min-width: 0;
}

.sidebar.minimized .menu-title {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Submenu */
.submenu {
  display: flex;
  flex-direction: column;
  margin-left: 0;
  margin-top: 4px;
  gap: 2px;
  padding-left: 0;
  border-left: none;
  opacity: 1;
  max-height: 1000px;
  transition: all 0.3s ease;
}

.sidebar.minimized .submenu {
  margin-left: 0;
  padding-left: 0;
}

.menu-kurikulum {
  text-decoration: none;
  color: var(--color-text);
  font-size: 13.5px;
  padding: 10px 14px;
  box-sizing: border-box;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 10px;
  font-weight: 500;
  position: relative;
  font-family: 'Montserrat', sans-serif;
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar.minimized .menu-kurikulum {
  justify-content: center;
  padding: 11px;
  gap: 0;
}

.menu-kurikulum i {
  font-size: 18px;
  flex-shrink: 0;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0.9;
  min-width: 18px;
  text-align: center;
}

.menu-kurikulum:hover {
  background-color: rgba(255, 255, 255, 0.12);
  color: var(--color-text);
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.sidebar:not(.minimized) .menu-kurikulum:hover {
  transform: translateX(2px);
}

.sidebar.minimized .menu-kurikulum:hover {
  transform: scale(1.05);
}

.menu-kurikulum:hover i {
  opacity: 1;
}

.sidebar:not(.minimized) .menu-kurikulum:hover i {
  transform: scale(1.1);
}

.sidebar.minimized .menu-kurikulum:hover i {
  transform: scale(1.05);
}

.menu-kurikulum.router-link-active {
  background-color: var(--color-button);
  color: rgba(255, 255, 255, 0.95);
  font-weight: 600;
  border: 2px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.menu-kurikulum.router-link-active i {
  opacity: 1;
  color: rgba(255, 255, 255, 0.95);
}

.menu-kurikulum.router-link-active:hover {
  background-color: #2d2d2d;
  border-color: rgba(255, 255, 255, 0.25);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
}

.sidebar:not(.minimized) .menu-kurikulum.router-link-active:hover {
  transform: scale(1.02);
}

.sidebar.minimized .menu-kurikulum.router-link-active:hover {
  transform: scale(1.08);
}

.submenu-title {
  font-size: 13.5px;
  font-weight: inherit;
  line-height: 1.4;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  min-width: 0;
  text-wrap:initial;
}

.sidebar.minimized .submenu-title {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Responsive */
@media (max-width: 1024px) {
  .sidebar {
    left: 16px;
    width: 240px;
  }

  .sidebar.minimized {
    width: 72px;
  }
}

@media (max-width: 768px) {
  .sidebar {
    left: 12px;
    top: 76px;
    bottom: 76px;
    width: 220px;
  }

  .sidebar.minimized {
    width: 64px;
  }
}
</style>
