<script setup>
import { computed } from 'vue'

const props = defineProps({
  variant: {
    type: String,
    default: 'default',
  },
})

// mapping class sesuai variant
const variantClass = computed(() => {
  switch (props.variant) {
    case 'login':
      return 'footer-login'
    default:
      return 'footer-default'
  }
})

const currentYear = new Date().getFullYear()
</script>

<template>
  <footer :class="['footer', variantClass]">
    <div class="footer-container">
      <div class="footer-content">
        <div class="footer-left">
          <div class="footer-brand">
            <img src="../assets/Undip.png" alt="Logo Undip" class="footer-logo" />
            <div class="footer-brand-info">
              <h3 class="footer-brand-title">OBELIKS</h3>
              <p class="footer-brand-subtitle">
                Outcome-Based Education Learning Integration and Knowledge System
              </p>
            </div>
          </div>
        </div>

        <div class="footer-center">
          <p class="footer-copyright">
            © {{ currentYear }} Departemen Informatika, Universitas Diponegoro. All rights
            reserved.
          </p>
        </div>

        <div class="footer-right">
          <div class="footer-links">
            <a href="#" class="footer-link">Privacy</a>
            <span class="footer-separator">•</span>
            <a href="#" class="footer-link">Terms</a>
            <span class="footer-separator">•</span>
            <a href="#" class="footer-link">Support</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<style scoped>
/* Footer Base Styles */
.footer {
  background-color: white;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
  width: 100%;
  box-sizing: border-box;
  /* margin-top: 50px; */
}

.footer-default {
  position: relative;
}

.footer-login {
  position: relative;
}

.footer-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  gap: 20px;
}

/* Left Section */
.footer-left {
  display: flex;
  align-items: center;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-logo {
  width: 30px;
  height: 30px;
  object-fit: contain;
  opacity: 0.9;
}

.footer-brand-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.footer-brand-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--color-text);
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  letter-spacing: -0.3px;
  line-height: 1.2;
}

.footer-brand-subtitle {
  font-size: 9.5px;
  font-weight: 400;
  color: #9ca3af;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 400px;
}

/* Center Section */
.footer-center {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.footer-copyright {
  font-size: 11.5px;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  line-height: 1.5;
}

/* Right Section */
.footer-right {
  display: flex;
  align-items: center;
}

.footer-links {
  display: flex;
  align-items: center;
  gap: 10px;
}

.footer-link {
  font-size: 11.5px;
  font-weight: 500;
  color: #6b7280;
  font-family: 'Montserrat', sans-serif;
  text-decoration: none;
  transition: color 0.2s ease;
}

.footer-link:hover {
  color: var(--color-button);
}

.footer-separator {
  color: #d1d5db;
  font-size: 11.5px;
  user-select: none;
}

/* Responsive Design */
@media (max-width: 992px) {
  .footer-container {
    padding: 0 20px;
  }

  .footer-content {
    padding: 12px 0;
  }

  .footer-copyright {
    font-size: 10.5px;
  }

  .footer-link {
    font-size: 10.5px;
  }
}

@media (max-width: 768px) {
  .footer-container {
    padding: 0 16px;
  }

  .footer-content {
    flex-direction: column;
    padding: 12px 0;
    gap: 10px;
  }

  .footer-left,
  .footer-center,
  .footer-right {
    width: 100%;
    justify-content: center;
  }

  .footer-center {
    order: 2;
  }

  .footer-right {
    order: 1;
  }

  .footer-left {
    order: 3;
  }

  .footer-copyright {
    font-size: 9.5px;
  }

  .footer-brand-title {
    font-size: 12px;
  }

  .footer-brand-subtitle {
    font-size: 8.5px;
    max-width: 280px;
  }
}

@media (max-width: 480px) {
  .footer-container {
    padding: 0 12px;
  }

  .footer-content {
    padding: 10px 0;
    gap: 8px;
  }

  .footer-logo {
    width: 26px;
    height: 26px;
  }

  .footer-brand {
    gap: 8px;
  }

  .footer-copyright {
    font-size: 8.5px;
  }

  .footer-links {
    gap: 6px;
  }

  .footer-link {
    font-size: 9.5px;
  }

  .footer-separator {
    font-size: 9.5px;
  }

  .footer-brand-subtitle {
    font-size: 7.5px;
    max-width: 240px;
  }
}
</style>
