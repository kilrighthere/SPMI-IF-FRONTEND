<script setup>
    import { computed } from 'vue'
    const props = defineProps({
    variant: {
        type: String,
        default: 'default'
    }
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
</script>

<template>
    <div :class="['footer', variantClass]">
        <p class="F-content">Copyright &copy; 2025 Departemen Informatika. All rights reserved.</p>
    </div>
</template>

<style>
    .footer-default{
        height: 50px;
        padding: 15px 20px;
        margin-top: 20px; 
        background-color: var(--color-footer);
        position: relative;  /* Changed from fixed to allow normal document flow */
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;  /* Center the copyright text */
    }

    .footer-login{
        height: 50px;
        padding: 15px 20px;
        background-color: var(--color-footer);
        position: relative;  /* Changed from fixed to allow normal document flow */
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        box-sizing: border-box;
        display: flex;
        align-items: center;
        justify-content: center;  /* Center the copyright text */
    }

    .F-content{
        font-style: italic;
        color: cornsilk;
        font-size: 12px;
        margin: 0;  /* Remove default paragraph margin */
        padding: 0;
    }

</style>