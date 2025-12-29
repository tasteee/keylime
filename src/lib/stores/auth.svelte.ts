import { browser } from '$app/environment'
import { goto, invalidateAll } from '$app/navigation'
import { getUserById, updateUserProfile, checkUsernameAvailable } from '$lib/modules/database'
import { asCleanAsync, cleanAsync } from '$lib/modules/promises'
import { warnWhen } from '$lib/modules/warnWhen'
import type { User } from '@supabase/supabase-js'
import { supabase } from "$lib/supabase/client"

type AuthOptionsT = {
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

type UpdateUserSettingsArgsT = {
  userName?: string
  email?: string
  bio?: string
  avatarUrl?: string
  newPassword?: string
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
    console.log('loadUserProfile called', JSON.stringify(this.authUser))
    if (!this.authUser) {
      console.log('No auth user, clearing user profile and returning...')
      this.userProfile = null
      return
    }

    const userId = this.authUser!.id
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
    console.log('[auth.store] Initializing auth store')

    const userResponse = await supabase.auth.getUser()
    const initialUser = userResponse.data.user

    console.log('[auth.store] Initial user:', { userId: initialUser?.id, email: initialUser?.email })
    this.authUser = initialUser

    const hasInitialUser = !!initialUser
    if (hasInitialUser) await this.loadUserProfile()

    this.isLoading = false
    console.log('[auth.store] Auth store initialized, isLoading=false')

    supabase.auth.onAuthStateChange(this.handleAuthStateChange)
  }

  handleAuthStateChange = async (event: string, session: any) => {
    console.log('[auth.store] Auth state changed:', { event, userId: session?.user?.id })

    if (event === 'SIGNED_OUT') {
      console.log('[auth.store] Handling SIGNED_OUT event')
      await invalidateAll()
      goto('/auth/login')
      return
    }


    const userResponse = await supabase.auth.getUser()
    const authenticatedUser = userResponse.data.user
    console.log('[auth.store] Updated auth user:', { userId: authenticatedUser?.id, email: authenticatedUser?.email })
    this.authUser = authenticatedUser
    const hasAuthenticatedUser = !!authenticatedUser
    if (hasAuthenticatedUser) return await this.loadUserProfile()
    console.log('[auth.store] Clearing user profile (no authenticated user)')
    this.userProfile = null
  }

  signUp = async (args: AuthOptionsT): Promise<AuthResultT> => {
    console.log('[auth.store] signUp called for:', args.email)
    this.error = null


    const signUpResponse = await supabase.auth.signUp({
      email: args.email,
      password: args.password
    })

    console.log('[auth.store] signUp response:', {
      hasError: !!signUpResponse.error,
      userId: signUpResponse.data.user?.id,
      email: signUpResponse.data.user?.email
    })

    const hasSignUpError = !!signUpResponse.error
    if (hasSignUpError) {
      const errorMessage = signUpResponse.error.message
      console.log('[auth.store] signUp error:', errorMessage)
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    const signedUpUser = signUpResponse.data.user
    const hasNoUser = !signedUpUser
    if (hasNoUser) {
      const errorMessage = 'No user returned from signup'
      console.log('[auth.store] signUp error:', errorMessage)
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    console.log('[auth.store] Generating username for:', args.email)
    const generatedUsername = await this.generateUniqueUsername(args.email)
    console.log('[auth.store] Generated username:', generatedUsername)

    console.log('[auth.store] Creating user profile for userId:', signedUpUser.id)
    const createProfileResult = await this.createUserProfile({
      userId: signedUpUser.id,
      userName: generatedUsername,
      bio: ''
    })

    const hasProfileError = !createProfileResult.success
    if (hasProfileError) {
      const errorMessage = createProfileResult.error || 'Failed to create user profile'
      console.log('[auth.store] Profile creation error:', errorMessage)
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    console.log('[auth.store] Setting authUser and loading profile')
    this.authUser = signedUpUser
    await this.loadUserProfile()
    console.log('[auth.store] signUp complete, returning success')
    return { success: true, user: signedUpUser }
  }

  generateUniqueUsername = async (email: string): Promise<string> => {
    const baseUsername = email.split('@')[0]
    const isBaseAvailable = await checkUsernameAvailable(baseUsername)
    if (isBaseAvailable) return baseUsername

    const maxAttempts = 100
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const randomDigits = Math.floor(1000 + Math.random() * 9000)
      const candidateUsername = `${baseUsername}${randomDigits}`
      const isCandidateAvailable = await checkUsernameAvailable(candidateUsername)
      if (isCandidateAvailable) return candidateUsername
    }

    const fallbackUsername = `${baseUsername}${Date.now()}`
    return fallbackUsername
  }

  createUserProfile = async (args: CreateUserProfileArgsT): Promise<AuthResultT> => {


    const insertResponse = await supabase.from('all_users').insert([{
      id: args.userId,
      userName: args.userName,
      bio: args.bio
    }] as any) // TODO: FIX this type

    const hasInsertError = !!insertResponse.error
    if (hasInsertError) {
      const errorMessage = insertResponse.error.message
      return { success: false, error: errorMessage }
    }

    return { success: true }
  }

  signIn = async (args: AuthOptionsT): Promise<AuthResultT> => {
    console.log('[auth.store] signIn called for:', args.email)
    console.log('[auth.store] Current authUser before signIn:', { userId: this.authUser?.id })
    this.error = null

    console.log('[auth.store] Cookies before signIn:', document.cookie)

    const signInResponse = await supabase.auth.signInWithPassword({
      email: args.email,
      password: args.password
    })

    console.log('[auth.store] signIn response:', {
      hasError: !!signInResponse.error,
      userId: signInResponse.data.user?.id,
      email: signInResponse.data.user?.email,
      hasSession: !!signInResponse.data.session
    })
    console.log('[auth.store] Cookies after signIn:', document.cookie)

    const hasSignInError = !!signInResponse.error

    if (hasSignInError) {
      console.error('[auth.store] Sign-in error:', signInResponse.error.message)
      const errorMessage = signInResponse.error.message
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }

    const signedInUser = signInResponse.data.user
    console.log('[auth.store] Setting authUser to:', { userId: signedInUser?.id })
    this.authUser = signedInUser
    const hasSignedInUser = !!signedInUser
    if (hasSignedInUser) {
      console.log('[auth.store] Loading user profile')
      await this.loadUserProfile()
    }
    console.log('[auth.store] signIn complete, returning success')
    return { success: true, user: signedInUser }
  }


  signOut = cleanAsync(async () => {
    this.error = null

    console.log('[auth.store] signOut')
    console.log('[auth.store] Cookies before signOut:', document.cookie)
    const signOutResponse = await supabase.auth.signOut()
    console.log('[auth.store] Sign out response:', { error: signOutResponse.error })
    console.log('[auth.store] Cookies after signOut:', document.cookie)

    if (signOutResponse.error) {
      const errorMessage = signOutResponse.error.message
      console.log('[auth.store] Sign out error:', errorMessage)
      throw new Error(errorMessage)
    }

    await invalidateAll()
    goto('/auth/login')
    return { didSucceed: true }

  })

  resetPassword = async (args: ResetPasswordArgsT): Promise<AuthResultT> => {
    this.error = null

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

  updateUserSettings = async (args: UpdateUserSettingsArgsT): Promise<AuthResultT> => {
    this.error = null

    const hasNoAuthUser = !this.authUser
    if (hasNoAuthUser) {
      const errorMessage = 'No authenticated user'
      this.error = errorMessage
      return { success: false, error: errorMessage }
    }



    const hasEmailUpdate = args.email && args.email !== this.authUser?.email
    if (hasEmailUpdate) {
      const updateEmailResponse = await supabase.auth.updateUser({
        email: args.email
      })

      const hasEmailError = !!updateEmailResponse.error
      if (hasEmailError) {
        const errorMessage = updateEmailResponse.error.message
        this.error = errorMessage
        return { success: false, error: errorMessage }
      }
    }

    const hasPasswordUpdate = args.newPassword && args.newPassword.length > 0
    if (hasPasswordUpdate) {
      const updatePasswordResult = await this.updatePassword({
        newPassword: args.newPassword!
      })

      const hasPasswordError = !updatePasswordResult.success
      if (hasPasswordError) {
        return updatePasswordResult
      }
    }

    const hasProfileUpdate = args.userName || args.bio !== undefined || args.avatarUrl !== undefined
    if (hasProfileUpdate) {
      const updateProfileResult = await updateUserProfile({
        userId: this.authUser!.id,
        userName: args.userName,
        bio: args.bio,
        avatarUrl: args.avatarUrl
      })

      const hasProfileError = !updateProfileResult.didSucceed
      if (hasProfileError) {
        const errorMessage = updateProfileResult.error?.message || 'Failed to update profile'
        this.error = errorMessage
        return { success: false, error: errorMessage }
      }
    }

    await this.loadUserProfile()

    return { success: true }
  }
}

export const authStore = new AuthStore()
