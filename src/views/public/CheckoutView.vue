<template>
  <v-theme-provider theme="neon" with-background tag="div" class="eva-theme page">
    <CheckoutSteps :current="2" />

    <div class="page__inner">
      <h1 class="page__title">Finalizar compra</h1>

      <v-alert v-if="errorMsg" type="error" variant="tonal" class="mb-4" closable @click:close="errorMsg = ''">
        {{ errorMsg }}
      </v-alert>

      <v-alert v-if="!cart.items.length" type="info" variant="tonal">
        Tu carrito está vacío. <router-link :to="{ name: 'catalog' }">Ir al catálogo</router-link>
      </v-alert>

      <v-form v-else @submit.prevent="submit" class="layout">
        <div class="layout__main">
          <div class="section">
            <div class="section__label">1 · TU PEDIDO</div>
            <div v-for="it in cart.items" :key="it.product.id" class="order-row">
              <img class="order-row__img" :src="it.product.product_images?.[0]?.url" alt="" />
              <div class="order-row__info">
                <div class="order-row__name">{{ it.product.name }}</div>
                <div class="order-row__qty">Cantidad: {{ it.quantity }}</div>
              </div>
              <div class="order-row__price">{{ formatMoney(effectivePrice(it.product) * it.quantity) }}</div>
            </div>
          </div>

          <div class="section">
            <div class="section__label">2 · TUS DATOS</div>
            <v-text-field v-model="customerName" label="Tu nombre" variant="outlined" class="mb-1" required />
            <div class="phone-row">
              <v-select
                v-model="phonePrefix"
                :items="phonePrefixItems"
                item-title="label"
                item-value="value"
                label="Prefijo"
                variant="outlined"
                class="phone-row__prefix"
                required
              />
              <v-text-field
                v-model="phoneDigits"
                label="Número"
                placeholder="6687433"
                maxlength="7"
                variant="outlined"
                required
              />
            </div>
          </div>

          <div class="section">
            <div class="section__label">3 · MÉTODO DE PAGO</div>
            <v-radio-group v-model="paymentMethodId" hide-details>
              <div v-for="pm in paymentMethods" :key="pm.id" class="payment-option">
                <v-radio :value="pm.id" :label="pm.name" />
                <div class="d-flex align-center ga-2 ml-8 mt-1">
                  <span class="text-body-2" style="white-space: pre-line; opacity: 0.8">{{ pm.details }}</span>
                  <v-btn icon="mdi-content-copy" size="x-small" variant="text" @click="copy(pm.details)" />
                </div>
              </div>
            </v-radio-group>
            <p v-if="!paymentMethods.length" class="text-body-2" style="opacity: 0.7">
              Aún no hay métodos de pago configurados.
            </p>

            <v-file-input
              v-model="screenshotFile"
              label="Comprobante de pago (captura de pantalla)"
              accept="image/*"
              prepend-icon="mdi-camera"
              variant="outlined"
              required
              class="mt-4 mb-1"
            />
            <v-textarea v-model="notes" label="Notas adicionales (opcional)" variant="outlined" rows="2" />
          </div>

          <div class="section">
            <div class="section__label">4 · MÉTODO DE ENTREGA</div>
            <v-radio-group v-model="deliveryMethod" hide-details>
              <div class="payment-option">
                <v-radio value="pickup" label="Entrega personal" />
              </div>
              <div class="payment-option">
                <v-radio value="local_delivery" label="Delivery (Ciudad Ojeda, Estado Zulia)" />
              </div>
              <div class="payment-option">
                <v-radio value="shipping" label="Envío a otra ciudad o estado" />
              </div>
            </v-radio-group>

            <div v-if="deliveryMethod === 'pickup'" class="delivery-info">
              <p class="mb-1">Debes retirarlo en:</p>
              <p class="font-weight-bold mb-1">
                Calle Padre Olivares, Casa 23A, Ciudad Ojeda, Estado Zulia
              </p>
              <a
                href="https://maps.app.goo.gl/yaEhuKepc9kyKufn9?g_st=ic"
                target="_blank"
                rel="noopener"
                class="delivery-info__link"
              >
                Ver ubicación en Google Maps
              </a>
              <p class="mt-2 mb-0">Horario: entre 9am y 7pm</p>
            </div>

            <div v-else-if="deliveryMethod === 'local_delivery'" class="delivery-info">
              <v-text-field
                v-model="deliveryAddress"
                label="Dirección de entrega en Ciudad Ojeda"
                variant="outlined"
                required
              />
            </div>

            <div v-else-if="deliveryMethod === 'shipping'" class="delivery-info">
              <v-radio-group v-model="deliveryCourier" hide-details inline class="mb-2">
                <v-radio value="mrw" label="MRW" />
                <v-radio value="zoom" label="Zoom" />
                <v-radio value="tealca" label="Tealca" />
              </v-radio-group>
              <v-text-field v-model="deliveryRecipientName" label="Nombre" variant="outlined" class="mb-1" required />
              <v-text-field
                v-model="deliveryRecipientLastname"
                label="Apellido"
                variant="outlined"
                class="mb-1"
                required
              />
              <v-text-field
                v-model="deliveryRecipientCedula"
                label="Cédula"
                variant="outlined"
                class="mb-1"
                required
              />
              <v-text-field
                v-model="deliveryAddress"
                :label="`Dirección de la oficina ${courierLabel} destino`"
                variant="outlined"
                required
              />
              <p class="text-caption mt-1 mb-0" style="opacity: 0.75">
                El envío es por cobro a destino: se paga en la oficina al retirar el paquete.
              </p>
            </div>
          </div>
        </div>

        <div class="summary">
          <div class="section__label">RESUMEN</div>
          <div class="summary__row"><span>Subtotal</span><span>{{ formatMoney(cart.total) }}</span></div>
          <div class="summary__row"><span>Envío</span><span>A coordinar</span></div>
          <div class="summary__divider" />
          <div class="summary__total"><span>Total</span><span>{{ formatMoney(cart.total) }}</span></div>
          <div v-if="bcv.rate" class="summary__total-bs">
            <span>Total en bolívares</span><span>{{ formatBs(cart.total * bcv.rate) }}</span>
          </div>
          <div class="summary__rate">
            Tasa BCV (Euro): <span v-if="bcv.rate">{{ formatBs(bcv.rate) }}</span
            ><span v-else-if="bcv.loading">cargando...</span><span v-else>no disponible</span>
          </div>
          <button type="submit" class="eva-btn eva-btn--solid summary__cta" :disabled="submitting">
            {{ submitting ? 'Enviando...' : 'Confirmar pedido' }}
          </button>
        </div>
      </v-form>
    </div>
  </v-theme-provider>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/cart'
