<template>
  <div class="steps">
    <div v-for="s in steps" :key="s.n" class="steps__item">
      <div class="steps__circle" :class="{ 'steps__circle--active': s.n <= current }">{{ s.n }}</div>
      <div class="steps__label">{{ s.label }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ current: { type: Number, default: 1 } })

const steps = [
  { n: 1, label: 'PEDIDO' },
  { n: 2, label: 'DATOS Y PAGO' },
  { n: 3, label: 'CONFIRMACIÓN' },
]
</script>

<style scoped>
.steps {
  display: flex;
  justify-content: center;
  gap: clamp(20px, 4vw, 40px);
  padding: 8px 20px 32px;
  flex-wrap: wrap;
}
.steps__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.steps__circle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgb(var(--v-theme-surface-variant));
  color: rgb(var(--v-theme-on-surface));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Space Mono', monospace;
  font-weight: 700;
  font-size: 14px;
}
.steps__circle--active {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}
.steps__label {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 1px;
  color: rgba(var(--v-theme-on-background), 0.75);
  white-space: nowrap;
}
</style>
