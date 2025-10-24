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
    <div class="header-container">
      <div class="header-content">
        <div class="header-left">
          <div class="logo-section">
            <img src="../assets/Undip.png" alt="Logo Undip" class="header-logo" />
            <div class="brand-info">
              <h1 class="brand-title">OBELIKS</h1>
              <p class="brand-subtitle">Departemen Informatika</p>
            </div>
          </div>
        </div>

        <!-- User Navigation (only show if authenticated and not on login page) -->
        <div v-if="auth.isAuthenticated && variant !== 'login'" class="header-right">
          <div class="user-nav" ref="dropdownRef">
            <button @click="toggleDropdown" class="user-button" :class="{ active: isDropdownOpen }">
              <div class="user-avatar">
                {{ userInitials }}
              </div>
              <div class="user-info">
                <span class="user-name">{{ auth.user?.nama || 'User' }}</span>
                <span class="user-role">Dosen</span>
              </div>
              <svg
                class="chevron-icon"
                :class="{ rotate: isDropdownOpen }"
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
    </div>
  </header>
</template>

<style scoped>
/* Header Base Styles */
.header {
  background-color: white;
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #e5e7eb;
  backdrop-filter: blur(8px);
  background-color: rgba(255, 255, 255, 0.95);
  transition: all 0.3s ease;
}

.header-default {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.header-login {
  position: relative;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.header-container {
  width: 100%;
  margin: 0;
  padding: 0 20px;
  box-sizing: border-box;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
  gap: 24px;
}

/* Left Section */
.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-logo {
  width: 46px;
  height: 46px;
  object-fit: contain;
  flex-shrink: 0;
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.brand-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  letter-spacing: -0.6px;
  line-height: 1.1;
}

.brand-subtitle {
  font-size: 13.5px;
  font-weight: 500;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  line-height: 1.2;
}

/* Right Section */
.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* User Navigation Styles */
.user-nav {
  position: relative;
}

.user-button {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 12px 7px 7px;
  background-color: white;
  border: 1.5px solid #e5e7eb;
  border-radius: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  min-width: 0;
}

.user-button:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.user-button.active {
  background-color: white;
  border-color: var(--color-button);
  box-shadow: 0 0 0 3px rgba(218, 42, 45, 0.08);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
  box-shadow: 0 2px 8px var(--color-text) 0.5;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: first baseline;
  gap: 2px;
  min-width: 0;
  max-width: 160px;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.user-role {
  font-size: 12px;
  font-weight: 400;
  color: #6b7280;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.2;
}

.chevron-icon {
  color: #9ca3af;
  transition:
    transform 0.3s ease,
    color 0.2s ease;
  flex-shrink: 0;
  margin-left: auto;
}

.user-button:hover .chevron-icon {
  color: #6b7280;
}

.chevron-icon.rotate {
  transform: rotate(180deg);
  color: var(--color-button);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 300px;
  background-color: white;
  border-radius: 16px;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.15),
    0 0 1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
  overflow: hidden;
  z-index: 1000;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px;
  background: linear-gradient(135deg, #f2fef3 0%, #ffffff 100%);
  border-bottom: 1px solid #fee2e2;
}

.dropdown-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  flex-shrink: 0;
  box-shadow: 0 4px 16px var(--color-buttonsec) 0.3;
}

.dropdown-user-info {
  flex: 1;
  min-width: 0;
}

.dropdown-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin: 0 0 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.dropdown-nip {
  font-size: 13px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  line-height: 1.3;
}

.dropdown-divider {
  height: 1px;
  background-color: #f3f4f6;
  margin: 0;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: 'Montserrat', sans-serif;
  font-size: 15px;
  font-weight: 600;
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
  animation: dropdown-in 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.dropdown-leave-active {
  animation: dropdown-out 0.2s ease-in;
}

@keyframes dropdown-in {
  0% {
    opacity: 0;
    transform: translateY(-12px) scale(0.96);
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
    transform: translateY(-8px) scale(0.98);
  }
}

/* Responsive Design */
@media (max-width: 992px) {
  .header-container {
    padding: 0 20px;
  }

  .header-content {
    height: 66px;
  }

  .brand-title {
    font-size: 20px;
  }

  .brand-subtitle {
    font-size: 13px;
  }

  .user-info {
    max-width: 140px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
  }

  .header-content {
    height: 60px;
  }

  .header-logo {
    width: 42px;
    height: 42px;
  }

  .brand-title {
    font-size: 18px;
  }

  .brand-subtitle {
    font-size: 12px;
  }

  .user-info {
    display: none;
  }

  .user-button {
    padding: 6px;
  }

  .dropdown-menu {
    min-width: 280px;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }

  .header-content {
    height: 56px;
    gap: 12px;
  }

  .logo-section {
    gap: 10px;
  }

  .header-logo {
    width: 36px;
    height: 36px;
  }

  .brand-title {
    font-size: 15px;
  }

  .brand-subtitle {
    font-size: 10px;
  }

  .user-avatar {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }

  .dropdown-menu {
    right: -8px;
    min-width: 260px;
  }

  .dropdown-header {
    padding: 16px;
  }

  .dropdown-avatar {
    width: 48px;
    height: 48px;
    font-size: 18px;
  }
}
</style>