import { useBcvRateStore } from '@/stores/bcvRate'
import { effectivePrice, formatMoney, formatBs, VENEZUELAN_PHONE_PREFIXES } from '@/utils/format'
import { fetchActivePaymentMethods } from '@/services/paymentMethods'
import { uploadPaymentScreenshot } from '@/services/storage'
import { createOnlineOrder } from '@/services/orders'
import CheckoutSteps from '@/components/public/CheckoutSteps.vue'

const router = useRouter()
const cart = useCartStore()
const bcv = useBcvRateStore()

const paymentMethods = ref([])
const paymentMethodId = ref(null)
const customerName = ref('')
const phonePrefix = ref(VENEZUELAN_PHONE_PREFIXES[0].value)
const phoneDigits = ref('')
const screenshotFile = ref(null)
const notes = ref('')
const submitting = ref(false)
const errorMsg = ref('')

const deliveryMethod = ref('pickup')
const deliveryAddress = ref('')
const deliveryCourier = ref('mrw')
const deliveryRecipientName = ref('')
const deliveryRecipientLastname = ref('')
const deliveryRecipientCedula = ref('')

const courierLabel = computed(
  () => ({ mrw: 'MRW', zoom: 'Zoom', tealca: 'Tealca' })[deliveryCourier.value] ?? '',
)

const phonePrefixItems = VENEZUELAN_PHONE_PREFIXES.map((p) => ({
  value: p.value,
  label: `${p.value} · ${p.carrier}`,
}))
const customerContact = computed(() => phonePrefix.value + phoneDigits.value)

function copy(text) {
  navigator.clipboard?.writeText(text)
}

