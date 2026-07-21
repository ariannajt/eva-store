<template>
  <section class="soon">
    <div class="soon__label">PRÓXIMAMENTE</div>
    <div class="soon__scroll">
      <div v-for="p in products" :key="p.id" class="soon__tile">
        <ProductCard :product="p" />
      </div>
    </div>
  </section>
</template>

<script setup>
import ProductCard from '@/components/ProductCard.vue'

defineProps({ products: { type: Array, default: () => [] } })
</script>

<style scoped>
.soon {
  background: var(--eva-bg-soft);
  border: 1px solid var(--eva-border);
  border-radius: 24px;
  padding: clamp(20px, 3vw, 28px);
  margin: clamp(24px, 4vw, 40px) clamp(16px, 5vw, 56px) 0;
}
.soon__label {
  font-family: var(--eva-font-mono);
  font-size: 12px;
  letter-spacing: 2px;
  color: var(--eva-accent);
  margin-bottom: 14px;
}
.soon__scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.soon__tile {
  flex: 0 0 auto;
  width: 180px;
}
</style>
