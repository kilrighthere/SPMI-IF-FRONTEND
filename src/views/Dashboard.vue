<script setup>
import { computed } from 'vue'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'
import { useAuthStore } from '@/stores/auth'

const sidebarStore = useSidebarStore()
const authStore = useAuthStore()

// Get user data from store
const user = computed(() => authStore.user)
const isAuthenticated = computed(() => authStore.isAuthenticated)

// Get current time for greeting
const currentHour = new Date().getHours()
const greeting = computed(() => {
  if (currentHour < 12) return 'Selamat Pagi'
  if (currentHour < 15) return 'Selamat Siang'
  if (currentHour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
})

// Format role display
const roleDisplay = computed(() => {
  if (!user.value?.role) return 'User'
  return user.value.role.charAt(0).toUpperCase() + user.value.role.slice(1)
})

// Get user identifier (NIM/NIP)
const userIdentifier = computed(() => {
  if (user.value?.nim) return user.value.nim
  if (user.value?.nip) return user.value.nip
  return '-'
})

const identifierLabel = computed(() => {
  if (user.value?.nim) return 'NIM'
  if (user.value?.nip) return 'NIP'
  return 'ID'
})
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="dash">
        <!-- Welcome Section -->
        <div class="welcome-section">
          <div class="greeting-wrapper">
            <div class="greeting-header">
              <h1 class="greeting-title">
                {{ greeting }}, <span class="user-name">{{ user?.name || 'User' }}</span>
                <span class="wave-emoji">👋</span>
              </h1>
              <div class="session-status-inline">
                <span class="status-indicator" :class="{ active: isAuthenticated }"></span>
                <span class="status-text">{{ isAuthenticated ? 'Aktif' : 'Tidak Aktif' }}</span>
              </div>
            </div>
            <p class="greeting-subtitle">
              Selamat datang di OBELISK (Outcome-Based Education Learning Integration and Knowledge
              System)
            </p>
          </div>
        </div>

        <!-- User Info Cards -->
        <div class="info-cards-grid">
          <!-- Profile Card -->
          <div class="info-card profile-card">
            <div class="card-icon profile-icon">
              <i class="ri-user-line"></i>
            </div>
            <div class="card-content">
              <h3 class="card-label">Nama Lengkap</h3>
              <p class="card-value">{{ user?.name || '-' }}</p>
            </div>
          </div>

          <!-- ID Card (NIM/NIP) -->
          <div class="info-card id-card">
            <div class="card-icon id-icon">
              <i :class="user?.nim ? 'ri-user-star-line' : 'ri-shield-star-line'"></i>
            </div>
            <div class="card-content">
              <h3 class="card-label">{{ identifierLabel }}</h3>
              <p class="card-value">{{ userIdentifier }}</p>
            </div>
          </div>

          <!-- Role Card -->
          <div class="info-card role-card">
            <div class="card-icon role-icon">
              <i class="ri-shield-user-line"></i>
            </div>
            <div class="card-content">
              <h3 class="card-label">Peran</h3>
              <p class="card-value">{{ roleDisplay }}</p>
            </div>
          </div>
        </div>

        <!-- Quick Info Section -->
        <div class="quick-info-section">
          <div class="info-box">
            <div class="info-icon">
              <i class="ri-information-line"></i>
            </div>
            <div class="info-text">
              <h4>Tentang Sistem</h4>
              <p>
                Outcome-Based Education Learning Integration and Knowledge System Informatika
                dirancang untuk memastikan kualitas pendidikan yang konsisten dan berkelanjutan.
                Melalui sistem ini, Anda dapat mengakses berbagai informasi terkait kurikulum, mata
                kuliah, dan penilaian mahasiswa.
              </p>
            </div>
          </div>
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
  min-height: 100vh;
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

.dash {
  flex: 1;
  margin-top: 92px;
  padding: 32px;
  border-radius: 20px;
  background: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Welcome Section */
.welcome-section {
  padding: 24px 0;
  border-bottom: 2px solid var(--color-border2);
}

.greeting-wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.greeting-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  flex-wrap: wrap;
}

.greeting-title {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.user-name {
  color: var(--spmi-c-green2);
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.wave-emoji {
  display: inline-block;
  animation: wave 2.5s ease-in-out infinite;
  transform-origin: 70% 70%;
  font-size: 32px;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  10%,
  30% {
    transform: rotate(14deg);
  }
  20%,
  40% {
    transform: rotate(-8deg);
  }
  50% {
    transform: rotate(14deg);
  }
  60% {
    transform: rotate(0deg);
  }
}

.greeting-subtitle {
  font-size: 16px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  line-height: 1.6;
}

/* Session Status Inline */
.session-status-inline {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50px;
  border: 1.5px solid #e5e7eb;
  transition: all 0.3s ease;
}

.session-status-inline:hover {
  border-color: var(--spmi-c-green2);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.15);
}

.session-status-inline .status-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

/* Info Cards Grid */
.info-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-top: 8px;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
  border-radius: 16px;
  border: 1.5px solid #e5e7eb;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.info-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--spmi-c-green2);
  transform: scaleY(0);
  transition: transform 0.3s ease;
}

.info-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: var(--spmi-c-green2);
}

