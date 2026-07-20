<template>
  <v-theme-provider theme="neon">
    <v-navigation-drawer v-model="drawer" color="secondary">
      <v-list-item title="Panel de administración" :subtitle="auth.user?.email" class="py-4" />
      <v-divider />
      <v-list nav density="comfortable">
        <v-list-item
          v-for="item in nav"
          :key="item.to"
          :to="item.to"
          :prepend-icon="item.icon"
          :title="item.title"
          exact
        />
      </v-list>
      <template #append>
        <v-list nav>
          <v-list-item prepend-icon="mdi-storefront" title="Ver catálogo público" to="/" />
          <v-list-item prepend-icon="mdi-logout" title="Cerrar sesión" @click="logout" />
        </v-list>
      </template>
    </v-navigation-drawer>

    <v-app-bar color="secondary" flat>
      <v-app-bar-nav-icon @click="drawer = !drawer" />
      <v-toolbar-title>{{ currentTitle }}</v-toolbar-title>
    </v-app-bar>

    <v-main class="admin-main">
      <v-container fluid class="pa-4 pa-md-6">
        <router-view />
      </v-container>
    </v-main>
  </v-theme-provider>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const drawer = ref(true)
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const nav = [
  { to: '/admin', title: 'Panel general', icon: 'mdi-view-dashboard' },
  { to: '/admin/productos', title: 'Productos', icon: 'mdi-package-variant' },
  { to: '/admin/lotes', title: 'Reponer stock', icon: 'mdi-truck-delivery' },
  { to: '/admin/pedidos', title: 'Pedidos y ventas', icon: 'mdi-receipt' },
  { to: '/admin/metodos-pago', title: 'Métodos de pago', icon: 'mdi-credit-card-outline' },
  { to: '/admin/reportes', title: 'Reporte de ventas', icon: 'mdi-chart-line' },
]

const currentTitle = computed(() => nav.find((n) => n.to === route.path)?.title ?? 'Panel de administración')

async function logout() {
  await auth.logout()
  router.push({ name: 'admin-login' })
}
</script>

<style scoped>
.admin-main {
  background: rgb(var(--v-theme-background));
  min-height: 100vh;
}
</style>
