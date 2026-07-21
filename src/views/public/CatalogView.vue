<template>
  <div class="eva-theme page">
    <CatalogHero v-model="categoryId" :categories="categories" @browse="scrollToGrid" />

    <div class="page__search">
      <v-icon icon="mdi-magnify" size="18" class="page__search-icon" />
      <input v-model="search" type="text" class="page__search-input" placeholder="Buscar artículos..." />
    </div>

    <div ref="gridRef" class="page__grid">
      <div v-if="loading" class="page__grid-cols">
        <div v-for="n in 8" :key="n" class="card card--skeleton" />
      </div>

      <div v-else-if="products.length" class="page__grid-cols">
        <ProductCard v-for="p in products" :key="p.id" :product="p" />
      </div>

      <div v-else class="page__empty">
        <v-icon icon="mdi-package-variant-closed" size="40" />
        <p>Todavía no hay productos que coincidan con la búsqueda.</p>
      </div>
    </div>

    <ComingSoonSection v-if="comingSoonProducts.length" :products="comingSoonProducts" />

    <EncargoBanner />
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import ProductCard from '@/components/ProductCard.vue'
import CatalogHero from '@/components/public/CatalogHero.vue'
import EncargoBanner from '@/components/public/EncargoBanner.vue'
import ComingSoonSection from '@/components/public/ComingSoonSection.vue'
import { fetchPublicProducts, fetchComingSoonProducts } from '@/services/products'
import { fetchCategories } from '@/services/categories'

const products = ref([])
const comingSoonProducts = ref([])
const categories = ref([])
const search = ref('')
const categoryId = ref('')
const loading = ref(true)
const gridRef = ref(null)
let debounceTimer

async function load() {
  loading.value = true
  try {
    products.value = await fetchPublicProducts({ search: search.value, categoryId: categoryId.value || null })
  } finally {
    loading.value = false
  }
}

function scrollToGrid() {
  gridRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch([search, categoryId], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
})

onMounted(async () => {
  categories.value = await fetchCategories().catch(() => [])
  comingSoonProducts.value = await fetchComingSoonProducts().catch(() => [])
  load()
})
</script>

<style scoped>
.page {
  padding-bottom: clamp(32px, 5vw, 56px);
}

.page__search {
  position: relative;
  max-width: 480px;
  margin: 25px auto clamp(20px, 3vw, 32px);
  padding: 0 20px;
  display: flex;
  align-items: center;
}
.page__search-icon {
  position: absolute;
  left: 34px;
  color: var(--eva-text-soft);
}
.page__search-input {
  width: 100%;
  background: var(--eva-bg-soft);
  border: 1px solid var(--eva-border);
  border-radius: 30px;
  color: var(--eva-text);
  font-family: var(--eva-font-display);
  font-size: 14px;
  padding: 10px 16px 10px 40px;
}
.page__search-input::placeholder {
  color: var(--eva-text-soft);
}
.page__search-input:focus {
  outline: none;
  border-color: var(--eva-accent);
}

.page__grid {
  padding: 0 clamp(16px, 5vw, 56px);
}
.page__grid-cols {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14px;
}
@media (min-width: 600px) {
  .page__grid-cols {
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
  }
}
@media (min-width: 960px) {
  .page__grid-cols {
    grid-template-columns: repeat(6, 1fr);
    gap: 24px;
  }
}

.card--skeleton {
  aspect-ratio: 3 / 4;
  background: linear-gradient(
    100deg,
    var(--eva-bg-soft) 30%,
    oklch(0.26 0.06 300) 50%,
    var(--eva-bg-soft) 70%
  );
  background-size: 200% 100%;
  animation: eva-shimmer 1.4s infinite;
}
@keyframes eva-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

.page__empty {
  text-align: center;
  color: var(--eva-text-soft);
  padding: 48px 20px;
}
</style>
