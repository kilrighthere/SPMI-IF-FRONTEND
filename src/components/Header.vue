<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
})

const auth = useAuthStore()
const router = useRouter()
const isDropdownOpen = ref(false)
const dropdownRef = ref(null)

// mapping class sesuai variant
const variantClass = computed(() => {
  switch (props.variant) {
    case 'login':
      return 'header-login'
    default:
      return 'header-default'
  }
})

// Get user initials for avatar
const userInitials = computed(() => {
  if (!auth.user?.nama) return 'U'
  const names = auth.user.nama.split(' ')
  if (names.length >= 2) {
    return (names[0][0] + names[names.length - 1][0]).toUpperCase()
  }
  return auth.user.nama.substring(0, 2).toUpperCase()
})

// Toggle dropdown
function toggleDropdown() {
  isDropdownOpen.value = !isDropdownOpen.value
}

// Close dropdown when clicking outside
function handleClickOutside(event) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isDropdownOpen.value = false
  }
}

// Logout handler
async function handleLogout() {
  await auth.logout()
  isDropdownOpen.value = false
  router.push('/login')
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <header :class="['header', variantClass]">
    <div class="header-content">
      <div class="header-left">
        <img src="../assets/Undip.png" alt="Logo Undip" class="header-logo" />
        <h2 class="title">Outcome-Based Education Learning Integration and Knowledge System</h2>
      </div>

      <!-- User Navigation (only show if authenticated and not on login page) -->
      <div v-if="auth.isAuthenticated && variant !== 'login'" class="header-right">
        <div class="user-nav" ref="dropdownRef">
          <button @click="toggleDropdown" class="user-button" :class="{ active: isDropdownOpen }">
            <div class="user-avatar">
              {{ userInitials }}
            </div>
            <span class="user-name">{{ auth.user?.nama || 'User' }}</span>
            <svg
              class="chevron-icon"
              :class="{ rotate: isDropdownOpen }"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <transition name="dropdown">
            <div v-if="isDropdownOpen" class="dropdown-menu">
              <div class="dropdown-header">
                <div class="dropdown-avatar">
                  {{ userInitials }}
                </div>
                <div class="dropdown-user-info">
                  <p class="dropdown-name">{{ auth.user?.nama || 'User' }}</p>
                  <p class="dropdown-nip">NIP: {{ auth.user?.nip || '-' }}</p>
                </div>
              </div>

              <div class="dropdown-divider"></div>

              <button @click="handleLogout" class="dropdown-item logout-item">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                <span>Logout</span>
              </button>
            </div>
          </transition>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.header-default {
  height: 60px;
  padding: 25px 20px;
  background-color: var(--color-header);
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.119);
}

.header-content {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-login {
  height: 60px;
  padding: 25px 20px;
  background-color: var(--color-header);
  position: relative;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.119);
  box-sizing: border-box;
}

.header-logo {
  width: 45px;
  height: auto;
  margin-right: 15px;
}

.title {
  color: var(--color-text);
  margin: 0;
  font-size: 16px;
  letter-spacing: 0.2px;
  font-weight: 500;
  font-family: 'Montserrat';
}

/* User Navigation Styles */
.user-nav {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  background-color: transparent;
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
}

.user-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.user-button.active {
  background-color: #f9fafb;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(218, 42, 45, 0.1);
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-button) 0%, var(--color-button-hover) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chevron-icon {
  color: #6b7280;
  transition: transform 0.3s ease;
  flex-shrink: 0;
}

.chevron-icon.rotate {
  transform: rotate(180deg);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 280px;
  background-color: white;
  border-radius: 12px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.12),
    0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.dropdown-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--color-button) 0%, var(--color-button-hover) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(218, 42, 45, 0.3);
}

.dropdown-user-info {
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dropdown-nip {
  font-size: 13px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
}

.dropdown-divider {
  height: 1px;
  background-color: #e5e7eb;
  margin: 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Montserrat', sans-serif;
  font-size: 14px;
  font-weight: 500;
  text-align: left;
}

.logout-item {
  color: var(--color-button);
}

.logout-item:hover {
  background-color: #fef2f2;
}

.logout-item svg {
  flex-shrink: 0;
}

/* Dropdown Animation */
.dropdown-enter-active {
  animation: dropdown-in 0.3s ease-out;
}

.dropdown-leave-active {
  animation: dropdown-out 0.2s ease-in;
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes dropdown-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}

/* Responsive Design */
@media (max-width: 768px) {
  .title {
    font-size: 14px;
  }

  .user-name {
    display: none;
  }

  .user-button {
    padding: 8px;
  }

  .dropdown-menu {
    min-width: 260px;
  }
}

@media (max-width: 480px) {
  .title {
    font-size: 12px;
  }

  .header-logo {
    width: 35px;
    margin-right: 10px;
  }

  .dropdown-menu {
    right: -10px;
    min-width: 240px;
  }
}
</style>
