<template>
  <v-dialog :model-value="modelValue" max-width="700" scrollable @update:model-value="$emit('update:modelValue', $event)">
    <v-card theme="light">
      <v-card-title class="text-h6">{{ isEdit ? 'Editar producto' : 'Nuevo producto' }}</v-card-title>
      <v-card-text>
        <v-row dense class="mb-2">
          <v-col cols="9">
            <v-text-field
              v-model="amazonUrl"
              label="Link de Amazon (opcional)"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
          <v-col cols="3">
            <v-btn block height="56" color="secondary" :loading="importing" @click="importFromAmazon">
              Importar
            </v-btn>
          </v-col>
        </v-row>
        <v-alert v-if="importMsg" :type="importError ? 'warning' : 'success'" variant="tonal" density="compact" class="mb-4">
          {{ importMsg }}
        </v-alert>

        <v-text-field v-model="form.name" label="Nombre" variant="outlined" class="mb-1" required />
        <v-textarea v-model="form.description" label="Descripción" variant="outlined" rows="3" class="mb-1" />

        <v-row dense>
          <v-col cols="8">
            <v-select
              v-model="form.category_id"
              :items="categories"
              item-title="name"
              item-value="id"
              label="Categoría"
              variant="outlined"
              clearable
            />
          </v-col>
          <v-col cols="4">
            <v-btn variant="tonal" block height="56" @click="addCategory">+ Categoría</v-btn>
          </v-col>
        </v-row>

        <v-row dense>
          <v-col cols="6">
            <v-text-field v-model.number="form.price" label="Precio de venta ($)" type="number" variant="outlined" />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="form.stock"
              label="Stock"
              type="number"
              variant="outlined"
              :hint="isEdit ? 'Para reponer stock con su costo, usa \'Reponer stock\'' : ''"
              :persistent-hint="isEdit"
            />
          </v-col>
        </v-row>

        <v-row v-if="!isEdit" dense>
          <v-col cols="12">
            <v-text-field
              v-model.number="initialCost"
              label="Costo de inversión por unidad ($) (opcional)"
              type="number"
              variant="outlined"
              hint="Se registra como el primer lote de compra en 'Reponer stock'"
              persistent-hint
            />
          </v-col>
        </v-row>
        <v-alert v-if="!isEdit && initialCost > 0 && form.stock > 0" type="info" variant="tonal" density="comfortable" class="mb-4">
          <div>Inversión total: <b>{{ formatMoney(initialCost * form.stock) }}</b></div>
          <div>
            Margen estimado:
            <b :class="initialMargin.amount >= 0 ? 'text-success' : 'text-error'">
              {{ formatMoney(initialMargin.amount) }} ({{ initialMargin.percent }}%)
            </b>
          </div>
        </v-alert>

        <v-row dense align="center">
          <v-col cols="6">
            <v-switch v-model="form.discount_active" label="Aplicar descuento" color="primary" hide-details />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="form.discount_percent"
              label="Descuento (%)"
              type="number"
              variant="outlined"
              :disabled="!form.discount_active"
              density="comfortable"
            />
          </v-col>
        </v-row>

        <v-switch v-model="form.active" label="Visible en el catálogo" color="success" hide-details class="mb-2" />
        <v-switch
          v-model="form.coming_soon"
          label="Próximamente (aún no se puede comprar)"
          color="info"
          hide-details
          class="mb-4"
        />

        <div class="mb-2 font-weight-medium">Fotos</div>
        <div class="text-caption text-medium-emphasis mb-2">
          La foto principal es la que se muestra en el catálogo. Pasa el mouse sobre una foto y toca la estrella para hacerla principal.
        </div>
        <div class="d-flex flex-wrap ga-2 mb-2">
          <div v-for="(img, idx) in images" :key="img.id ?? img.url" class="position-relative image-tile">
            <v-img :src="img.url" width="90" height="90" cover class="rounded-lg image-tile__img" :class="{ 'image-tile__img--main': idx === 0 }" />
            <v-chip v-if="idx === 0" size="x-small" color="primary" class="position-absolute" style="bottom: 4px; left: 4px">
              Principal
            </v-chip>
            <v-btn
              v-else
              icon="mdi-star-outline"
              size="x-small"
              color="primary"
              class="position-absolute image-tile__star"
              style="bottom: -6px; left: -6px"
              title="Hacer principal"
              @click="makeMain(img)"
            />
            <v-btn
              icon="mdi-close"
              size="x-small"
              color="error"
              class="position-absolute"
              style="top: -6px; right: -6px"
              @click="removeImage(img)"
            />
          </div>
        </div>
        <v-file-input
          v-model="newImageFiles"
          label="Agregar fotos"
          accept="image/*"
          multiple
          variant="outlined"
          density="comfortable"
          prepend-icon="mdi-camera"
          @update:model-value="uploadNewImages"
        />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)">Cancelar</v-btn>
        <v-btn color="primary" :loading="saving" @click="save">Guardar</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  createProduct,
  updateProduct,
  addProductImage,
  deleteProductImage,
  updateProductImagePosition,
} from '@/services/products'
import { fetchCategories, createCategory } from '@/services/categories'
import { uploadProductImage } from '@/services/storage'
import { fetchAmazonProduct } from '@/services/amazonImport'
import { addPurchaseLot } from '@/services/purchaseLots'
import { formatMoney, margin } from '@/utils/format'

