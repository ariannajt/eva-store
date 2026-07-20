import { supabase } from '@/lib/supabase'

// Registra un lote de compra (reposición de stock) y recalcula el costo
// promedio del producto. Toda la lógica vive en la función SQL add_purchase_lot.
export async function addPurchaseLot({ productId, quantity, purchaseTotal, shippingTotal, note }) {
  const { data, error } = await supabase.rpc('add_purchase_lot', {
    p_product_id: productId,
    p_quantity: quantity,
    p_purchase_total: purchaseTotal,
    p_shipping_total: shippingTotal,
    p_note: note ?? '',
  })
  if (error) throw error
  return data
}

export async function fetchLotsByProduct(productId) {
  const { data, error } = await supabase
    .from('purchase_lots')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}
