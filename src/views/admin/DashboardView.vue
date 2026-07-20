<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-4">Panel general</h1>

    <v-row class="mb-2">
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Ventas este mes</div>
          <div class="text-h5 font-weight-bold text-primary">{{ formatMoney(summary.revenue) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Ganancia este mes</div>
          <div class="text-h5 font-weight-bold text-success">{{ formatMoney(summary.margin) }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center">
          <div class="text-caption text-medium-emphasis">Artículos vendidos</div>
          <div class="text-h5 font-weight-bold">{{ summary.units }}</div>
        </v-card>
      </v-col>
      <v-col cols="6" md="3">
        <v-card variant="outlined" class="pa-4 text-center" :class="pendingCount ? 'border-warning' : ''">
          <div class="text-caption text-medium-emphasis">Pedidos pendientes</div>
          <div class="text-h5 font-weight-bold text-warning">{{ pendingCount }}</div>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">Más vistos</v-card-title>
          <v-list density="compact">
            <v-list-item v-for="(p, i) in mostViewed" :key="p.id">
              <template #prepend>
                <span class="text-medium-emphasis mr-2">{{ i + 1 }}.</span>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
              <template #append>{{ p.views_count }} vistas</template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="6">
        <v-card variant="outlined">
          <v-card-title class="text-subtitle-1">Más vendidos</v-card-title>
          <v-list density="compact">
            <v-list-item v-for="(p, i) in mostSold" :key="p.id">
              <template #prepend>
                <span class="text-medium-emphasis mr-2">{{ i + 1 }}.</span>
              </template>
              <v-list-item-title>{{ p.name }}</v-list-item-title>
              <template #append>{{ p.sold_count }} vendidos</template>
            </v-list-item>
          </v-list>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchMostViewed, fetchMostSold } from '@/services/products'
import { fetchOrders, fetchSalesReport } from '@/services/orders'
import { formatMoney, currentMonthRange } from '@/utils/format'

const summary = ref({ revenue: 0, margin: 0, units: 0 })
const pendingCount = ref(0)
const mostViewed = ref([])
const mostSold = ref([])

onMounted(async () => {
  const { from, to } = currentMonthRange()
  const [rows, pending, viewed, sold] = await Promise.all([
    fetchSalesReport({ from, to: `${to} 23:59:59` }),
    fetchOrders({ status: 'pending' }),
    fetchMostViewed(5),
    fetchMostSold(5),
  ])

  summary.value = rows.reduce(
    (acc, r) => {
      acc.revenue += r.unit_price * r.quantity
      acc.margin += (r.unit_price - r.unit_cost) * r.quantity
      acc.units += r.quantity
      return acc
    },
    { revenue: 0, margin: 0, units: 0 },
  )
  pendingCount.value = pending.length
  mostViewed.value = viewed
  mostSold.value = sold
})
</script>
