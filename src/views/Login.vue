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
  <div class="all-contain">
    <Header variant="login" />
    <div class="container-login">
      <div class="login-part">
        <div class="card-login">
          <form @submit="loginHandler" class="form-login">
            <div class="header-form">
              <h2>User Login</h2>
            </div>
            <div class="main-form">
              <div class="uname">
                <!-- <label for="Username">Username</label> -->
                <div class="uname-col">
                  <input
                    v-model="username"
                    type="text"
                    name="Username"
                    id="Username"
                    placeholder="Username"
                  />
                </div>
              </div>
              <div class="pass">
                <!-- <label for="Password">Password</label> -->
                <div class="pass-col">
                  <input
                    v-model="password"
                    type="password"
                    name="Password"
                    id="Password"
                    placeholder="Password"
                  />
                </div>
              </div>
              <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
            </div>
            <div class="submit">
              <button type="submit" class="btn btn-primary">Sign In</button>
            </div>
          </form>
        </div>
      </div>
      <div class="image">
        <img src="../assets/if.png" alt="informatika" />
      </div>
    </div>
    <Footer variant="login" />
  </div>
</template>

<style>

.all-contain{
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100vh;
}
.container-login {
  display: flex;
  height: 100vh;
  width: 100vw;
  overflow: hidden; /* cegah keluar layar */
  padding: 10px;
  gap: 30px;
  box-sizing: border-box;
}

.login-part {
  order: 2;
  flex: 1; /* 1 bagian */
  display: flex;
  justify-content: center;
  align-items: center;
}

.image {
  flex: 1.5; /* 1.5 bagian */
  height: 100%; /* penuh tinggi container */
  border-radius: 12px;
  overflow: hidden; /* biar gambar ga keluar */
}

.image img {
  width: 100%;
  height: 100%;
  object-fit: cover; /* isi penuh dengan crop */
  display: block;
}
.form-login {
  flex: 1;
  background-color: white;
  color: var(--color-text);
  padding: 80px 50px;
  border-radius: 20px;
  box-shadow: 10px 10px 15px 2px rgba(87, 87, 87, 0.183);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  gap: 50px;
}
.form-login .header-form {
  font-size: 40px;
  font-weight: bold;
  font-family: 'Montserrat Black';
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

.uname-col #Username,
.pass-col #Password {
  padding: 6px 8px;
  border-radius: 8px;
  width: 300px;
  background-color: var(--color-background);
  border: none;
  border: 1px solid var(--color-border);
  box-sizing: border-box;
}

.error {
  color: var(--color-button);
  font-size: 12px;
  font-style: italic;
}

.form-login button {
  width: 300px;
  font-size: 14px;
  background-color: var(--color-button);
  padding: 7px 25px;
  border-radius: 8px;
  color: var(--color-text-light);
  border: 1px solid var(--color-text);
  box-sizing: border-box;
  font-weight: bold;
}

.form-login button:hover {
  background-color: var(--color-button-hover);
}

</style>