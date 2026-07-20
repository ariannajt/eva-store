<template>
  <v-theme-provider theme="neon" with-background tag="div" class="login-bg">
    <v-container class="fill-height" style="max-width: 420px">
      <v-card class="pa-6 w-100" elevation="4">
        <v-card-title class="text-h5 font-weight-bold text-center mb-2">Panel de administración</v-card-title>
        <v-card-subtitle class="text-center mb-4">{{ storeName }}</v-card-subtitle>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="email" label="Email" type="email" variant="outlined" class="mb-1" required />
          <v-text-field
            v-model="password"
            label="Contraseña"
            type="password"
            variant="outlined"
            class="mb-1"
            required
          />
          <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4">{{ errorMsg }}</v-alert>
          <v-btn type="submit" color="primary" size="large" block :loading="loading">Ingresar</v-btn>
        </v-form>
      </v-card>
    </v-container>
  </v-theme-provider>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()
const storeName = import.meta.env.VITE_STORE_NAME || 'Tienda de Computación'

const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

async function submit() {
  errorMsg.value = ''
  loading.value = true
  try {
    await auth.login(email.value, password.value)
    router.push(route.query.redirect || { name: 'admin-dashboard' })
  } catch (err) {
    errorMsg.value = 'Email o contraseña incorrectos.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-bg {
  min-height: 100vh;
  display: flex;
  justify-content: center;
}
</style>
