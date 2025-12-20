import { browser } from '$app/environment'
import { goto } from '$app/navigation'
import { getUserById } from '$lib/modules/database'
import { warnWhen } from '$lib/modules/warnWhen'
import { createSupabaseClient } from '$lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type SignUpArgsT = {
  email: string
  password: string
}

type SignInArgsT = {
  email: string
  password: string
}

type CreateUserProfileArgsT = {
  userId: string
  userName: string
  bio: string
}

type ResetPasswordArgsT = {
  email: string
}

type UpdatePasswordArgsT = {
  newPassword: string
}

type AuthResultT = {
  success: boolean
  error?: string
  user?: User
}

class AuthStore {
  authUser = $state<User | null>(null)
  userProfile = $state<UserT | null>(null)
  isLoading = $state(true)
  error = $state<string | null>(null)

  isAuthenticated = $derived(!!this.authUser)

  constructor() {
    if (browser) this.initialize()
  }

  loadUserProfile = async () => {
    // If there is no auth user,
    // clear the profile and return.
    if (!this.authUser) {
      this.userProfile = null
      return
    } const userId = this.authUser!.id
    const result = await getUserById(userId)

    if (result.error) {
      warnWhen(result.error, `Error loading user profile: ${result.error?.message}`)
      return
    }

    if (!result.user) return

    this.userProfile = {
      id: result.user.id,
      userName: result.user.userName,
      avatarUrl: result.user.avatarUrl,
      bio: result.user.bio,
      createdAt: result.user.createdAt,
      updatedAt: result.user.updatedAt || result.user.createdAt
    }

    console.log('Loaded user profile:', this.userProfile)
  }

  initialize = async () => {
    const supabase = createSupabaseClient()
    const userResponse = await supabase.auth.getUser()
    const initialUser = userResponse.data.user

    this.authUser = initialUser

    const hasInitialUser = !!initialUser
    if (hasInitialUser) await this.loadUserProfile()

    this.isLoading = false

    const handleAuthStateChange = async (event: string, session: any) => {
      const sessionUser = session?.user ?? null
      this.authUser = sessionUser
      const hasSessionUser = !!session?.user
      if (hasSessionUser) return await this.loadUserProfile()
      this.userProfile = null
    }

    supabase.auth.onAuthStateChange(handleAuthStateChange)
  }

  signUp = async (args: SignUpArgsT): Promise<AuthResultT> => {
    this.error = null
    const supabase = createSupabaseClient()

    const signUpResponse = await supabase.auth.signUp({
      email: args.email,
      password: args.password
    })

    const hasSignUpError = !!signUpResponse.error
    if (hasSignUpError) {
      const errorMessage = signUpResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    const signedUpUser = signUpResponse.data.user
    const hasNoUser = !signedUpUser
    if (hasNoUser) {
      const errorMessage = 'No user returned from signup'
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    const createProfileResult = await this.createUserProfile({
      userId: signedUpUser.id,
      userName: args.email,
      bio: ''
    })

    const hasProfileError = !createProfileResult.success
    if (hasProfileError) {
      const errorMessage = createProfileResult.error || 'Failed to create user profile'
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    this.authUser = signedUpUser
    await this.loadUserProfile()
    return { success: true, user: signedUpUser }
  }

  createUserProfile = async (args: CreateUserProfileArgsT): Promise<AuthResultT> => {
    const supabase = createSupabaseClient()

    const insertResponse = await supabase.from('all_users').insert({
      id: args.userId,
      userName: args.userName,
      bio: args.bio
    })

    const hasInsertError = !!insertResponse.error
    if (hasInsertError) {
      const errorMessage = insertResponse.error.message
      return { success: false, error: errorMessage }
    }

    return { success: true }
  }

  signIn = async (args: SignInArgsT): Promise<AuthResultT> => {
    this.error = null
    const supabase = createSupabaseClient()
    console.log('Supabase', supabase)

    const signInResponse = await supabase.auth.signInWithPassword({
      email: args.email,
      password: args.password
    })

    const hasSignInError = !!signInResponse.error
    if (hasSignInError) {
      const errorMessage = signInResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    const signedInUser = signInResponse.data.user
    this.authUser = signedInUser
    const hasSignedInUser = !!signedInUser
    if (hasSignedInUser) await this.loadUserProfile()
    return { success: true, user: signedInUser }
  }

  signOut = async (): Promise<AuthResultT> => {
    this.error = null
    const supabase = createSupabaseClient()

    const signOutResponse = await supabase.auth.signOut()

    const hasSignOutError = !!signOutResponse.error
    if (hasSignOutError) {
      const errorMessage = signOutResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    this.authUser = null
    this.userProfile = null
    return { success: true }
  }

  resetPassword = async (args: ResetPasswordArgsT): Promise<AuthResultT> => {
    this.error = null
    const supabase = createSupabaseClient()
    const resetUrl = `${window.location.origin}/auth/reset-password`

    const resetResponse = await supabase.auth.resetPasswordForEmail(args.email, {
      redirectTo: resetUrl
    })

    const hasResetError = !!resetResponse.error
    if (hasResetError) {
      const errorMessage = resetResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    return { success: true }
  }

  updatePassword = async (args: UpdatePasswordArgsT): Promise<AuthResultT> => {
    this.error = null
    const supabase = createSupabaseClient()

    const updateResponse = await supabase.auth.updateUser({
      password: args.newPassword
    })

    const hasUpdateError = !!updateResponse.error
    if (hasUpdateError) {
      const errorMessage = updateResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    return { success: true }
  }
}

export const authStore = new AuthStore()
