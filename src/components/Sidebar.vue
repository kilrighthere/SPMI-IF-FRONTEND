<script setup>
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const sidebarStore = useSidebarStore()
const auth = useAuthStore()

// cek login page
const isLoginPage = computed(() => route.path.toLowerCase() === '/login')

// cek kurikulum
const isKurikulumActive = computed(() => route.path.toLowerCase().startsWith('/kurikulum'))

// cek role user
const userRole = computed(() => auth.user?.role?.toLowerCase())
const isDosen = computed(() => userRole.value === 'dosen' || userRole.value === 'admin')

// Logout handler
async function handleLogout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="sidebar" :class="{ minimized: sidebarStore.isMinimized }">
    <div class="menu">
      <div class="menu-main">
        <!-- Toggle Button -->
        <div class="headerside">
          <h1 class="obeliks">OBELIKS</h1>
          <button
            class="sidebar-toggle"
            @click="sidebarStore.toggleSidebar"
            :title="sidebarStore.isMinimized ? 'Expand Sidebar' : 'Minimize Sidebar'"
          >
            <i :class="sidebarStore.isMinimized ? 'ri-menu-unfold-line' : 'ri-menu-fold-line'"></i>
          </button>
        </div>

        <template v-if="isLoginPage">
          <RouterLink
            to="/login"
            class="menu-sidebar"
            :title="sidebarStore.isMinimized ? 'User Login' : ''"
          >
            <i class="ri-user-fill"></i>
            <span class="menu-title" v-show="!sidebarStore.isMinimized">User Login</span>
          </RouterLink>
        </template>
        <template v-else>
          <RouterLink
            to="/dashboard"
            class="menu-sidebar"
            :title="sidebarStore.isMinimized ? 'Dashboard' : ''"
          >
            <i class="ri-dashboard-2-fill"></i>
            <span class="menu-title" v-show="!sidebarStore.isMinimized">Dashboard</span>
          </RouterLink>
          <RouterLink
            v-if="isDosen"
            to="/admin/dosen-wali"
            class="menu-sidebar"
            :title="sidebarStore.isMinimized ? 'Dosen Wali' : ''"
          >
            <i class="ri-team-fill"></i>
            <span class="menu-title" v-show="!sidebarStore.isMinimized">Dosen Wali</span>
          </RouterLink>
          <RouterLink
            to="/kurikulum/K2020/sub-menu"
            class="menu-sidebar"
            :class="{ 'router-link-active': isKurikulumActive }"
            :title="sidebarStore.isMinimized ? 'Kurikulum 2020' : ''"
          >
            <i class="ri-folder-2-fill"></i>
            <span class="menu-title" v-show="!sidebarStore.isMinimized">Kurikulum 2020</span>
          </RouterLink>
        </template>
      </div>
      <button
        @click="handleLogout"
        class="menu-sidebar logout-menu"
        type="button"
        :title="sidebarStore.isMinimized ? 'Logout' : ''"
      >
        <i class="ri-logout-box-r-fill"></i>
        <span class="menu-title" v-show="!sidebarStore.isMinimized">Logout</span>
      </button>
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
  top: 20px;
  bottom: 20px;
  padding: 16px;
  border-radius: 16px;
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
}

.sidebar.minimized {
  width: 80px;
  padding: 16px 12px;
}

/* Custom Scrollbar */
.menu::-webkit-scrollbar {
  width: 6px;
}

.menu::-webkit-scrollbar-track {
  background: transparent;
  margin: 8px 0;
}

.menu::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 10px;
  transition: background 0.2s ease;
}

.menu::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.obeliks {
  font-size: 20px;
  font-weight: 800;
  font-family: sans-serif;
  color: var(--color-button);
}
.headerside {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.sidebar.minimized .obeliks {
  display: none;
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
  /* margin-bottom: 12px; */
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
  justify-content: space-between;
  flex: 1;
  min-height: 0;
}

.menu-main {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.logout-menu {
  margin-top: auto;
  flex-shrink: 0;
  width: 100%;
  gap: 14px;
  justify-content: flex-start;
  text-align: left;
  background: transparent;
  appearance: none;
  -webkit-appearance: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
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
