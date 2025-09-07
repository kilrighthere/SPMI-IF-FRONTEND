<script setup>
// Import kurikulum data from store
import { kurikulumData } from '@/stores/kurikulum'
import { ref } from 'vue'

// Sample data for profil lulusan
const profilLulusan = ref([
  {
    id: 1,
    title: 'Software Engineer',
    description: 'Mampu mengembangkan perangkat lunak dengan menerapkan prinsip-prinsip rekayasa.',
  },
  {
    id: 2,
    title: 'System Analyst',
    description: 'Mampu menganalisis kebutuhan sistem dan mendesain solusi teknologi informasi.',
  },
  {
    id: 3,
    title: 'Data Scientist',
    description: 'Mampu melakukan analisis data dan membuat model prediktif.',
  },
  {
    id: 4,
    title: 'Network Engineer',
    description: 'Mampu merancang, mengimplementasikan dan mengelola jaringan komputer.',
  },
])
</script>

<template>
  <div class="profil-lulusan-container">
    <div class="section-box">
      <h3>Profil Lulusan Program Studi</h3>
      <div class="pl-content">
        <p>
          Profil lulusan untuk {{ kurikulumData.nama }} mencakup beberapa bidang keahlian yang
          diharapkan setelah menyelesaikan program studi.
        </p>
        <ul>
          <li v-for="profil in profilLulusan" :key="profil.id">
            <strong>{{ profil.title }}:</strong> {{ profil.description }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped>


.section-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 20px;
  background-color: #fff;
}

.section-box h3 {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: var(--color-button);
}

.pl-content {
  line-height: 1.6;
}

.pl-content p {
  margin-bottom: 15px;
}

ul {
  list-style-type: disc;
  padding-left: 20px;
  margin-bottom: 15px;
}

li {
  margin-bottom: 8px;
}
</style>
