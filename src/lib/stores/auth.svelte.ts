import { browser } from '$app/environment'
import { createSupabaseClient } from '$lib/supabase/client'
import type { User } from '@supabase/supabase-js'

class AuthStore {
  user = $state<User | null>(null)
  isLoading = $state(true)
  error = $state<string | null>(null)

  isAuthenticated = $derived.by(() => {
    return this.user !== null
  })

  constructor() {
    if (browser) {
      this.initialize()
    }
  }

  initialize = async () => {
    const supabase = createSupabaseClient()

    // Get initial session
    const {
      data: { user }
    } = await supabase.auth.getUser()
    this.user = user
    this.isLoading = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.user = session?.user ?? null
    })
  }

  signUp = async (args: { email: string; password: string }) => {
    this.error = null
    const supabase = createSupabaseClient()

    const { data, error } = await supabase.auth.signUp({
      email: args.email,
      password: args.password
    })

    if (error) {
      this.error = error.message
      return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
  }

  signIn = async (args: { email: string; password: string }) => {
    this.error = null
    const supabase = createSupabaseClient()
    console.log('Supabase', supabase)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: args.email,
      password: args.password
    })

    if (error) {
      this.error = error.message
      return { success: false, error: error.message }
    }

    this.user = data.user
    return { success: true, user: data.user }
  }

  signOut = async () => {
    this.error = null
    const supabase = createSupabaseClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      this.error = error.message
      return { success: false, error: error.message }
    }

    this.user = null
    return { success: true }
  }

  resetPassword = async (args: { email: string }) => {
    this.error = null
    const supabase = createSupabaseClient()

    const { error } = await supabase.auth.resetPasswordForEmail(args.email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })

    if (error) {
      this.error = error.message
      return { success: false, error: error.message }
    }

    return { success: true }
  }

  updatePassword = async (args: { newPassword: string }) => {
    this.error = null
    const supabase = createSupabaseClient()

    const { error } = await supabase.auth.updateUser({
      password: args.newPassword
    })

    if (error) {
      this.error = error.message
      return { success: false, error: error.message }
    }

    return { success: true }
  }
}

const authStore = new AuthStore()
export default authStore
