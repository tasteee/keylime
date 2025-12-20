import { browser } from '$app/environment'
import { createSupabaseClient } from '$lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserProfileT = {
  id: string
  userName: string
  avatarUrl: string | null
  bio: string
  createdAt: Date
  updatedAt: Date
}

class AuthStore {
  user = $state<User | null>(null)
  userProfile = $state<UserProfileT | null>(null)
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

  loadUserProfile = async () => {
    const hasUser = this.user !== null
    if (!hasUser) {
      this.userProfile = null
      return
    }

    const supabase = createSupabaseClient()
    const { data, error } = await supabase
      .from('all_users')
      .select('*')
      .eq('id', this.user!.id)
      .single()

    if (error) {
      console.error('Error loading user profile:', error)
      return
    }

    this.userProfile = data
  }

  initialize = async () => {
    const supabase = createSupabaseClient()

    // Get initial session
    const {
      data: { user }
    } = await supabase.auth.getUser()
    this.user = user

    // Load user profile if authenticated
    if (user) {
      await this.loadUserProfile()
    }

    this.isLoading = false

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      this.user = session?.user ?? null
      if (session?.user) {
        await this.loadUserProfile()
      } else {
        this.userProfile = null
      }
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

    if (!data.user) {
      this.error = 'No user returned from signup'
      return { success: false, error: 'No user returned from signup' }
    }

    // Create all_users profile entry
    const createProfileResult = await this.createUserProfile({
      userId: data.user.id,
      userName: args.email,
      bio: ''
    })

    if (!createProfileResult.success) {
      this.error = createProfileResult.error || 'Failed to create user profile'
      return { success: false, error: createProfileResult.error || 'Failed to create user profile' }
    }

    return { success: true, user: data.user }
  }

  createUserProfile = async (args: { userId: string; userName: string; bio: string }) => {
    const supabase = createSupabaseClient()

    const { error } = await supabase.from('all_users').insert({
      id: args.userId,
      userName: args.userName,
      bio: args.bio
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
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
    this.userProfile = null
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
