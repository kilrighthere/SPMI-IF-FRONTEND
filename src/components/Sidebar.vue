<script setup>
import { useRoute } from 'vue-router';

const route = useRoute();
const isLoginPage = route.path.toLowerCase() === '/login';
</script>

<template>
  <div class="sidebar">
    <div class="headline">
      <span class="title">SPMI-IF</span>
      <img src="../assets/Undip.png" alt="logo undip" />
    </div>

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
        <RouterLink to="/Kurikulum" class="menu-sidebar">
          <i class="ri-folder-2-fill"></i>
          <span class="menu-title">Kurikulum</span>
        </RouterLink>
      </template>
    </div>
  </div>
</template>

<style>
.sidebar {
  background-color: white;
  width: 256px;
  box-shadow: 5px 0px 15px rgba(0, 0, 0, 0.05);
  z-index: 50; /* Lower than header (100) */
  position: fixed;
  top: 70px; /* Match header height */
  bottom: 0;
  border-right: 1px solid rgb(222, 226, 230);
}

.headline {
  height: 70px; /* Match header height */
  padding: 0 15px;
  border-bottom: 1px solid rgb(222, 226, 230);
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  position: fixed;
  top: 0;
  width: 256px;
  background-color: white;
  z-index: 60;
}

.headline .title {
  font-size: 18px;
  font-weight: 600;
  order: 2;
}

.headline img {
  width: 40px;
  height: auto;
  order: 1;
}

.sidebar .menu {
  margin-top: 70px; /* Match headline height */
  padding: 15px 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 5px;
}

.menu-sidebar {
  text-decoration: none;
  padding: 12px 20px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  color: var(--color-text);
  border-left: 3px solid transparent;
  transition: all 0.2s ease;
}

.menu-sidebar:hover {
  background-color: rgba(176, 225, 255, 0.1);
  border-left: 3px solid var(--color-button);
}

.menu-sidebar.router-link-active {
  background-color: rgba(176, 225, 255, 0.2);
  border-left: 3px solid var(--color-button);
  font-weight: 500;
}

.menu-sidebar i {
  font-size: 18px;
}
</style>
