<template>
  <div>
    <div class="d-flex align-center mb-4 ga-4 flex-wrap">
      <h1 class="text-h5 font-weight-bold">Productos</h1>
      <v-spacer />
      <v-text-field
        v-model="search"
        prepend-inner-icon="mdi-magnify"
        label="Buscar"
        density="compact"
        variant="outlined"
        hide-details
        style="max-width: 260px"
      />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nuevo producto</v-btn>
    </div>

    <v-data-table :headers="headers" :items="products" :loading="loading" item-key="id">
      <template #item.photo="{ item }">
        <v-avatar rounded="lg" size="48" class="my-2">
          <v-img :src="item.product_images?.[0]?.url" cover />
        </v-avatar>
      </template>
      <template #item.price="{ item }">
        <div>{{ formatMoney(effectivePrice(item)) }}</div>
        <div v-if="item.discount_active" class="text-caption text-error">-{{ item.discount_percent }}%</div>
      </template>
      <template #item.cost="{ item }">{{ formatMoney(item.cost) }}</template>
      <template #item.margin="{ item }">
        <span :class="marginOf(item).amount >= 0 ? 'text-success' : 'text-error'">
          {{ formatMoney(marginOf(item).amount) }} ({{ marginOf(item).percent }}%)
        </span>
      </template>
      <template #item.stock="{ item }">
        <v-chip :color="item.stock > 0 ? 'success' : 'grey'" size="small" variant="tonal">{{ item.stock }}</v-chip>
      </template>
      <template #item.active="{ item }">
        <v-chip :color="item.active ? 'success' : 'grey'" size="small" variant="flat" class="mb-1">
          {{ item.active ? 'Visible' : 'Oculto' }}
        </v-chip>
        <v-chip v-if="item.coming_soon" color="success" size="small" variant="flat">Próximamente</v-chip>
      </template>
      <template #item.owner="{ item }">
        <v-btn-toggle
          :model-value="item.owner"
          density="compact"
          color="primary"
          @update:model-value="(val) => setOwner(item, val)"
        >
          <v-btn value="ari" size="small">Ari</v-btn>
          <v-btn value="daniel" size="small">Daniel</v-btn>
        </v-btn-toggle>
      </template>
      <template #item.actions="{ item }">
        <v-btn icon="mdi-pencil" size="small" variant="text" @click="openEdit(item)" />
        <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" @click="remove(item)" />
      </template>
    </v-data-table>

    <ProductFormDialog v-model="dialog" :product="editingProduct" @saved="load" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import ProductFormDialog from '@/components/admin/ProductFormDialog.vue'
import { fetchAdminProducts, deleteProduct, updateProduct } from '@/services/products'
import { effectivePrice, formatMoney, margin } from '@/utils/format'

const products = ref([])
const loading = ref(true)
const search = ref('')
const dialog = ref(false)
const editingProduct = ref(null)
let debounceTimer

const headers = [
  { title: '', key: 'photo', sortable: false, width: 60 },
  { title: 'Nombre', key: 'name' },
  { title: 'Precio', key: 'price' },
  { title: 'Costo', key: 'cost' },
  { title: 'Margen', key: 'margin', sortable: false },
  { title: 'Stock', key: 'stock' },
  { title: 'Estado', key: 'active' },
  { title: 'Dueño', key: 'owner', sortable: false },
  { title: '', key: 'actions', sortable: false, width: 100 },
]

function marginOf(item) {
  return margin(effectivePrice(item), item.cost)
}

async function load() {
  loading.value = true
  try {
    products.value = await fetchAdminProducts({ search: search.value })
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editingProduct.value = null
  dialog.value = true
}

function openEdit(item) {
  editingProduct.value = item
  dialog.value = true
}

async function setOwner(item, owner) {
  const previous = item.owner
  item.owner = owner ?? null
  try {
    await updateProduct(item.id, { owner: item.owner })
  } catch (err) {
    item.owner = previous
    throw err
  }
}

async function remove(item) {
  if (!confirm(`¿Eliminar "${item.name}"? Esta acción no se puede deshacer.`)) return
  await deleteProduct(item.id)
  load()
}

watch(search, () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(load, 300)
})

onMounted(load)
</script>
