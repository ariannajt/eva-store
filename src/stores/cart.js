import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { effectivePrice } from '@/utils/format'

const STORAGE_KEY = 'catalogo-tienda:cart'

function loadInitial() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// Carrito de compras del cliente, guardado en localStorage para que
// sobreviva si recarga la página.
export const useCartStore = defineStore('cart', () => {
  const items = ref(loadInitial()) // [{ product, quantity }]

  watch(items, (val) => localStorage.setItem(STORAGE_KEY, JSON.stringify(val)), { deep: true })

  const count = computed(() => items.value.reduce((sum, it) => sum + it.quantity, 0))
  const total = computed(() =>
    items.value.reduce((sum, it) => sum + effectivePrice(it.product) * it.quantity, 0),
  )

  function add(product, quantity = 1) {
    const existing = items.value.find((it) => it.product.id === product.id)
    const maxQty = product.stock
    if (existing) {
      existing.quantity = Math.min(existing.quantity + quantity, maxQty)
    } else {
      items.value.push({ product, quantity: Math.min(quantity, maxQty) })
    }
  }

  function updateQuantity(productId, quantity) {
    const it = items.value.find((it) => it.product.id === productId)
    if (!it) return
    if (quantity <= 0) {
      remove(productId)
    } else {
      it.quantity = Math.min(quantity, it.product.stock)
    }
  }

  function remove(productId) {
    items.value = items.value.filter((it) => it.product.id !== productId)
  }

  function clear() {
    items.value = []
  }

  return { items, count, total, add, updateQuantity, remove, clear }
})
