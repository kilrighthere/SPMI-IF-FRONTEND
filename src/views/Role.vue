<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter()

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
                  <strong>Development Mode:</strong> Server sedang down.<br />
                  Gunakan <strong>111111111111111111</strong> untuk username dan password
                </div>
              </div>
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
