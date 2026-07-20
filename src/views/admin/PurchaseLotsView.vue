<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Reponer stock</h1>

    <v-row>
      <v-col cols="12" md="5">
        <v-card variant="outlined" class="pa-4">
          <v-select
            v-model="productId"
            :items="products"
            item-title="name"
            item-value="id"
            label="Producto"
            variant="outlined"
          />

          <template v-if="selectedProduct">
            <v-row dense>
              <v-col cols="6">
                <v-text-field v-model.number="quantity" label="Cantidad" type="number" variant="outlined" />
              </v-col>
              <v-col cols="6">
                <v-text-field
                  v-model.number="purchaseTotal"
                  label="Precio total del lote ($)"
                  type="number"
                  variant="outlined"
                />
              </v-col>
            </v-row>
            <v-text-field
              v-model.number="shippingTotal"
              label="Costo de envío total ($)"
              type="number"
              variant="outlined"
            />
            <v-text-field v-model="note" label="Nota (opcional)" variant="outlined" />

            <v-alert type="info" variant="tonal" density="comfortable" class="mb-4">
              <div>Costo por unidad de este lote: <b>{{ formatMoney(unitCostPreview) }}</b></div>
              <div>Precio de venta actual: <b>{{ formatMoney(selectedProduct.price) }}</b></div>
              <div>
                Margen estimado:
                <b :class="marginPreview.amount >= 0 ? 'text-success' : 'text-error'">
                  {{ formatMoney(marginPreview.amount) }} ({{ marginPreview.percent }}%)
                </b>
              </div>
            </v-alert>

            <v-btn color="primary" block :loading="saving" @click="submit">Registrar lote</v-btn>
          </template>
        </v-card>
      </v-col>

      <v-col cols="12" md="7">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">Historial de lotes</v-card-title>
          <v-data-table :headers="lotHeaders" :items="lots" :loading="loadingLots" item-key="id" density="comfortable">
            <template #item.created_at="{ item }">{{ formatDate(item.created_at) }}</template>
            <template #item.purchase_total="{ item }">{{ formatMoney(item.purchase_total) }}</template>
            <template #item.shipping_total="{ item }">{{ formatMoney(item.shipping_total) }}</template>
            <template #item.unit_cost="{ item }">{{ formatMoney(item.unit_cost) }}</template>
          </v-data-table>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fetchAdminProducts } from '@/services/products'
import { addPurchaseLot, fetchLotsByProduct } from '@/services/purchaseLots'
import { formatMoney, formatDate, margin, round2 } from '@/utils/format'

const products = ref([])
const productId = ref(null)
const lots = ref([])
const loadingLots = ref(false)
const saving = ref(false)

const quantity = ref(1)
const purchaseTotal = ref(0)
const shippingTotal = ref(0)
const note = ref('')

const lotHeaders = [
  { title: 'Fecha', key: 'created_at' },
  { title: 'Cantidad', key: 'quantity' },
  { title: 'Precio total', key: 'purchase_total' },
  { title: 'Envío', key: 'shipping_total' },
  { title: 'Costo/unidad', key: 'unit_cost' },
  { title: 'Nota', key: 'note' },
]

const selectedProduct = computed(() => products.value.find((p) => p.id === productId.value))

const unitCostPreview = computed(() =>
  quantity.value > 0 ? round2((Number(purchaseTotal.value) + Number(shippingTotal.value)) / quantity.value) : 0,
)

const marginPreview = computed(() => margin(selectedProduct.value?.price ?? 0, unitCostPreview.value))

async function loadLots() {
  if (!productId.value) return
  loadingLots.value = true
  try {
    lots.value = await fetchLotsByProduct(productId.value)
  } finally {
    loadingLots.value = false
  }
}

async function submit() {
  saving.value = true
  try {
    await addPurchaseLot({
      productId: productId.value,
      quantity: quantity.value,
      purchaseTotal: purchaseTotal.value,
      shippingTotal: shippingTotal.value,
      note: note.value,
    })
    quantity.value = 1
    purchaseTotal.value = 0
    shippingTotal.value = 0
    note.value = ''
    await Promise.all([loadLots(), loadProducts()])
  } finally {
    saving.value = false
  }
}

async function loadProducts() {
  products.value = await fetchAdminProducts()
}

watch(productId, loadLots)

onMounted(async () => {
  await loadProducts()
  if (products.value.length) productId.value = products.value[0].id
})
</script>
