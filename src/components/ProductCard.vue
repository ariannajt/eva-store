<template>
  <router-link :to="{ name: 'product-detail', params: { id: product.id } }" class="card">
    <div class="card__image">
      <img v-if="coverImage" :src="coverImage" alt="" class="card__img" />
      <div v-else class="card__img card__img--placeholder">
        <v-icon icon="mdi-image-off-outline" size="32" />
      </div>
      <span v-if="product.coming_soon" class="card__badge card__badge--soon">Próximamente</span>
      <span v-else-if="product.discount_active" class="card__badge card__badge--discount">
        -{{ product.discount_percent }}%
      </span>
      <span v-if="!product.coming_soon && product.stock <= 0" class="card__badge card__badge--stock">Agotado</span>
    </div>
    <div class="card__body">
      <div v-if="product.categories" class="card__category">{{ product.categories.name }}</div>
      <div class="card__name">{{ product.name }}</div>
      <div v-if="product.coming_soon" class="card__soon-text">Muy pronto disponible</div>
      <div v-else class="card__price-row">
        <span class="card__shipping">Envíos nacionales</span>
        <span class="card__price">{{ formatMoney(effectivePrice(product)) }}</span>
      </div>
      <span v-if="!product.coming_soon && product.discount_active" class="card__old-price">
        {{ formatMoney(product.price) }}
      </span>
    </div>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { effectivePrice, formatMoney } from '@/utils/format'

const props = defineProps({ product: { type: Object, required: true } })

const coverImage = computed(() => props.product.product_images?.[0]?.url)
</script>

<style scoped>
.card {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--eva-bg-soft);
  border: 1px solid var(--eva-border);
  border-radius: 14px;
  overflow: hidden;
  text-decoration: none;
  color: var(--eva-text);
}
.card__image {
  position: relative;
  aspect-ratio: 1 / 1;
  max-height: 200px;
  background: white;
}
.card__img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
.card__img--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  color: oklch(0.6 0.02 300);
}
.card__badge {
  position: absolute;
  top: 8px;
  font-family: var(--eva-font-mono);
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 20px;
  color: #0a0a0f;
}
.card__badge--discount {
  left: 8px;
  background: var(--eva-accent);
}
.card__badge--stock {
  right: 8px;
  background: oklch(0.75 0.02 300);
}
.card__badge--soon {
  left: 8px;
  background: var(--eva-accent);
}
.card__soon-text {
  font-size: 11px;
  color: var(--eva-text-soft);
  margin-top: auto;
  padding-top: 6px;
}
.card__body {
  padding: 12px 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}
.card__category {
  font-family: var(--eva-font-mono);
  font-size: 10px;
  letter-spacing: 0.5px;
  color: var(--eva-accent);
  text-transform: uppercase;
}
.card__name {
  font-weight: 700;
  font-size: 13px;
  line-height: 1.3;
}
.card__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
  padding-top: 6px;
  gap: 6px;
}
.card__shipping {
  font-family: var(--eva-font-mono);
  font-size: 9px;
  color: var(--eva-text-soft);
  border: 1px solid var(--eva-border-soft);
  border-radius: 20px;
  padding: 3px 8px;
  white-space: nowrap;
}
.card__price {
  font-family: var(--eva-font-mono);
  font-weight: 700;
  font-size: 16px;
}
.card__old-price {
  font-size: 11px;
  color: var(--eva-text-soft);
  text-decoration: line-through;
}

@media (max-width: 600px) {
  .card__price-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
