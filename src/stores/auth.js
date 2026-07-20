import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'

// Sesión del panel de administración (login con email + contraseña de Supabase Auth).
export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const ready = ref(false)

  async function init() {
    const { data } = await supabase.auth.getSession()
    user.value = data.session?.user ?? null
    ready.value = true
    supabase.auth.onAuthStateChange((_event, session) => {
      user.value = session?.user ?? null
    })
  }

  async function login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    user.value = data.user
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
  }

  return { user, ready, init, login, logout }
})
