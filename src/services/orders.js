import { supabase } from '@/lib/supabase'

// ---- Cliente (catálogo público) --------------------------------------------

// items: [{ product_id, quantity }]
export async function createOnlineOrder({
  customerName,
  customerContact,
  paymentMethodId,
  screenshotUrl,
  items,
  notes,
  deliveryMethod,
  deliveryAddress,
  deliveryCourier,
  deliveryRecipientName,
  deliveryRecipientLastname,
  deliveryRecipientCedula,
  bcvRate,
}) {
  const { data, error } = await supabase.rpc('create_online_order', {
    p_customer_name: customerName,
    p_customer_contact: customerContact,
    p_payment_method_id: paymentMethodId,
    p_payment_screenshot_url: screenshotUrl,
    p_items: items,
    p_notes: notes ?? '',
    p_delivery_method: deliveryMethod ?? 'pickup',
    p_delivery_address: deliveryAddress ?? null,
    p_delivery_courier: deliveryCourier ?? null,
    p_delivery_recipient_name: deliveryRecipientName ?? null,
    p_delivery_recipient_lastname: deliveryRecipientLastname ?? null,
    p_delivery_recipient_cedula: deliveryRecipientCedula ?? null,
    p_bcv_rate: bcvRate ?? null,
  })
  if (error) throw error

  // Avisa al vendedor (email/WhatsApp); si falla el aviso no se revierte el pedido.
  supabase.functions.invoke('notify-new-payment', { body: { orderId: data.id } }).catch(() => {})

  return data
}

// ---- Panel de administración ------------------------------------------------

export async function fetchOrders({ status = null, from = null, to = null } = {}) {
  let query = supabase
    .from('orders')
    .select('*, order_items(*), payment_methods(name)')
    .order('created_at', { ascending: false })

  if (status) query = query.eq('status', status)
  if (from) query = query.gte('created_at', from)
  if (to) query = query.lte('created_at', to)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function confirmOrder(orderId) {
  const { data, error } = await supabase.rpc('confirm_order', { p_order_id: orderId })
  if (error) throw error
  return data
}

export async function rejectOrder(orderId) {
  const { data, error } = await supabase.rpc('reject_order', { p_order_id: orderId })
  if (error) throw error
  return data
}

// Venta hecha fuera de la página. items: [{ product_id, quantity, unit_price }]
export async function createManualSale({ items, customerName, notes, bcvRate }) {
  const { data, error } = await supabase.rpc('create_manual_sale', {
    p_items: items,
    p_customer_name: customerName ?? '',
    p_notes: notes ?? '',
    p_bcv_rate: bcvRate ?? null,
  })
  if (error) throw error
  return data
}

// ---- Reporte de ventas -------------------------------------------------------

// Trae todas las líneas de venta (order_items) de pedidos confirmados o
// manuales dentro de un rango de fechas, para el reporte y el cálculo de margen.
export async function fetchSalesReport({ from, to }) {
  const { data, error } = await supabase
    .from('order_items')
    .select('*, orders!inner(id, status, sale_type, created_at, customer_name)')
    .in('orders.status', ['confirmed', 'manual'])
    .gte('orders.created_at', from)
    .lte('orders.created_at', to)
    .order('created_at', { referencedTable: 'orders', ascending: false })

  if (error) throw error
  return data
}
