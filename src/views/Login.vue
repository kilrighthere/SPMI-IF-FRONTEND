<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)
const selectedRole = ref('mahasiswa') // default mahasiswa
const router = useRouter()
const auth = useAuthStore()

// Computed untuk label input username berdasarkan role
const usernameLabel = computed(() => {
  return selectedRole.value === 'mahasiswa' ? 'NIM' : 'NIP'
})

// Computed untuk placeholder input username
const usernamePlaceholder = computed(() => {
  return selectedRole.value === 'mahasiswa' ? 'Contoh: 12345678' : 'Enter your NIP'
})

function toggleRole(role) {
  selectedRole.value = role
  // Clear error when switching role
  auth.error = null
}

async function loginHandler(e) {
  e.preventDefault()
  auth.error = null

  if (!username.value || !password.value) {
    auth.error = 'Username dan password wajib diisi'
    return
  }

  // Prepare credentials based on role
  const credentials = {
    password: password.value,
  }

  if (selectedRole.value === 'mahasiswa') {
    credentials.nim = username.value
  } else {
    credentials.nip = username.value
  }

  const res = await auth.login(credentials, selectedRole.value)
  if (res.success) {
    router.push('/dashboard')
  } else {
    // auth.error already set inside store
    // nothing else to do
  }
}

function togglePasswordVisibility() {
  showPassword.value = !showPassword.value
}
</script>

<template>
  <div class="all-contain">
    <!-- <Header variant="login" /> -->
    <div class="container-login">
      <div class="login-part">
        <div class="card-login">
          <form @submit="loginHandler" class="form-login" method="post">
            <div class="header-form">
              <h1 class="welcome-title">
                Welcome back
                <span class="wave-emoji">👋</span>
              </h1>
              <p class="welcome-subtitle">Please enter your details.</p>

              <!-- Dummy Auth Info - Remove when server is back online -->
              <div class="dummy-auth-info">
                <i class="ri-information-line"></i>
                <div>
                  <strong>Development Mode:</strong> Akun dummy tersedia:<br />
                  <strong>Admin:</strong> 444444444444444444 |
                  <strong>Dosen:</strong> 5555555555555555555<br />
                  <strong>Mahasiswa:</strong> 24060120140005 atau 24060120111111
                </div>
              </div>
            </div>

            <!-- Role Selection Toggle -->
            <div class="role-toggle-container">
              <button
                type="button"
                class="role-toggle-btn"
                :class="{
                  'active-mahasiswa': selectedRole === 'mahasiswa',
                  'active-dosen': selectedRole === 'dosen',
                }"
                @click="toggleRole('mahasiswa')"
              >
                Mahasiswa
              </button>
              <button
                type="button"
                class="role-toggle-btn"
                :class="{
                  'active-mahasiswa': selectedRole === 'mahasiswa',
                  'active-dosen': selectedRole === 'dosen',
                }"
                @click="toggleRole('dosen')"
              >
                Dosen
              </button>
            </div>

            <div class="main-form">
              <div class="input-group">
                <label for="Username" class="input-label">{{ usernameLabel }}</label>
                <div class="input-wrapper">
                  <input
                    v-model="username"
                    type="text"
                    name="Username"
                    id="Username"
                    :placeholder="usernamePlaceholder"
                    class="form-input"
                    :class="{
                      'input-mahasiswa': selectedRole === 'mahasiswa',
                      'input-dosen': selectedRole === 'dosen',
                    }"
                  />
                </div>
              </div>

              <div class="input-group">
                <label for="Password" class="input-label">Password</label>
                <div class="input-wrapper">
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="Password"
                    id="Password"
                    placeholder="Enter your password"
                    class="form-input password-input"
                    :class="{
                      'input-mahasiswa': selectedRole === 'mahasiswa',
                      'input-dosen': selectedRole === 'dosen',
                    }"
                  />
                  <button
                    v-if="password"
                    type="button"
                    @click="togglePasswordVisibility"
                    class="password-toggle"
                    tabindex="-1"
                  >
                    <svg
                      v-if="!showPassword"
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <svg
                      v-else
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
                      <path
                        d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
                      ></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  </button>
                </div>
              </div>

              <!-- Remember Me Checkbox -->
              <div class="remember-me-container">
                <label class="remember-me-label">
                  <input type="checkbox" v-model="rememberMe" class="remember-checkbox" />
                  <span>Ingat saya</span>
                </label>
              </div>

              <p v-if="auth.error" class="error-message">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
                {{ auth.error }}
              </p>
            </div>

            <div class="submit-section">
              <button
                type="submit"
                class="btn-login"
                :class="{
                  'btn-mahasiswa': selectedRole === 'mahasiswa',
                  'btn-dosen': selectedRole === 'dosen',
                }"
                :disabled="auth.isLoading"
              >
                <span v-if="auth.isLoading" class="btn-content">
                  <svg
                    class="spinner"
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
                    <line x1="12" y1="2" x2="12" y2="6"></line>
                    <line x1="12" y1="18" x2="12" y2="22"></line>
                    <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                    <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                    <line x1="2" y1="12" x2="6" y2="12"></line>
                    <line x1="18" y1="12" x2="22" y2="12"></line>
                    <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                    <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                  </svg>
                  Signing in...
                </span>
                <span v-else class="btn-content">Masuk</span>
              </button>

              <p class="version-text">Versi beta © 2025</p>
            </div>
          </form>
        </div>
      </div>
      <div class="image">
        <img src="../assets/if.png" alt="informatika" />
      </div>
    </div>
    <!-- <Footer variant="login" /> -->
  </div>
</template>

<style scoped>
.all-contain {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 100vh;
  background-color: var(--color-background);
}

