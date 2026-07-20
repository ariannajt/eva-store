import { defineStore } from 'pinia'
import { ref } from 'vue'
import { fetchBcvRate } from '@/services/bcvRate'

// Cachea la tasa BCV (Euro) durante la sesión para no pedirla en cada vista.
export const useBcvRateStore = defineStore('bcvRate', () => {
  const rate = ref(null)
  const updatedAt = ref(null)
  const loading = ref(false)
  const error = ref('')
  let loaded = false

  async function load() {
    if (loaded || loading.value) return
    loading.value = true
    error.value = ''
    try {
      const data = await fetchBcvRate()
      rate.value = data.rate
      updatedAt.value = data.updatedAt
      loaded = true
    } catch (err) {
      error.value = err.message ?? 'No se pudo obtener la tasa BCV'
    } finally {
      loading.value = false
    }
  }

  return { rate, updatedAt, loading, error, load }
})
