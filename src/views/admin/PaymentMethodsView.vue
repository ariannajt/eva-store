<template>
  <div>
    <div class="d-flex align-center mb-4">
      <h1 class="text-h5 font-weight-bold">Métodos de pago</h1>
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openCreate">Nuevo método</v-btn>
    </div>

    <v-row>
      <v-col v-for="pm in methods" :key="pm.id" cols="12" md="6">
        <v-card variant="outlined">
          <v-card-item>
            <v-card-title class="d-flex align-center">
              {{ pm.name }}
              <v-chip :color="pm.active ? 'success' : 'grey'" size="small" class="ml-3">
                {{ pm.active ? 'Activo' : 'Oculto' }}
              </v-chip>
            </v-card-title>
          </v-card-item>
          <v-card-text style="white-space: pre-line">{{ pm.details }}</v-card-text>
          <v-card-actions>
            <v-btn variant="text" @click="openEdit(pm)">Editar</v-btn>
            <v-btn variant="text" color="error" @click="remove(pm)">Eliminar</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialog" max-width="500">
      <v-card theme="light">
        <v-card-title class="text-h6">{{ editing?.id ? 'Editar método' : 'Nuevo método' }}</v-card-title>
        <v-card-text>
          <v-text-field v-model="form.name" label="Nombre (ej. Transferencia bancaria)" variant="outlined" class="mb-1" />
          <v-textarea
            v-model="form.details"
            label="Datos a mostrar (cuenta, cédula, banco, etc.)"
            variant="outlined"
            rows="4"
          />
          <v-switch v-model="form.active" label="Visible para clientes" color="success" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">Cancelar</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  fetchAllPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '@/services/paymentMethods'

const methods = ref([])
const dialog = ref(false)
const editing = ref(null)
const saving = ref(false)
const form = reactive({ name: '', details: '', active: true })

async function load() {
  methods.value = await fetchAllPaymentMethods()
}

function openCreate() {
  editing.value = null
  Object.assign(form, { name: '', details: '', active: true })
  dialog.value = true
}

function openEdit(pm) {
  editing.value = pm
  Object.assign(form, { name: pm.name, details: pm.details, active: pm.active })
  dialog.value = true
}

async function save() {
  saving.value = true
  try {
    if (editing.value?.id) {
      await updatePaymentMethod(editing.value.id, { ...form })
    } else {
      await createPaymentMethod({ ...form, position: methods.value.length })
    }
    dialog.value = false
    await load()
  } finally {
    saving.value = false
  }
}

async function remove(pm) {
  if (!confirm(`¿Eliminar "${pm.name}"?`)) return
  await deletePaymentMethod(pm.id)
  await load()
}

onMounted(load)
</script>
