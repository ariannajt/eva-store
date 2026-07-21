import { supabase } from '@/lib/supabase'

// Trae los productos activos para el catálogo público, con sus fotos.
// No incluye los que están marcados "Próximamente" (esos van en su propia sección).
export async function fetchPublicProducts({ search = '', categoryId = null } = {}) {
  let query = supabase
    .from('products')
    .select('*, product_images(id, url, position), categories(id, name)')
    .eq('active', true)
    .eq('coming_soon', false)
    .order('created_at', { ascending: false })

  if (search) query = query.ilike('name', `%${search}%`)
  if (categoryId) query = query.eq('category_id', categoryId)

  const { data, error } = await query
  if (error) throw error
  return data.map(sortImages)
}

// Productos "Próximamente" para la sección aparte del catálogo.
export async function fetchComingSoonProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, url, position), categories(id, name)')
    .eq('active', true)
    .eq('coming_soon', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(sortImages)
}

export async function fetchPublicProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select('*, product_images(id, url, position), categories(id, name)')
    .eq('id', id)
    .eq('active', true)
    .single()
  if (error) throw error
  return sortImages(data)
}

// Panel de administración: trae todos los productos (activos e inactivos).
export async function fetchAdminProducts({ search = '' } = {}) {
  let query = supabase
    .from('products')
    .select('*, product_images(id, url, position), categories(id, name)')
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  const { data, error } = await query
  if (error) throw error
  return data.map(sortImages)
}

export async function createProduct(payload) {
  const { data, error } = await supabase.from('products').insert(payload).select().single()
  if (error) throw error
  return data
}

export async function updateProduct(id, payload) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...payload, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}

export async function addProductImage(productId, url, position = 0) {
  const { data, error } = await supabase
    .from('product_images')
    .insert({ product_id: productId, url, position })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProductImage(imageId) {
  const { error } = await supabase.from('product_images').delete().eq('id', imageId)
  if (error) throw error
}

export async function updateProductImagePosition(imageId, position) {
  const { error } = await supabase.from('product_images').update({ position }).eq('id', imageId)
  if (error) throw error
}

export async function incrementProductViews(productId) {
  const { error } = await supabase.rpc('increment_product_views', { p_product_id: productId })
  if (error) console.error(error)
}

export async function fetchMostViewed(limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, views_count, sold_count')
    .order('views_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

export async function fetchMostSold(limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select('id, name, views_count, sold_count')
    .order('sold_count', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

function sortImages(product) {
  if (product?.product_images) {
    product.product_images = [...product.product_images].sort((a, b) => a.position - b.position)
  }
  return product
}
