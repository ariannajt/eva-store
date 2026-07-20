<template>
  <section class="eva-theme banner">
    <h2 class="banner__title">¿CONOCES NUESTRO SISTEMA DE ENCARGO?</h2>
    <p class="banner__text">
      Puedes encargarnos cualquier periférico o componente que necesites y no tengamos en stock.
    </p>
    <p class="banner__highlight">CANCELANDO SOLO EL 40% DE SU VALOR TOTAL</p>
    <a class="eva-btn eva-btn--outline banner__cta" :href="link" target="_blank" rel="noopener">
      Escríbenos aquí
    </a>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { whatsappLink } from '@/utils/format'

const link = computed(() =>
  whatsappLink('Hola, quiero hacer un encargo de un producto que no tienen en stock.'),
)
</script>

<style scoped>
.banner {
  background: var(--eva-banner-bg);
  border: 1px solid var(--eva-banner-border);
  border-radius: 24px;
  padding: clamp(28px, 5vw, 56px) clamp(20px, 4vw, 56px);
  text-align: center;
  margin: clamp(32px, 5vw, 64px) clamp(20px, 5vw, 56px) 0;
}
.banner__title {
  font-family: var(--eva-font-display);
  font-size: clamp(22px, 3.5vw, 38px);
  font-weight: 900;
  margin: 0 0 clamp(14px, 2vw, 20px);
  color: var(--eva-accent);
  text-shadow: 0 0 18px oklch(0.55 0.22 145 / 0.6);
}
.banner__text {
  max-width: 680px;
  margin: 0 auto clamp(10px, 1.5vw, 12px);
  font-size: clamp(14px, 1.4vw, 18px);
  color: var(--eva-text);
}
.banner__highlight {
  font-family: var(--eva-font-mono);
  letter-spacing: 2px;
  font-size: clamp(12px, 1.2vw, 16px);
  color: var(--eva-accent);
  margin: clamp(14px, 2vw, 20px) 0 clamp(20px, 2.5vw, 28px);
}
.banner__cta {
  display: inline-block;
  text-decoration: none;
  font-size: clamp(11px, 1vw, 13px);
  padding: clamp(12px, 1.5vw, 14px) clamp(24px, 3vw, 32px);
  width: 100%;
  max-width: 340px;
}
</style>
