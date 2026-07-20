<template>
  <v-app-bar class="eva-theme app-bar" flat>
    <v-container class="d-flex align-center">
      <router-link to="/" class="text-decoration-none d-flex align-center app-bar__brand">
        <img :src="logo" alt="" class="app-bar__logo mr-2" />
        <span class="app-bar__name">{{ storeName }}</span>
      </router-link>
      <v-spacer />
      <a v-if="waLink" :href="waLink" target="_blank" rel="noopener" class="eva-icon-btn mr-2">
        <v-icon icon="mdi-whatsapp" />
      </a>
      <a v-if="igLink" :href="igLink" target="_blank" rel="noopener" class="eva-icon-btn mr-2">
        <v-icon icon="mdi-instagram" />
      </a>
      <v-btn to="/carrito" variant="text" class="app-bar__cart">
        <v-badge :content="cart.count" :model-value="cart.count > 0" color="error">
          <v-icon icon="mdi-cart" />
        </v-badge>
        <span class="ml-2 d-none d-sm-inline">Carrito</span>
      </v-btn>
    </v-container>
  </v-app-bar>

  <v-main>
    <router-view />
  </v-main>

  <v-footer class="eva-theme footer justify-center flex-column pa-6">
    <span class="text-body-2">{{ storeName }}</span>
    <span v-if="whatsapp" class="text-caption mt-1 footer__muted">WhatsApp {{ whatsapp }}</span>
    <span v-if="instagram" class="text-caption footer__muted">@{{ instagram }}</span>
    <router-link to="/admin/login" class="text-caption mt-2 text-decoration-none footer__muted">
      Panel de administración
    </router-link>
  </v-footer>
</template>

<script setup>
import { computed } from 'vue'
import { useCartStore } from '@/stores/cart'
import { whatsappLink, instagramLink } from '@/utils/format'
import logo from '@/assets/logo.png'

const cart = useCartStore()
const storeName = import.meta.env.VITE_STORE_NAME || 'Tienda de Computación'
const whatsapp = import.meta.env.VITE_STORE_WHATSAPP || ''
const instagram = import.meta.env.VITE_STORE_INSTAGRAM || ''
const waLink = computed(() => whatsappLink())
const igLink = computed(() => instagramLink())
</script>

<style scoped>
.app-bar {
  background: var(--eva-bg) !important;
}
.app-bar__brand,
.app-bar__cart {
  color: var(--eva-text) !important;
}
.app-bar__logo {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}
.app-bar__name {
  font-family: var(--eva-font-display);
  font-weight: 700;
  font-size: 1.1rem;
}
.footer {
  background: var(--eva-bg) !important;
  color: var(--eva-text);
}
.footer__muted {
  color: var(--eva-text-soft);
}
</style>
