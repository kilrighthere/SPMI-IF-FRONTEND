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
  <div class="login-layout">
    <Header />
    <div class="login-container">
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
    <Footer />
  </div>
</template>

<style>
.login-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.login-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30px;
  padding-top: 90px; /* Increased for new header */
  padding-bottom: 50px; /* Add more padding at the bottom for footer */
  min-height: calc(100vh - 170px); /* Account for header and footer */
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
