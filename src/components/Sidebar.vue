<template>
  <div class="sidebar">
    <div class="headline">
      <span class="title">SPMI-IF</span>
      <img src="../assets/Undip.png" alt="logo undip" />
    </div>

    <div class="menu">
      <RouterLink to="/Dashboard" class="menu-sidebar">
        <i class="ri-dashboard-2-fill"></i>
        <span class="menu-title 1">Dashboard</span>
      </RouterLink>
      <RouterLink to="/Kurikulum" class="menu-sidebar">
        <i class="ri-folder-2-fill"></i>
        <span class="menu-title 2">Kurikulum</span>
      </RouterLink>
    </div>
  </div>
</template>

<style>
.sidebar {
  background-color: white;
  /* display: block; */
  width: 256px;
  box-shadow: 10px 0px 20px 3px rgba(52, 52, 52, 0.322);
  /* border: 5px solid black; */
  z-index: 3;
  position: fixed;
  top: 0;
  bottom: 0;
}

.headline {
  padding: 13px 8px;
  /* margin-bottom: 20px; */
  border-bottom: 0.8px solid rgb(222, 226, 230);
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  align-items: center;
  box-sizing: border-box;
  /* background-color: white; */
  /* background-color: #2D2D2D; */
}

.headline .title {
  font-size: 20px;
  order: 2;
}

.headline .img {
  order: 1;
}

.sidebar .menu {
  margin-left: 15px;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* align-items: first baseline; */
  gap: 20px;
}

.menu-sidebar {
  /* margin-top: 30px; */
  text-decoration: none;
  /* padding: 10px 15px; */
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  /* gap: 15px; */
  color: var(--color-text);
}
</style>
