<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <button class="close-button" @click="close">&times;</button>
      <h3>Detail Korelasi</h3>
      <div v-if="details">
        <div class="detail-group">
          <h4>Capaian Pembelajaran Mata Kuliah (CPMK)</h4>
          <p><strong>ID:</strong> {{ details.cpmk.id_cpmk }}</p>
          <p><strong>Deskripsi:</strong> {{ details.cpmk.deskripsi }}</p>
        </div>
        <div class="detail-group">
          <h4>Mata Kuliah (MK)</h4>
          <p><strong>Kode:</strong> {{ details.mk.kode_mk }}</p>
          <p><strong>Nama:</strong> {{ details.mk.nama_mk }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  details: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['close'])

const close = () => {
  emit('close')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 24px;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  font-family: 'Montserrat', sans-serif;
}

.close-button {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #9ca3af;
  transition: color 0.2s;
}

.close-button:hover {
  color: #374151;
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
  font-size: 20px;
  font-weight: 700;
  color: var(--color-text);
}

.detail-group {
  margin-bottom: 16px;
}

.detail-group h4 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-button);
  margin-bottom: 8px;
  border-bottom: 2px solid var(--color-buttonsec);
  padding-bottom: 4px;
}

.detail-group p {
  margin: 4px 0;
  font-size: 14px;
  color: #4b5563;
}

.detail-group p strong {
  font-weight: 600;
  color: #374151;
}
</style>
