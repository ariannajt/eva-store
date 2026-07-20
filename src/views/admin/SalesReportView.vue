<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Reporte de ventas</h1>

    <v-row align="center" class="mb-2">
      <v-col cols="6" md="3">
        <v-text-field v-model="from" type="date" label="Desde" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="6" md="3">
        <v-text-field v-model="to" type="date" label="Hasta" variant="outlined" density="comfortable" />
      </v-col>
      <v-col cols="12" md="3">
        <v-btn color="primary" :loading="loading" @click="load">Aplicar</v-btn>
        <v-btn variant="text" class="ml-2" @click="resetToCurrentMonth">Este mes</v-btn>
      </v-col>
    </v-row>

    <v-row class="mb-2">
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Ingresos</div>
          <div class="text-h6 font-weight-bold">{{ formatMoney(totals.revenue) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Costo</div>
          <div class="text-h6 font-weight-bold">{{ formatMoney(totals.cost) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Ganancia</div>
          <div class="text-h6 font-weight-bold text-success">{{ formatMoney(totals.margin) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Margen %</div>
          <div class="text-h6 font-weight-bold">{{ totals.marginPercent }}%</div>
        </v-card>
      </v-col>
    </v-row>

    <v-data-table :headers="headers" :items="rows" :loading="loading" item-key="id">
      <template #item.created_at="{ item }">{{ formatDateTime(item.orders.created_at) }}</template>
      <template #item.customer="{ item }">{{ item.orders.customer_name || '-' }}</template>
      <template #item.sale_type="{ item }">
        <v-chip size="small" :color="item.orders.sale_type === 'manual' ? 'info' : 'primary'" variant="tonal">
          {{ item.orders.sale_type === 'manual' ? 'Manual' : 'Online' }}
        </v-chip>
      </template>
      <template #item.revenue="{ item }">{{ formatMoney(item.unit_price * item.quantity) }}</template>
      <template #item.cost="{ item }">{{ formatMoney(item.unit_cost * item.quantity) }}</template>
      <template #item.margin="{ item }">
        <span class="text-success">{{ formatMoney((item.unit_price - item.unit_cost) * item.quantity) }}</span>
      </template>
    </v-data-table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { fetchSalesReport } from '@/services/orders'
import { formatMoney, formatDateTime, currentMonthRange, round2 } from '@/utils/format'

const { from: defaultFrom, to: defaultTo } = currentMonthRange()
const from = ref(defaultFrom)
const to = ref(defaultTo)
const rows = ref([])
const loading = ref(true)

const headers = [
  { title: 'Fecha', key: 'created_at' },
  { title: 'Cliente', key: 'customer' },
  { title: 'Tipo', key: 'sale_type' },
  { title: 'Producto', key: 'product_name' },
  { title: 'Cant.', key: 'quantity' },
  { title: 'Ingreso', key: 'revenue' },
  { title: 'Costo', key: 'cost' },
  { title: 'Ganancia', key: 'margin' },
]

const totals = computed(() => {
  const revenue = round2(rows.value.reduce((s, r) => s + r.unit_price * r.quantity, 0))
  const cost = round2(rows.value.reduce((s, r) => s + r.unit_cost * r.quantity, 0))
  const margin = round2(revenue - cost)
  const marginPercent = revenue > 0 ? round2((margin / revenue) * 100) : 0
  return { revenue, cost, margin, marginPercent }
})

async function load() {
  loading.value = true
  try {
    rows.value = await fetchSalesReport({ from: from.value, to: `${to.value} 23:59:59` })
  } finally {
    loading.value = false
  }
}

function resetToCurrentMonth() {
  const range = currentMonthRange()
  from.value = range.from
  to.value = range.to
  load()
}

onMounted(load)
</script>
