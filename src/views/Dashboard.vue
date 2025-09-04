<script setup>
// import { useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue';
</script>

<template>
    <div class="app-layout">
        <Sidebar/>
        <div class="main-content">
            <Header/>
            <div class="container dashboard">
                
            </div>
            <Footer/>
        </div>
    </div>
</template>

<style>
.app-layout {
    display: flex;
    min-height: 100vh;
}

.main-content {
    flex: 1;
    margin-left: 256px; /* Same as sidebar width */
    display: flex;
    flex-direction: column;
}

.dashboard {
    padding-top: 80px;
    padding-left: 30px;
    padding-right: 30px;
}
</style>