.container-login {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden;
  padding: 20px;
  gap: 40px;
  box-sizing: border-box;
}

.login-part {
  order: 2;
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.image {
  flex: 1.5;
  height: 100%;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.card-login {
  width: 100%;
  max-width: 480px;
}

.form-login {
  background-color: white;
  padding: 50px 45px;
  border-radius: 24px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.08),
    0 2px 8px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: 32px;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.form-login:hover {
  transform: translateY(-2px);
  box-shadow:
    0 15px 50px rgba(0, 0, 0, 0.12),
    0 4px 12px rgba(0, 0, 0, 0.06);
}

/* Header Section */
.header-form {
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
}

.welcome-title {
  font-size: 36px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  line-height: 1.2;
  letter-spacing: 2px;
}

/* Dummy Auth Info Box */
.dummy-auth-info {
  margin-top: 16px;
  padding: 14px 16px;
  background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
  border: 1.5px solid #fdba74;
  border-radius: 12px;
  display: flex;
  align-items: flex-start;
  gap: 12px;
  font-family: 'Montserrat', sans-serif;
  color: #92400e;
  font-size: 13px;
  line-height: 1.5;
}

.dummy-auth-info i {
  font-size: 20px;
  color: #f59e0b;
  flex-shrink: 0;
  margin-top: 2px;
}

.dummy-auth-info strong {
  color: #78350f;
  font-weight: 700;
}

/* Role Toggle */
.role-toggle-container {
  display: flex;
  gap: 0;
  background-color: #e5e7eb;
  border-radius: 50px;
  padding: 4px;
  position: relative;
}

.role-toggle-btn {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 50px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  background-color: transparent;
  color: #6b7280;
  position: relative;
  z-index: 1;
}

.role-toggle-btn.active-mahasiswa:first-child {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  box-shadow: 0 2px 8px rgba(166, 214, 0, 0.3);
}

.role-toggle-btn.active-dosen:last-child {
  background: linear-gradient(135deg, var(--spmi-c-dgray) 0%, var(--color-button) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(46, 45, 51, 0.3);
}

.role-toggle-btn:hover:not(.active-mahasiswa):not(.active-dosen) {
  color: var(--color-text);
}

/* Main Form */
.main-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 14px;
  color: #9ca3af;
  pointer-events: none;
  z-index: 1;
}

.form-input {
  width: 100%;
  padding: 13px 16px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 15px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.form-input.input-mahasiswa:focus {
  outline: none;
  border-color: var(--spmi-c-green2);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(166, 214, 0, 0.1);
}

.form-input.input-dosen:focus {
  outline: none;
  border-color: var(--color-button);
  background-color: white;
  box-shadow: 0 0 0 4px rgba(46, 45, 51, 0.1);
}

.password-input {
  padding-right: 44px;
}

.form-input::placeholder {
  color: #9ca3af;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #9ca3af;
  cursor: pointer;
  padding: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;
  z-index: 2;
  border-radius: 6px;
}

.password-toggle:hover {
  color: var(--color-text);
  background-color: rgba(0, 0, 0, 0.05);
}

.password-toggle:active {
  background-color: rgba(0, 0, 0, 0.1);
}

/* Form Options */
.remember-me-container {
  display: flex;
  justify-content: flex-start;
  margin-top: 4px;
}

.remember-me-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  user-select: none;
}

.remember-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
  accent-color: var(--spmi-c-green2);
}

.forgot-password-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.forgot-password {
  font-size: 14px;
  color: var(--color-button);
  text-decoration: none;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  transition: color 0.2s ease;
}

.forgot-password:hover {
  color: var(--color-buttonsec);
  text-decoration: underline;
}

/* Error Message */
.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-button);
  font-size: 14px;
  background-color: #fef2f2;
  padding: 12px 16px;
  border-radius: 10px;
  border-left: 3px solid var(--color-button);
  line-height: 1.4;
}

/* Submit Section */
.submit-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.btn-login {
  width: 100%;
  padding: 14px 24px;
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-login.btn-mahasiswa {
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  box-shadow: 0 4px 12px rgba(166, 214, 0, 0.35);
}

.btn-login.btn-mahasiswa:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(166, 214, 0, 0.4);
}

.btn-login.btn-dosen {
  background: linear-gradient(135deg, var(--spmi-c-dgray) 0%, var(--color-button) 100%);
  box-shadow: 0 4px 12px rgba(46, 45, 51, 0.35);
}

.btn-login.btn-dosen:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(46, 45, 51, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.version-text {
  text-align: center;
  font-size: 13px;
  color: #9ca3af;
  font-family: 'Montserrat', sans-serif;
}

.btn-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Divider */
.divider {
  position: relative;
  text-align: center;
  margin: 4px 0;
}

.divider::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background-color: #e5e7eb;
}

.divider span {
  position: relative;
  background-color: white;
  padding: 0 16px;
  font-size: 14px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .container-login {
    gap: 30px;
    padding: 15px;
  }

  .image {
    flex: 1.2;
  }
}

@media (max-width: 992px) {
  .container-login {
    flex-direction: column-reverse;
    gap: 20px;
  }

  .login-part {
    order: 1;
    flex: 1;
    padding: 10px;
  }

  .image {
    flex: 0.5;
    min-height: 250px;
  }

  .form-login {
    padding: 40px 35px;
  }
}

@media (max-width: 768px) {
  .container-login {
    padding: 10px;
  }

  .form-login {
    padding: 35px 28px;
  }

  .welcome-title {
    font-size: 28px;
  }

  .image {
    min-height: 200px;
    border-radius: 16px;
  }
}

@media (max-width: 480px) {
  .form-login {
    padding: 30px 24px;
  }

  .welcome-title {
    font-size: 24px;
  }

  .form-options {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
