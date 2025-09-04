<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Footer from '../components/Footer.vue'
import Header from '@/components/Header.vue'

const username = ref('')
const password = ref('')
const errorMsg = ref('')
const router = useRouter()

async function loginHandler(e) {
  e.preventDefault()
  errorMsg.value = ''

  /* DUMMY LOGIN */
  if (username.value === 'admin' && password.value === '1234') {
    router.push('/dashboard')
  } else {
    errorMsg.value = 'Username atau password salah'
  }

  //   try {
  //     const res = await fetch('#', {
  //       method: 'POST',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({
  //         username: username.value,
  //         password: password.value
  //       })
  //     })

  //     const data = await res.json()

  //     if (res.ok && data.success) {
  //       // Simpan token (misalnya JWT)
  //       localStorage.setItem('token', data.token)

  //       // Redirect ke dashboard
  //       router.push('/dashboard')
  //     } else {
  //       errorMsg.value = data.message || 'Login gagal'
  //     }
  //   } catch (err) {
  //     errorMsg.value = 'Terjadi kesalahan jaringan'
  //   }
}
</script>

<template>
  <Header />
  <div class="container">
    <div class="sidebar1">
      <div class="headline">
        <span class="title">SPMI-IF</span>
        <img src="../assets/Undip.png" alt="logo undip" />
      </div>
      <div class="menu">
        <RouterLink to="/Login" class="menu-sidebar">
          <font-awesome-icon :icon="['fas', 'user']" />
          <span class="menu-title">User Login</span>
        </RouterLink>
      </div>
    </div>

    <div class="main">
      <div class="card login-form">
        <form @submit="loginHandler" class="form-login">
          <div class="header-form">
            <h2>User Login</h2>
          </div>
          <div class="main-form">
            <div class="uname">
              <label for="Username">Username</label>
              <div class="uname-col">
                <input v-model="username" type="text" name="Username" id="Username" />
              </div>
            </div>
            <div class="pass">
              <label for="Password">Password</label>
              <div class="pass-col">
                <input v-model="password" type="password" name="Password" id="Password" />
              </div>
            </div>
            <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
          </div>
          <div class="submit">
            <button type="submit">Sign In</button>
          </div>
        </form>
      </div>
    </div>
  </div>
  <Footer />
</template>

<style>
.container {
  min-width: 100vh;
  min-height: 100vh;
  /* max-height: screen; */
  display: flex;
  flex-basis: 0;
  box-sizing: border-box;
  flex-direction: row;
  /* border: 5px solid black; */
  /* padding-top: 50px; */
}
.sidebar1 {
  background-color: white;
  width: 256px;
  box-shadow: 10px 0px 20px 3px rgba(52, 52, 52, 0.322);
  z-index: 3;
  /* display: none; */
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

.menu {
  margin-left: 15px;
  padding-top: 15px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  /* align-items: first baseline; */
  gap: 20px;
}

.menu-sidebar {
  text-decoration: none;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 15px;
  color: var(--color-text);
}

.main {
  flex: 1;
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  align-items: center;
}

.headline img {
  width: 50px;
}

.form-login {
  background-color: #2d2d2d;
  color: white;
  padding: 50px 100px;
  border: 0.8px solid rgb(211, 211, 211);
  border-radius: 20px;
  box-shadow: 0px 0px 20px 2px rgba(87, 87, 87, 0.596);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 30px;
}
.form-login .header-form {
  font-size: 30px;
  font-weight: bold;
}

.uname,
.pass {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 15px;
}
.form-login .main-form {
  display: flex;
  flex-direction: column;
  gap: 15px;
  line-height: 1.5;
}

.uname-col input,
.pass-col input {
  padding: 3px;
  padding-left: 5px;
  border-radius: 5px;
  width: 300px;
  border: 1px solid var(--color-border);
}

.error {
  color: red;
}

.form-login button {
  background-color: rgb(176, 225, 255);
  padding: 5px 25px;
  border-radius: 5px;
  border: 1px solid var(--color-text);
}
</style>
