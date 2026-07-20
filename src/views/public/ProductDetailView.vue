<template>
  <v-theme-provider theme="neon" with-background tag="div" class="eva-theme page">
    <template v-if="product">
      <div class="page__header">
        <router-link :to="{ name: 'catalog' }" class="page__back">← VOLVER AL CATÁLOGO</router-link>
      </div>

      <div class="detail">
        <div class="detail__gallery">
          <div class="detail__main">
            <img v-if="activeImage" :src="activeImage" alt="" />
            <div v-else class="detail__placeholder">
              <v-icon icon="mdi-image-off-outline" size="48" />
            </div>
          </div>
          <div v-if="images.length > 1" class="detail__thumbs">
            <button
              v-for="(img, idx) in images"
              :key="img.id"
              class="detail__thumb"
              :class="{ 'detail__thumb--active': idx === activeIndex }"
              @click="activeIndex = idx"
            >
              <img :src="img.url" alt="" />
            </button>
          </div>
        </div>

        <div class="detail__info">
          <div v-if="product.categories" class="detail__category">{{ product.categories.name }}</div>
          <h1 class="detail__title">{{ product.name }}</h1>
          <div class="detail__price">{{ formatMoney(effectivePrice(product)) }}</div>
          <span v-if="product.discount_active" class="detail__old-price">{{ formatMoney(product.price) }}</span>
          <div v-if="bcv.rate" class="detail__price-bs">{{ formatBs(effectivePrice(product) * bcv.rate) }}</div>
          <div class="detail__shipping">ENVÍOS NACIONALES</div>

          <p class="detail__description">{{ product.description }}</p>

          <div class="detail__stock-row">
            <v-number-input
              v-if="product.stock > 0"
              v-model="quantity"
              :min="1"
              :max="product.stock"
              control-variant="split"
              density="comfortable"
              style="max-width: 160px"
            />
            <span class="detail__stock-text">
              {{ product.stock > 0 ? `${product.stock} disponibles` : 'Agotado' }}
            </span>
          </div>

          <div v-if="product.stock > 0" class="detail__actions">
            <button class="eva-btn eva-btn--solid detail__buy" @click="buyNow">Comprar ahora</button>
            <button class="eva-btn eva-btn--outline detail__add" @click="addToCart">Agregar al carrito</button>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="page__loading">
      <v-progress-circular v-if="loading" indeterminate color="primary" />
      <v-empty-state v-else icon="mdi-alert-circle-outline" title="Producto no encontrado" />
    </div>
  </v-theme-provider>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPublicProductById, incrementProductViews } from '@/services/products'
import { useCartStore } from '@/stores/cart'
import { useBcvRateStore } from '@/stores/bcvRate'
import { effectivePrice, formatMoney, formatBs } from '@/utils/format'

const route = useRoute()
const router = useRouter()
const cart = useCartStore()
const bcv = useBcvRateStore()

bcv.load()

const product = ref(null)
const loading = ref(true)
const quantity = ref(1)
const activeIndex = ref(0)

const images = computed(() => product.value?.product_images ?? [])
const activeImage = computed(() => images.value[activeIndex.value]?.url)

watch(images, () => {
  activeIndex.value = 0
})

function addToCart() {
  cart.add(product.value, quantity.value)
  router.push({ name: 'cart' })
}

function buyNow() {
  cart.add(product.value, quantity.value)
  router.push({ name: 'checkout' })
}

onMounted(async () => {
  try {
    product.value = await fetchPublicProductById(route.params.id)
    incrementProductViews(route.params.id)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.page {
  min-height: 100%;
  padding-bottom: clamp(32px, 5vw, 56px);
}
.page__header {
  padding: clamp(16px, 3vw, 28px) clamp(20px, 5vw, 56px) 0;
}
.page__back {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 1px;
  color: rgba(var(--v-theme-on-background), 0.75);
  text-decoration: none;
}
.page__back:hover {
  color: rgb(var(--v-theme-primary));
}
.page__loading {
  display: flex;
  justify-content: center;
  padding: 80px 20px;
}

.detail {
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(24px, 4vw, 56px);
  padding: clamp(16px, 3vw, 24px) clamp(20px, 5vw, 56px) 0;
}
@media (min-width: 960px) {
  .detail {
    grid-template-columns: 1fr 1fr;
  }
}

.detail__main {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 20px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
}
.detail__main img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.detail__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(var(--v-theme-on-background), 0.6);
}
.detail__thumbs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-top: 16px;
}
.detail__thumb {
  position: relative;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  overflow: hidden;
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  cursor: pointer;
  padding: 0;
}
.detail__thumb--active {
  border-color: rgb(var(--v-theme-primary));
}
.detail__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.detail__info {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-top: 8px;
}
.detail__category {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgb(var(--v-theme-primary));
}
.detail__title {
  font-size: clamp(28px, 3.5vw, 38px);
  font-weight: 900;
  margin: 0;
  line-height: 1.1;
}
.detail__price {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: clamp(28px, 3vw, 40px);
}
.detail__old-price {
  font-size: 15px;
  color: rgba(var(--v-theme-on-background), 0.7);
  text-decoration: line-through;
  margin-top: -10px;
}
.detail__price-bs {
  font-size: 14px;
  color: rgba(var(--v-theme-on-background), 0.75);
  margin-top: -10px;
}
.detail__shipping {
  display: inline-flex;
  width: fit-content;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 1px;
  padding: 8px 16px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 30px;
  color: rgba(var(--v-theme-on-background), 0.85);
}
.detail__description {
  font-size: 15px;
  line-height: 1.6;
  color: rgba(var(--v-theme-on-background), 0.85);
  margin: 8px 0 0;
  white-space: pre-line;
}
.detail__stock-row {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 8px;
}
.detail__stock-text {
  font-size: 13px;
  color: rgba(var(--v-theme-on-background), 0.7);
}
.detail__actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 8px;
  max-width: 340px;
}
.detail__buy,
.detail__add {
  padding: 16px;
  border-radius: 14px;
  font-size: 13px;
}
</style>
