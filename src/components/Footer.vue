<template>
    <div class="Footer">
        <p class="F-content">Copyright &copy; 2025 Departemen Informatika. All rights reserved.</p>
    </div>
</template>

<style>
    .Footer{
        height: 50px;
        padding: 15px 20px;
        margin-top: 20px;  /* Add top margin for spacing from content */
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

    .Footer .F-content{
        font-style: italic;
        color: cornsilk;
        font-size: 12px;
        margin: 0;  /* Remove default paragraph margin */
        padding: 0;
    }

</style>