<template>
  <section class="eva-theme hero">
    <div class="hero__glow" aria-hidden="true">
      <div class="hero__blob hero__blob--purple" />
      <div class="hero__blob hero__blob--green" />
    </div>

    <div class="hero__intro">
      <div class="hero__eyebrow">TECNOLOGÍA · PERIFÉRICOS · COMPONENTES</div>
      <h1 class="hero__title">TODO PARA TU SETUP</h1>
      <p class="hero__subtitle">
        Mouses, teclados, cámaras, tarjetas de video y más..
      </p>
      <div class="hero__shipping">
        <p>Envíos a todo el país </p>
        <img :src="venezuela" alt="Venezuela" />
      </div>
      <button class="eva-btn eva-btn--solid hero__cta" @click="$emit('browse')">Ver catálogo</button>
    </div>

    <div v-if="categories.length" class="hero__chips">
      <button
        class="eva-chip"
        :class="{ 'is-active': !modelValue }"
        @click="$emit('update:modelValue', '')"
      >
        Todas
      </button>
      <button
        v-for="c in categories"
        :key="c.id"
        class="eva-chip"
        :class="{ 'is-active': modelValue === c.id }"
        @click="$emit('update:modelValue', c.id)"
      >
        {{ c.name }}
      </button>
    </div>
  </section>
</template>

<script setup>
import venezuela from '@/assets/venezuela.svg'

defineProps({
  categories: { type: Array, default: () => [] },
  modelValue: { type: String, default: '' },
})
defineEmits(['update:modelValue', 'browse'])
</script>

<style scoped>
.hero {
  position: relative;
  overflow: hidden;
  padding: clamp(28px, 6vw, 48px) clamp(20px, 6vw, 56px) clamp(32px, 5vw, 48px);
}

.hero__glow {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
.hero__blob {
  position: absolute;
  border-radius: 50%;
}
.hero__blob--purple {
  top: clamp(-200px, -14vw, -120px);
  left: clamp(-150px, -10vw, -100px);
  width: clamp(320px, 45vw, 700px);
  height: clamp(320px, 45vw, 700px);
  background: radial-gradient(circle, var(--eva-glow-purple), transparent 70%);
}
.hero__blob--green {
  top: clamp(220px, 20vw, 300px);
  right: clamp(-250px, -16vw, -140px);
  width: clamp(350px, 50vw, 800px);
  height: clamp(350px, 50vw, 800px);
  background: radial-gradient(circle, var(--eva-glow-green), transparent 70%);
}

.hero__intro {
  position: relative;
  text-align: center;
  max-width: 760px;
  margin: 0 auto;
}
.hero__eyebrow {
  font-family: var(--eva-font-mono);
  letter-spacing: 4px;
  font-size: clamp(10px, 1.2vw, 14px);
  color: var(--eva-accent);
  margin-bottom: clamp(12px, 2vw, 18px);
}
.hero__title {
  font-size: clamp(34px, 6.5vw, 76px);
  font-weight: 900;
  line-height: 1.03;
  margin: 0 0 clamp(14px, 2vw, 20px);
  text-shadow: 0 0 20px oklch(0.55 0.22 145 / 0.5);
}
.hero__subtitle {
  margin: 0 auto clamp(10px, 0vw, 15px);
  font-size: clamp(14px, 1.4vw, 18px);
  color: var(--eva-text-soft);
}
.hero__cta {
  font-size: clamp(12px, 1vw, 14px);
  padding: clamp(13px, 1.5vw, 16px) clamp(28px, 3vw, 36px);
  width: 100%;
  max-width: 340px;
}

.hero__chips {
  position: relative;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
  overflow-x: auto;
  padding-top: clamp(24px, 3vw, 40px);
}

.hero__shipping {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: clamp(22px, 3vw, 32px);
}

.hero__shipping img {
  width: 24px;
  height: 24px;
}

@media (max-width: 600px) {
  .hero__chips {
    flex-wrap: nowrap;
    justify-content: flex-start;
  }
  .hero__cta {
    max-width: none;
  }
}
</style>
