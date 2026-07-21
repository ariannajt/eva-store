<template>
  <v-theme-provider theme="neon" with-background tag="div" class="eva-theme page">
    <CheckoutSteps :current="1" />

    <div class="page__inner">
      <h1 class="page__title">Tu carrito</h1>

      <v-empty-state
        v-if="!cart.items.length"
        icon="mdi-cart-outline"
        title="Tu carrito está vacío"
        text="Agrega artículos desde el catálogo."
      >
        <template #actions>
          <v-btn color="primary" :to="{ name: 'catalog' }">Ver catálogo</v-btn>
        </template>
      </v-empty-state>

      <template v-else>
        <router-link :to="{ name: 'catalog' }" class="page__back">← VOLVER AL CATÁLOGO</router-link>

        <div class="cart-item" v-for="it in cart.items" :key="it.product.id">
          <div class="cart-item__top">
            <img class="cart-item__img" :src="it.product.product_images?.[0]?.url" alt="" />
            <div class="cart-item__info">
              <div class="cart-item__name">{{ it.product.name }}</div>
              <div class="cart-item__unit">{{ formatMoney(effectivePrice(it.product)) }} c/u</div>
            </div>
          </div>
          <div class="cart-item__meta">
            <v-number-input
              :model-value="it.quantity"
              :min="1"
              :max="it.product.stock"
              density="compact"
              control-variant="split"
              class="cart-item__qty"
              @update:model-value="(v) => cart.updateQuantity(it.product.id, v)"
            />
            <div class="cart-item__price">{{ formatMoney(effectivePrice(it.product) * it.quantity) }}</div>
            <v-btn icon="mdi-delete-outline" variant="text" color="error" @click="cart.remove(it.product.id)" />
          </div>
        </div>

        <div class="cart-total">
          <span>Total</span>
          <span class="cart-total__amount">{{ formatMoney(cart.total) }}</span>
        </div>
        <div v-if="bcv.rate" class="cart-total-bs">
          <span>Total en bolívares</span>
          <span>{{ formatBs(cart.total * bcv.rate) }}</span>
        </div>
        <div class="cart-rate">
          Tasa BCV (Euro): <span v-if="bcv.rate">{{ formatBs(bcv.rate) }}</span
          ><span v-else-if="bcv.loading">cargando...</span><span v-else>no disponible</span>
        </div>

        <button class="eva-btn eva-btn--solid cart-cta" @click="router.push({ name: 'checkout' })">
          Continuar con la compra
        </button>
      </template>
    </div>
  </v-theme-provider>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useBcvRateStore } from '@/stores/bcvRate'
import { effectivePrice, formatMoney, formatBs } from '@/utils/format'
import CheckoutSteps from '@/components/public/CheckoutSteps.vue'

const router = useRouter()
const cart = useCartStore()
const bcv = useBcvRateStore()

onMounted(() => bcv.load())
</script>

<style scoped>
.page {
  min-height: 100%;
  padding-bottom: clamp(32px, 5vw, 56px);
}
.page__inner {
  max-width: 800px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 40px);
}
.page__title {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  margin: 0 0 20px;
}
.page__back {
  display: inline-block;
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(var(--v-theme-on-background), 0.75);
  text-decoration: none;
  margin-bottom: 16px;
}
.page__back:hover {
  color: rgb(var(--v-theme-primary));
}

.cart-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  background: rgb(var(--v-theme-surface));
  border-radius: 14px;
  margin-bottom: 12px;
}
.cart-item__top {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 1;
  min-width: 0;
}
.cart-item__meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: none;
}
.cart-item__qty {
  width: 135px;
  flex: none;
}
.cart-item__img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
  background: rgb(var(--v-theme-surface-variant));
}
.cart-item__info {
  flex: 1;
  min-width: 0;
}
.cart-item__name {
  font-weight: 700;
  font-size: 14px;
}
.cart-item__unit {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}
.cart-item__price {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 15px;
  white-space: nowrap;
}

.cart-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 20px;
  font-weight: 800;
  margin: 24px 0;
}
.cart-total__amount {
  font-family: 'Space Mono', monospace;
  color: rgb(var(--v-theme-primary));
}
.cart-total-bs {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  opacity: 0.85;
  margin-top: -14px;
  margin-bottom: 8px;
}
.cart-rate {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  opacity: 0.65;
  margin-bottom: 16px;
}
.cart-cta {
  width: 100%;
  padding: 16px;
  border-radius: 14px;
  font-size: 13px;
}

@media screen and (max-width: 600px) {
  .cart-item {
    flex-wrap: wrap;
    gap: 12px;
  }
  .cart-item__top {
    flex: 1 1 100%;
  }
  .cart-item__meta {
    flex: 1 1 100%;
    justify-content: space-between;
    gap: 8px;
  }
  .cart-item__qty {
    width: 135px;
  }
  .cart-item__price {
    font-size: 14px;
  }
}
</style>