.info-card:hover::before {
  transform: scaleY(1);
}

.card-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  flex-shrink: 0;
  transition: all 0.3s ease;
}

.profile-icon {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
  color: #3b82f6;
}

.id-icon {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #f59e0b;
}

.role-icon {
  background: linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%);
  color: #a855f7;
}

.session-icon {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #10b981;
}

.info-card:hover .card-icon {
  transform: scale(1.1) rotate(5deg);
}

.card-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-label {
  font-size: 13px;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-family: 'Montserrat', sans-serif;
}

.card-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  word-break: break-word;
}

.status-indicator {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ef4444;
  position: relative;
  flex-shrink: 0;
}

.status-indicator.active {
  background-color: #10b981;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(16, 185, 129, 0);
  }
}

/* Quick Info Section */
.quick-info-section {
  margin-top: 8px;
}

.info-box {
  display: flex;
  gap: 20px;
  padding: 28px;
  background: linear-gradient(135deg, white 0%, #faffec 100%);
  border-radius: 16px;
  border: 1.5px solid #e8f5c4;
  position: relative;
  overflow: hidden;
}

.info-box::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -10%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(166, 214, 0, 0.1) 0%, transparent 70%);
  border-radius: 50%;
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.3);
}

.info-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-text h4 {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.info-text p {
  font-size: 15px;
  color: #4b5563;
  line-height: 1.7;
  font-family: 'Montserrat', sans-serif;
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
  }

  .greeting-title {
    font-size: 32px;
  }

  .greeting-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .info-cards-grid {
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
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

  .dash {
    margin-top: 76px;
    padding: 24px;
    gap: 24px;
  }

  .greeting-title {
    font-size: 28px;
  }

  .wave-emoji {
    font-size: 28px;
  }

  .greeting-subtitle {
    font-size: 14px;
  }

  .session-status-inline {
    padding: 8px 16px;
  }

  .session-status-inline .status-text {
    font-size: 13px;
  }

  .info-cards-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .info-card {
    padding: 20px;
  }

  .card-icon {
    width: 48px;
    height: 48px;
    font-size: 24px;
  }

  .info-box {
    flex-direction: column;
    padding: 24px;
  }

  .info-icon {
    width: 40px;
    height: 40px;
    font-size: 20px;
  }
}

@media (max-width: 480px) {
  .greeting-title {
    font-size: 24px;
    gap: 8px;
  }

  .user-name {
    display: block;
    margin-top: 4px;
  }

  .wave-emoji {
    font-size: 24px;
  }

  .card-value {
    font-size: 16px;
  }

  .info-text h4 {
    font-size: 18px;
  }

  .info-text p {
    font-size: 14px;
  }
}
</style>
