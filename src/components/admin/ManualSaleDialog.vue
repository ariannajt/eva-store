<template>
  <v-dialog :model-value="modelValue" max-width="600" @update:model-value="$emit('update:modelValue', $event)">
    <v-card theme="light">
      <v-card-title class="text-h6">Registrar venta fuera de la página</v-card-title>
      <v-card-text>
        <v-row v-for="(line, idx) in lines" :key="idx" dense align="center">
          <v-col cols="6">
            <v-select
              v-model="line.product_id"
              :items="products"
              item-title="name"
              item-value="id"
              label="Producto"
              variant="outlined"
              density="comfortable"
              @update:model-value="onProductChange(line)"
            />
          </v-col>
          <v-col cols="3">
            <v-text-field v-model.number="line.quantity" label="Cant." type="number" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="2">
            <v-text-field v-model.number="line.unit_price" label="Precio" type="number" variant="outlined" density="comfortable" />
          </v-col>
          <v-col cols="1">
            <v-btn icon="mdi-close" size="small" variant="text" @click="lines.splice(idx, 1)" />
          </v-col>
        </v-row>
        <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" class="mb-4" @click="addLine">
          Agregar producto
        </v-btn>

        <v-text-field v-model="customerName" label="Cliente (opcional)" variant="outlined" class="mb-1" />
        <v-textarea v-model="notes" label="Notas (opcional)" variant="outlined" rows="2" />

        <div class="text-h6 text-right">Total: {{ formatMoney(total) }}</div>
        <v-alert v-if="errorMsg" type="error" variant="tonal" class="mt-2">{{ errorMsg }}</v-alert>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="submit">Registrar venta</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { fetchAdminProducts } from '@/services/products'
import { createManualSale } from '@/services/orders'
import { useBcvRateStore } from '@/stores/bcvRate'
import { formatMoney } from '@/utils/format'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'saved'])

const bcv = useBcvRateStore()
const products = ref([])
const lines = ref([])
const customerName = ref('')
const notes = ref('')
const saving = ref(false)
const errorMsg = ref('')

function addLine() {
  lines.value.push({ product_id: null, quantity: 1, unit_price: 0 })
}

function onProductChange(line) {
  const p = products.value.find((p) => p.id === line.product_id)
  if (p) line.unit_price = p.price
}

const total = computed(() =>
  lines.value.reduce((sum, l) => sum + (Number(l.unit_price) || 0) * (Number(l.quantity) || 0), 0),
)

async function submit() {
  errorMsg.value = ''
  const validLines = lines.value.filter((l) => l.product_id && l.quantity > 0)
  if (!validLines.length) {
    errorMsg.value = 'Agrega al menos un producto.'
    return
  }
  saving.value = true
  try {
    await createManualSale({
      items: validLines.map((l) => ({ product_id: l.product_id, quantity: l.quantity, unit_price: l.unit_price })),
      customerName: customerName.value,
      notes: notes.value,
      bcvRate: bcv.rate,
    })
    emit('saved')
    emit('update:modelValue', false)
  } catch (err) {
    errorMsg.value = err.message ?? 'No se pudo registrar la venta.'
  } finally {
    saving.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      lines.value = [{ product_id: null, quantity: 1, unit_price: 0 }]
      customerName.value = ''
      notes.value = ''
      errorMsg.value = ''
    }
  },
)

onMounted(async () => {
  bcv.load()
  products.value = await fetchAdminProducts()
})
</script>
