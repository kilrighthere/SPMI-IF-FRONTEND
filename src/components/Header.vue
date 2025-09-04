<script setup>
// No import needed as we're using the global CSS
</script>

<template>
    <div class="Header">
        <div class="header-content">
            <img src="../assets/Undip.png" alt="Logo Undip" class="header-logo" />
            <h2>Sistem Penjaminan Mutu Internal Departemen Informatika</h2>
        </div>
    </div>
</template>

<style>
    .Header {
        height: 70px;
        padding: 0;
        background-color: white;
        position: fixed;
        left: 0;
        right: 0;
        top: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        justify-content: center;
        box-sizing: border-box;
        border-bottom: 1px solid rgb(222, 226, 230);
        box-shadow: 0 2px 4px rgba(0,0,0,0.05);
    }

    .header-content {
        width: 100%;
        max-width: 1200px;
        display: flex;
        align-items: center;
        padding: 0 30px;
    }

    .header-logo {
        width: 45px;
        height: auto;
        margin-right: 15px;
    }

    .Header h2 {
        margin: 0;
        color: var(--color-text);
        font-size: 18px;
        font-weight: 600;
        letter-spacing: 0.2px;
    }

</style>