<template>
  <div>
    <div class="d-flex align-center mb-4 ga-4 flex-wrap">
      <h1 class="text-h5 font-weight-bold">Pedidos y ventas</h1>
      <v-spacer />
      <v-btn-toggle v-model="statusFilter" color="primary" density="comfortable" mandatory>
        <v-btn value="pending">Pendientes</v-btn>
        <v-btn value="all">Todos</v-btn>
      </v-btn-toggle>
      <v-btn color="primary" prepend-icon="mdi-plus" @click="manualDialog = true">Venta fuera de la página</v-btn>
    </div>

    <v-progress-linear v-if="loading" indeterminate class="mb-4" />

    <v-empty-state v-if="!loading && !orders.length" icon="mdi-receipt-text-outline" title="No hay pedidos" />

    <v-expansion-panels v-else variant="accordion">
      <v-expansion-panel v-for="o in orders" :key="o.id">
        <v-expansion-panel-title>
          <div class="d-flex align-center justify-space-between flex-grow-1 mr-4">
            <div>
              <div class="font-weight-medium">{{ o.customer_name || '(Venta manual)' }}</div>
              <div class="text-caption text-medium-emphasis">{{ formatDateTime(o.created_at) }}</div>
            </div>
            <div class="d-flex flex-column align-end ga-1">
              <div class="d-flex align-center ga-3">
                <span class="font-weight-bold">{{ formatMoney(o.total) }}</span>
                <v-chip :color="statusColor(o.status)" size="small">{{ statusLabel(o.status) }}</v-chip>
              </div>
              <span v-if="o.bcv_rate" class="text-caption text-medium-emphasis">
                {{ formatBs(o.total * o.bcv_rate) }} (tasa del día: {{ formatBs(o.bcv_rate) }})
              </span>
            </div>
          </div>
        </v-expansion-panel-title>
        <v-expansion-panel-text>
          <v-row>
            <v-col cols="12" md="7">
              <v-list density="compact">
                <v-list-item v-for="it in o.order_items" :key="it.id">
                  <v-list-item-title>{{ it.quantity }} x {{ it.product_name }}</v-list-item-title>
                  <template #append>{{ formatMoney(it.unit_price * it.quantity) }}</template>
                </v-list-item>
              </v-list>
              <div class="text-body-2 text-medium-emphasis mt-2">
                Contacto: {{ o.customer_contact || '-' }}<br />
                Método de pago: {{ o.payment_methods?.name || '-' }}<br />
                Entrega: {{ deliveryLabel(o) }}<br />
                <span v-if="o.notes">Notas: {{ o.notes }}</span>
              </div>
            </v-col>
            <v-col cols="12" md="5">
              <v-img
                v-if="o.payment_screenshot_url"
                :src="o.payment_screenshot_url"
                max-height="220"
                class="rounded-lg border cursor-pointer"
                @click="preview = o.payment_screenshot_url"
              />
              <div v-if="o.status === 'pending'" class="d-flex ga-2 mt-4">
                <v-btn color="success" variant="flat" prepend-icon="mdi-check" :loading="busyId === o.id" @click="handleConfirm(o)">
                  Confirmar pago
                </v-btn>
                <v-btn color="error" variant="outlined" prepend-icon="mdi-close" :loading="busyId === o.id" @click="handleReject(o)">
                  Rechazar
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-expansion-panel-text>
      </v-expansion-panel>
    </v-expansion-panels>

    <v-dialog v-model="previewOpen" max-width="500">
      <v-img :src="preview" />
    </v-dialog>

    <ManualSaleDialog v-model="manualDialog" @saved="load" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import ManualSaleDialog from '@/components/admin/ManualSaleDialog.vue'
import { fetchOrders, confirmOrder, rejectOrder } from '@/services/orders'
import { formatMoney, formatBs, formatDateTime } from '@/utils/format'

const orders = ref([])
const loading = ref(true)
const statusFilter = ref('pending')
const manualDialog = ref(false)
const busyId = ref(null)
const preview = ref(null)

const previewOpen = computed({
  get: () => !!preview.value,
  set: (v) => { if (!v) preview.value = null },
})

async function load() {
  loading.value = true
  try {
    orders.value = await fetchOrders(statusFilter.value === 'pending' ? { status: 'pending' } : {})
  } finally {
    loading.value = false
  }
}

function statusLabel(s) {
  return { pending: 'Pendiente', confirmed: 'Confirmado', rejected: 'Rechazado', manual: 'Venta manual' }[s] ?? s
}

const courierNames = { mrw: 'MRW', zoom: 'Zoom', tealca: 'Tealca' }

function deliveryLabel(o) {
  if (o.delivery_method === 'local_delivery') {
    return `Delivery Ciudad Ojeda — ${o.delivery_address || 'sin dirección'}`
  }
  if (o.delivery_method === 'shipping') {
    const courier = courierNames[o.delivery_courier] ?? o.delivery_courier ?? '-'
    const recipient = [o.delivery_recipient_name, o.delivery_recipient_lastname].filter(Boolean).join(' ')
    return `Envío por ${courier} (cobro a destino) — ${recipient || 'sin nombre'}, CI ${
      o.delivery_recipient_cedula || '-'
    }, oficina destino: ${o.delivery_address || '-'}`
  }
  return 'Entrega personal en tienda'
}
function statusColor(s) {
  return { pending: 'warning', confirmed: 'success', rejected: 'error', manual: 'info' }[s] ?? 'grey'
}

async function handleConfirm(o) {
  busyId.value = o.id
  try {
    await confirmOrder(o.id)
    await load()
  } finally {
    busyId.value = null
  }
}

async function handleReject(o) {
  if (!window.confirm(`¿Rechazar el pedido de ${o.customer_name}? El stock se restaurará.`)) return
  busyId.value = o.id
  try {
    await rejectOrder(o.id)
    await load()
  } finally {
    busyId.value = null
  }
}

watch(statusFilter, load)
onMounted(load)
</script>
