import { supabase } from '@/lib/supabase'

// Llama a la función de Supabase que intenta leer título/foto/descripción
// de una página de Amazon. Devuelve { title, image, description, price }
// o { error } si no se pudo leer.
export async function fetchAmazonProduct(url) {
  const { data, error } = await supabase.functions.invoke('fetch-amazon-product', {
    body: { url },
  })
  if (error) throw error
  return data
}
