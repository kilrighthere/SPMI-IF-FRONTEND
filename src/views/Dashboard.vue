<script setup>
// import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
import { useSidebarStore } from '@/stores/sidebar'

const sidebarStore = useSidebarStore()
</script>

<template>
  <div class="dash-container">
    <Sidebar />
    <Header />
    <div class="main-content" :class="{ 'minimized-sidebar': sidebarStore.isMinimized }">
      <div class="dash">
        <h1>Hello</h1>
        <p>
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Vitae debitis reiciendis, aliquam
          necessitatibus rem eius architecto soluta nostrum ad, delectus odio saepe molestiae
          adipisci culpa at reprehenderit in qui. Minus cupiditate iure quaerat, doloribus a itaque,
          molestiae fugit non harum perferendis, culpa nam debitis maiores eum quod animi asperiores
          quibusdam corporis? Sequi praesentium, eum ad eaque, rerum amet deserunt officia soluta
          inventore at ratione impedit numquam temporibus quisquam iste ab quae? Aspernatur, quo
          facilis cum adipisci quae quam ratione. Culpa nemo laborum est quia minima, eum distinctio
          nisi consectetur reprehenderit quam illum iusto, perferendis dignissimos vitae? Explicabo
          dolore tempore necessitatibus?
        </p>
      </div>
    </div>
    <Footer />
  </div>
</template>

<style scoped>
.dash-container {
  display: flex;
  flex-direction: column;
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

/* Responsive */
@media (max-width: 1024px) {
  .main-content {
    margin-left: 282px;
  }

  .main-content.minimized-sidebar {
    margin-left: 114px;
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
    padding: 20px;
  }
}
</style>
