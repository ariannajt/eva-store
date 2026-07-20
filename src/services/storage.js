import { supabase } from '@/lib/supabase'

function randomName(file) {
  const ext = file.name.split('.').pop()
  return `${crypto.randomUUID()}.${ext}`
}

export async function uploadProductImage(file) {
  const path = randomName(file)
  const { error } = await supabase.storage.from('product-images').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('product-images').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadPaymentScreenshot(file) {
  const path = randomName(file)
  const { error } = await supabase.storage.from('payment-screenshots').upload(path, file)
  if (error) throw error
  const { data } = supabase.storage.from('payment-screenshots').getPublicUrl(path)
  return data.publicUrl
}
