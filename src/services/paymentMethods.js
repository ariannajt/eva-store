import { supabase } from '@/lib/supabase'

export async function fetchActivePaymentMethods() {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('active', true)
    .order('position')
  if (error) throw error
  return data
}

export async function fetchAllPaymentMethods() {
  const { data, error } = await supabase.from('payment_methods').select('*').order('position')
  if (error) throw error
  return data
}

export async function createPaymentMethod(payload) {
  const { data, error } = await supabase.from('payment_methods').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updatePaymentMethod(id, payload) {
  const { data, error } = await supabase
    .from('payment_methods')
    .update(payload)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deletePaymentMethod(id) {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id)
  if (error) throw error
}