function showError(msg) {
  errorMsg.value = msg
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function submit() {
  errorMsg.value = ''
  if (!customerName.value || !phoneDigits.value) {
    showError('Completa tu nombre y tu teléfono de contacto: son obligatorios.')
    return
  }
  if (!/^\d{7}$/.test(phoneDigits.value)) {
    showError('El número de teléfono debe tener 7 dígitos después del prefijo (ej. 6687433).')
    return
  }
  if (!paymentMethodId.value) {
    showError('Selecciona un método de pago.')
    return
  }
  const file = Array.isArray(screenshotFile.value) ? screenshotFile.value[0] : screenshotFile.value
  if (!file) {
    showError('Adjunta el comprobante de pago.')
    return
  }
  if (deliveryMethod.value === 'local_delivery' && !deliveryAddress.value) {
    showError('Indica la dirección de entrega.')
    return
  }
  if (deliveryMethod.value === 'shipping') {
    if (!deliveryCourier.value) {
      showError('Selecciona la empresa de encomienda.')
      return
    }
    if (
      !deliveryRecipientName.value ||
      !deliveryRecipientLastname.value ||
      !deliveryRecipientCedula.value ||
      !deliveryAddress.value
    ) {
      showError('Completa los datos del envío (nombre, apellido, cédula y dirección de destino).')
      return
    }
  }

  submitting.value = true
  try {
    const screenshotUrl = await uploadPaymentScreenshot(file)
    const items = cart.items.map((it) => ({ product_id: it.product.id, quantity: it.quantity }))
    const order = await createOnlineOrder({
      customerName: customerName.value,
      customerContact: customerContact.value,
      paymentMethodId: paymentMethodId.value,
      screenshotUrl,
      items,
      notes: notes.value,
      deliveryMethod: deliveryMethod.value,
      deliveryAddress: deliveryMethod.value === 'pickup' ? null : deliveryAddress.value,
      deliveryCourier: deliveryMethod.value === 'shipping' ? deliveryCourier.value : null,
      deliveryRecipientName: deliveryMethod.value === 'shipping' ? deliveryRecipientName.value : null,
      deliveryRecipientLastname: deliveryMethod.value === 'shipping' ? deliveryRecipientLastname.value : null,
      deliveryRecipientCedula: deliveryMethod.value === 'shipping' ? deliveryRecipientCedula.value : null,
      bcvRate: bcv.rate,
    })
    cart.clear()
    router.push({ name: 'order-confirmation', params: { id: order.id } })
  } catch (err) {
    showError(err.message ?? 'No se pudo crear el pedido.')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  bcv.load()
  paymentMethods.value = await fetchActivePaymentMethods().catch(() => [])
  if (paymentMethods.value.length) paymentMethodId.value = paymentMethods.value[0].id
})
</script>

<style scoped>
.page {
  min-height: 100%;
  padding-bottom: clamp(32px, 5vw, 56px);
}
.page__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 40px);
}
.page__title {
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
  margin: 0 0 20px;
  text-align: center;
}

.layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  align-items: start;
}
@media (min-width: 960px) {
  .layout {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

.layout__main {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section {
  background: rgb(var(--v-theme-surface));
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 20px;
  padding: 24px;
}
.section__label {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  letter-spacing: 2px;
  color: rgb(var(--v-theme-primary));
  margin-bottom: 16px;
}

.phone-row {
  display: flex;
  gap: 12px;
}
.phone-row__prefix {
  max-width: 160px;
  flex: none;
}

.order-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
}
.order-row__img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  flex: none;
  background: rgb(var(--v-theme-surface-variant));
}
.order-row__info {
  flex: 1;
}
.order-row__name {
  font-weight: 700;
  font-size: 14px;
}
.order-row__qty {
  font-size: 12px;
  opacity: 0.7;
}
.order-row__price {
  font-family: 'Space Mono', monospace;
  font-weight: 700;
}

.payment-option {
  margin-bottom: 12px;
  padding: 10px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
}

.delivery-info {
  margin-top: 8px;
  padding: 16px;
  border: 1px solid rgb(var(--v-theme-surface-variant));
  border-radius: 12px;
  font-size: 14px;
}
.delivery-info__link {
  color: rgb(var(--v-theme-primary));
}

.summary {
  background: var(--eva-banner-bg);
  border: 1px solid var(--eva-banner-border);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  height: fit-content;
}
.summary__row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  opacity: 0.85;
}
.summary__divider {
  height: 1px;
  background: rgb(var(--v-theme-surface-variant));
  margin: 4px 0;
}
.summary__total {
  display: flex;
  justify-content: space-between;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 22px;
}
.summary__total-bs {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  opacity: 0.8;
  margin-top: -6px;
}
.summary__rate {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  opacity: 0.65;
}
.summary__cta {
  margin-top: 8px;
  padding: 16px;
  border-radius: 14px;
  font-size: 13px;
}
.summary__cta:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
