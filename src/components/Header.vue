<script setup>
// No import needed as we're using the global CSS
</script>

<template>
    <div class="Header">
        <div class="header-content">
            <img src="../assets/Undip.png" alt="Logo Undip" class="header-logo" />
            <h2 class="title">Sistem Penjaminan Mutu Internal Departemen Informatika</h2>
        </div>
    </div>
</template>

<style>
    .Header {
        height: 50px;
        padding: 30px 20px;
        background-color: var(--color-header);
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        /* border-bottom: 1px solid var(--color-border); */
        box-shadow: 0 3px 10px rgba(0, 0, 0, 0.119);
    }
    
    .header-content {
        width: 100%;
        display: flex;
        /* justify-content: center; */
        align-items: center;
        /* padding: 0 30px; */
    }
    
    .header-logo {
        width: 45px;
        height: auto;
        margin-right: 15px;
    }
    
    .Header h2 {
        color: var(--color-text);
        margin: 0;
        font-size: 16px;
        letter-spacing: 0.2px;
        font-weight: 500;
        font-family: 'Montserrat';
    }

</style>