const props = defineProps({
  modelValue: Boolean,
  product: { type: Object, default: null },
})
const emit = defineEmits(['update:modelValue', 'saved'])

const isEdit = computed(() => !!props.product?.id)

const blankForm = () => ({
  name: '',
  description: '',
  category_id: null,
  price: 0,
  stock: 0,
  discount_active: false,
  discount_percent: 0,
  active: true,
  coming_soon: false,
})

const form = reactive(blankForm())
const initialCost = ref(0)
const amazonUrl = ref('')
const images = ref([])
const newImageFiles = ref([])
const categories = ref([])
const saving = ref(false)
const importing = ref(false)
const importMsg = ref('')
const importError = ref(false)

const initialMargin = computed(() => margin(form.price, initialCost.value))

function resetFromProduct() {
  Object.assign(form, blankForm())
  initialCost.value = 0
  images.value = []
  amazonUrl.value = ''
  importMsg.value = ''
  if (props.product) {
    Object.assign(form, {
      name: props.product.name,
      description: props.product.description,
      category_id: props.product.category_id,
      price: props.product.price,
      stock: props.product.stock,
      discount_active: props.product.discount_active,
      discount_percent: props.product.discount_percent,
      active: props.product.active,
      coming_soon: props.product.coming_soon,
    })
    amazonUrl.value = props.product.amazon_url ?? ''
    images.value = props.product.product_images ?? []
  }
}

watch(() => props.modelValue, (open) => { if (open) resetFromProduct() })

async function addCategory() {
  const name = prompt('Nombre de la nueva categoría')
  if (!name) return
  const cat = await createCategory(name)
  categories.value.push(cat)
  form.category_id = cat.id
}

async function importFromAmazon() {
  if (!amazonUrl.value) return
  importing.value = true
  importMsg.value = ''
  try {
    const result = await fetchAmazonProduct(amazonUrl.value)
    if (result.error) {
      importError.value = true
      importMsg.value = result.error
      return
    }
    if (result.title) form.name = result.title
    if (result.description) form.description = result.description
    if (result.price) form.price = Number(result.price.replace(',', '.')) || form.price
    if (result.image) {
      images.value.push({ url: result.image, _pending: true })
    }
    importError.value = false
    importMsg.value = 'Datos importados. Revísalos antes de guardar.'
  } catch (err) {
    importError.value = true
    importMsg.value = 'No se pudo importar desde Amazon. Completa los datos a mano.'
  } finally {
    importing.value = false
  }
}

async function uploadNewImages(files) {
  if (!files?.length) return
  for (const file of files) {
    const url = await uploadProductImage(file)
    images.value.push({ url, _pending: true })
  }
  newImageFiles.value = []
}

async function removeImage(img) {
  images.value = images.value.filter((i) => i !== img)
  if (img.id) await deleteProductImage(img.id)
}

// Mueve la foto al primer lugar: esa es la que se usa como principal en el catálogo.
function makeMain(img) {
  images.value = [img, ...images.value.filter((i) => i !== img)]
}

async function save() {
  saving.value = true
  try {
    const payload = { ...form, amazon_url: amazonUrl.value || null }
    let saved
    if (isEdit.value) {
      saved = await updateProduct(props.product.id, payload)
    } else {
      const hasInitialCost = initialCost.value > 0 && form.stock > 0
      // Si hay costo, el stock se carga vía "lote de compra" (igual que en
      // Reponer stock) para que el costo promedio y el historial cuadren.
      saved = await createProduct({ ...payload, stock: hasInitialCost ? 0 : form.stock })
      if (hasInitialCost) {
        await addPurchaseLot({
          productId: saved.id,
          quantity: form.stock,
          purchaseTotal: initialCost.value * form.stock,
          shippingTotal: 0,
          note: 'Costo inicial al crear el producto',
        })
      }
    }
    for (const [idx, img] of images.value.entries()) {
      if (img.id) {
        if (img.position !== idx) await updateProductImagePosition(img.id, idx)
      } else {
        await addProductImage(saved.id, img.url, idx)
      }
    }
    emit('saved')
    emit('update:modelValue', false)
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  categories.value = await fetchCategories().catch(() => [])
})
</script>

<style scoped>
.image-tile__img {
  border: 2px solid transparent;
}
.image-tile__img--main {
  border-color: rgb(var(--v-theme-primary));
}
</style>
