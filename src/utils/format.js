// Precio final de un producto, aplicando el descuento si está activo.
export function effectivePrice(product) {
  if (!product) return 0
  if (product.discount_active && product.discount_percent > 0) {
    return round2(product.price * (1 - product.discount_percent / 100))
  }
  return product.price
}

export function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100
}

export function formatMoney(n) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'USD' }).format(Number(n) || 0)
}

export function formatBs(n) {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency: 'VES' }).format(Number(n) || 0)
}

export function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('es-VE', { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('es-VE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Margen de ganancia: precio de venta menos costo, en $ y en %.
export function margin(price, cost) {
  const amount = round2(price - cost)
  const percent = price > 0 ? round2((amount / price) * 100) : 0
  return { amount, percent }
}

// Rango del mes actual, usado como filtro por defecto en el reporte de ventas.
export function currentMonthRange() {
  const now = new Date()
  const from = new Date(now.getFullYear(), now.getMonth(), 1)
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
  return { from: toInputDate(from), to: toInputDate(to) }
}

export function toInputDate(d) {
  const date = new Date(d)
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 10)
}

// Link para abrir un chat de WhatsApp con el número de la tienda y un mensaje precargado.
export function whatsappLink(message = '') {
  const phone = import.meta.env.VITE_STORE_WHATSAPP || ''
  const text = message ? `?text=${encodeURIComponent(message)}` : ''
  return `https://wa.me/${phone}${text}`
}

// Link al perfil de Instagram de la tienda, o null si no está configurado.
export function instagramLink() {
  const user = import.meta.env.VITE_STORE_INSTAGRAM || ''
  return user ? `https://instagram.com/${user}` : null
}

// Prefijos de celular venezolanos por operadora.
export const VENEZUELAN_PHONE_PREFIXES = [
  { value: '0412', carrier: 'Digitel' },
  { value: '0422', carrier: 'Digitel' },
  { value: '0414', carrier: 'Movistar' },
  { value: '0424', carrier: 'Movistar' },
  { value: '0416', carrier: 'Movilnet' },
  { value: '0426', carrier: 'Movilnet' },
]

// Valida un número celular venezolano: prefijo válido + 7 dígitos, ej. 04126687433.
export function isValidVenezuelanPhone(phone) {
  const prefixes = VENEZUELAN_PHONE_PREFIXES.map((p) => p.value.slice(1)).join('|')
  return new RegExp(`^0(${prefixes})\\d{7}$`).test(String(phone ?? '').trim())
}
