<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="$emit('update:modelValue', $event)">
    <v-card theme="light">
      <v-card-title class="text-h6 d-flex align-center justify-space-between">
        Escanear código de barras
        <v-btn icon="mdi-close" variant="text" size="small" @click="$emit('update:modelValue', false)" />
      </v-card-title>
      <v-card-text>
        <div :id="containerId" class="scanner-box" />
        <v-alert v-if="errorMsg" type="error" variant="tonal" density="compact" class="mt-2">
          {{ errorMsg }}
        </v-alert>
        <div class="text-caption text-medium-emphasis mt-2">
          Apunta la cámara al código de barras del producto.
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, watch, onBeforeUnmount, nextTick } from 'vue'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'

const props = defineProps({ modelValue: Boolean })
const emit = defineEmits(['update:modelValue', 'detected'])

const containerId = `barcode-scanner-${Math.random().toString(36).slice(2)}`
const errorMsg = ref('')
let scanner = null

async function startScanner() {
  errorMsg.value = ''
  await nextTick()
  scanner = new Html5Qrcode(containerId, {
    formatsToSupport: [
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.EAN_8,
      Html5QrcodeSupportedFormats.UPC_A,
      Html5QrcodeSupportedFormats.UPC_E,
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.CODE_39,
      Html5QrcodeSupportedFormats.ITF,
      Html5QrcodeSupportedFormats.CODABAR,
      Html5QrcodeSupportedFormats.QR_CODE,
    ],
    // El navegador puede reportar soporte para su BarcodeDetector nativo sin
    // que funcione de verdad (pasa seguido en Chrome/Edge de Windows: la API
    // existe pero el componente de detección no está instalado y nunca
    // devuelve resultados). Forzamos el decodificador propio de la librería,
    // que sí funciona en todos lados.
    useBarCodeDetectorIfSupported: false,
    verbose: false,
  })
  try {
    await scanner.start(
      { facingMode: 'environment' },
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => ({
          width: Math.floor(viewfinderWidth * 0.85),
          height: Math.floor(viewfinderHeight * 0.4),
        }),
      },
      (decodedText) => {
        emit('detected', decodedText)
        emit('update:modelValue', false)
      },
      () => {},
    )
  } catch (err) {
    errorMsg.value = 'No se pudo acceder a la cámara. Revisa los permisos del navegador.'
  }
}

async function stopScanner() {
  if (!scanner) return
  const active = scanner
  scanner = null
  try {
    if (active.isScanning) await active.stop()
    active.clear()
  } catch {
    // el escáner puede ya estar detenido, no hay nada que limpiar
  }
}

watch(
  () => props.modelValue,
  (open) => (open ? startScanner() : stopScanner()),
)

onBeforeUnmount(stopScanner)
</script>

<style scoped>
.scanner-box {
  width: 100%;
  min-height: 220px;
}
</style>
