<script setup>
defineProps({
  message: {
    type: String,
    default: '',
  },
})

defineEmits(['close'])
</script>

<template>
  <div v-if="message" class="error-popup-overlay" @click.self="$emit('close')">
    <div class="error-popup" role="alert" aria-live="assertive">
      <button class="error-popup-close" @click="$emit('close')" aria-label="Tutup popup error">
        <i class="ri-close-line" aria-hidden="true"></i>
      </button>
      <div class="error-popup-icon" aria-hidden="true">
        <i class="ri-close-line"></i>
      </div>
      <p class="error-popup-title">Terjadi Kesalahan</p>
      <p class="error-popup-message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
.error-popup-overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
  padding: 16px;
}

.error-popup {
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 24px 20px 20px;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.2);
  position: relative;
  text-align: center;
  border: 1px solid #fecaca;
}

.error-popup-close {
  position: absolute;
  top: 10px;
  right: 12px;
  border: none;
  background: transparent;
  color: #9ca3af;
  line-height: 1;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
}

.error-popup-close i {
  font-size: 24px;
}

.error-popup-close:hover {
  color: var(--color-button);
}

.error-popup-icon {
  width: 58px;
  height: 58px;
  margin: 0 auto 12px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-button-hover);
  border: 2px solid var(--color-button-hover);
  background: #fff5f5;
}

.error-popup-icon i {
  font-size: 30px;
  font-weight: 700;
}

.error-popup-title {
  margin: 0;
  font-weight: 700;
  color: #1f2937;
}

.error-popup-message {
  margin: 8px 0 0;
  color: #4b5563;
  line-height: 1.5;
}
</style>
