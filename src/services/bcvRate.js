import { supabase } from '@/lib/supabase'

// Tasa oficial del Euro (BCV), usada para mostrar el total también en bolívares.
export async function fetchBcvRate() {
  const { data, error } = await supabase.functions.invoke('get-bcv-rate')
  if (error) throw error
  if (data.error) throw new Error(data.error)
  return data // { rate, updatedAt }
}
