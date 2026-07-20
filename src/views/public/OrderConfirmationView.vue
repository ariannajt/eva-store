<template>
  <v-theme-provider theme="neon" with-background tag="div" class="eva-theme page">
    <CheckoutSteps :current="3" />

    <div class="page__inner">
      <v-icon icon="mdi-check-circle-outline" color="primary" size="72" class="mb-4" />
      <h1 class="page__title">¡Pedido recibido!</h1>
      <p class="page__text">
        Vamos a revisar tu comprobante de pago y confirmaremos tu pedido a la brevedad.
      </p>
      <div class="page__ref">
        <span class="page__ref-label">Número de referencia</span>
        <div class="page__ref-value">{{ route.params.id }}</div>
      </div>
      <button class="eva-btn eva-btn--solid page__cta" @click="router.push({ name: 'catalog' })">
        Seguir viendo el catálogo
      </button>
    </div>
  </v-theme-provider>
</template>

<script setup>
import { useRoute, useRouter } from 'vue-router'
import CheckoutSteps from '@/components/public/CheckoutSteps.vue'

const route = useRoute()
const router = useRouter()
</script>

<style scoped>
.page {
  min-height: 100%;
  padding-bottom: clamp(32px, 5vw, 56px);
}
.page__inner {
  max-width: 560px;
  margin: 0 auto;
  padding: 0 20px;
  text-align: center;
}
.page__title {
  font-size: 26px;
  font-weight: 800;
  margin: 0 0 10px;
}
.page__text {
  opacity: 0.85;
  margin: 0 0 20px;
}
.page__ref {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 28px;
}
.page__ref-label {
  font-size: 12px;
  opacity: 0.7;
}
.page__ref-value {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}
.page__cta {
  padding: 14px 32px;
  border-radius: 40px;
  font-size: 13px;
}
</style>
