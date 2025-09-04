<script setup>
// import { useRouter } from 'vue-router'
import Footer from '@/components/Footer.vue'
import Header from '@/components/Header.vue'
import Sidebar from '@/components/Sidebar.vue'
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
    margin-top: 0; /* No need for margin-top as we have padding-top in .dashboard */
    display: flex;
    flex-direction: column;
}

.dashboard {
    flex: 1; /* Take up available space */
    padding-top: 90px; /* Adjusted for new header height */
    padding-left: 30px;
    padding-right: 30px;
    padding-bottom: 50px; /* Add bottom padding for footer space */
}
</style>