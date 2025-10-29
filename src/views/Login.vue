<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Header from '@/components/Header.vue'
import { useAuthStore } from '@/stores/auth'

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const router = useRouter()
const auth = useAuthStore()

async function loginHandler(e) {
  e.preventDefault()
  auth.error = null

  if (!username.value || !password.value) {
    auth.error = 'Username dan password wajib diisi'
    return
  }

  const res = await auth.login({ nip: username.value, password: password.value })
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
            </div>

            <div class="main-form">
              <div class="input-group">
                <label for="Username" class="input-label">Username</label>
                <div class="input-wrapper">
                  <svg
                    class="input-icon"
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
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    v-model="username"
                    type="text"
                    name="Username"
                    id="Username"
                    placeholder="Enter your username"
                    class="form-input"
                  />
                </div>
              </div>

              <div class="input-group">
                <label for="Password" class="input-label">Password</label>
                <div class="input-wrapper">
                  <svg
                    class="input-icon"
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
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <input
                    v-model="password"
                    :type="showPassword ? 'text' : 'password'"
                    name="Password"
                    id="Password"
                    placeholder="Enter your password"
                    class="form-input password-input"
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
                <div class="forgot-password-container">
                  <a href="#" class="forgot-password">Forgot password?</a>
                </div>
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
              <button type="submit" class="btn-login" :disabled="auth.isLoading">
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
                <span v-else class="btn-content">Sign In</span>
              </button>

              <p class="signup-text">
                Don't have an account? <a href="#" class="signup-link">Sign up</a>
              </p>
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
  gap: 8px;
}

.welcome-title {
  font-size: 32px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  line-height: 1.2;
  display: flex;
  align-items: center;
  gap: 8px;
}

.wave-emoji {
  display: inline-block;
  animation: wave 0.6s ease-in-out;
  font-size: 32px;
}

@keyframes wave {
  0%,
  100% {
    transform: rotate(0deg);
  }
  25% {
    transform: rotate(20deg);
  }
  75% {
    transform: rotate(-20deg);
  }
}

.welcome-subtitle {
  font-size: 15px;
  font-weight: 400;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
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
  padding: 13px 16px 13px 44px;
  border-radius: 12px;
  border: 1.5px solid #e5e7eb;
  background-color: #f9fafb;
  font-size: 15px;
  font-family: 'Montserrat', sans-serif;
  color: var(--color-text);
  transition: all 0.3s ease;
  box-sizing: border-box;
}

.password-input {
  padding-right: 44px;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-button);
  background-color: white;
  box-shadow: 0 0 0 4px var(--spmi-color-green2);
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
  background: linear-gradient(135deg, var(--spmi-c-green2) 0%, var(--color-buttonsec) 100%);
  color: var(--color-text);
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px var(--color-text) 0.35;
}

.btn-login:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 76, 76, 0.4);
}

.btn-login:active:not(:disabled) {
  transform: translateY(0);
}

.btn-login:disabled {
  opacity: 0.7;
  cursor: not-allowed;
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

/* Secondary Button */
.btn-secondary {
  width: 100%;
  padding: 13px 24px;
  background-color: white;
  color: var(--color-text);
  border: 1.5px solid #e5e7eb;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Montserrat', sans-serif;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.btn-secondary svg {
  width: 20px;
  height: 20px;
}

/* Sign Up Text */
.signup-text {
  text-align: center;
  font-size: 14px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
}

.signup-link {
  color: var(--color-button);
  text-decoration: none;
  font-weight: 600;
  transition: color 0.2s ease;
}

.signup-link:hover {
  color: var(--color-buttonsec);
  text-decoration: underline;
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
