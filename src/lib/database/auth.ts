import { supabase } from '$lib/supabase/client'
import { goto, invalidateAll } from '$app/navigation'
import { getUserById, checkUsernameAvailable, updateUserProfile } from '$lib/modules/database'
import { warnWhen } from '$lib/modules/warnWhen'

type LoginArgsT = {
  email: string
  password: string
}

type SignupArgsT = {
  email: string
  password: string
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
}

export const login = async (args: LoginArgsT): Promise<AuthResultT> => {
  const signInResponse = await supabase.auth.signInWithPassword({
    email: args.email,
    password: args.password
  })

  const hasSignInError = !!signInResponse.error
  if (hasSignInError) {
    const errorMessage = signInResponse.error.message
    return { success: false, error: errorMessage }
  }

  await invalidateAll()
  return { success: true }
}

export const logout = async (): Promise<AuthResultT> => {
  const signOutResponse = await supabase.auth.signOut()

  const hasSignOutError = !!signOutResponse.error
  if (hasSignOutError) {
    const errorMessage = signOutResponse.error!.message
    return { success: false, error: errorMessage }
  }

  await invalidateAll()
  goto('/auth/login')
  return { success: true }
}

export const signup = async (args: SignupArgsT): Promise<AuthResultT> => {
  const signUpResponse = await supabase.auth.signUp({
    email: args.email,
    password: args.password
  })

  const hasSignUpError = !!signUpResponse.error
  if (hasSignUpError) {
    const errorMessage = signUpResponse.error.message
    return { success: false, error: errorMessage }
  }

  const signedUpUser = signUpResponse.data.user
  const hasNoUser = !signedUpUser
  if (hasNoUser) {
    const errorMessage = 'No user returned from signup'
    return { success: false, error: errorMessage }
  }

  const generatedUsername = await generateUniqueUsername(args.email)
  const createProfileResult = await createUserProfile({
    userId: signedUpUser.id,
    userName: generatedUsername,
    bio: ''
  })

  const hasProfileError = !createProfileResult.success
  if (hasProfileError) {
    const errorMessage = createProfileResult.error || 'Failed to create user profile'
    return { success: false, error: errorMessage }
  }

  await invalidateAll()
  return { success: true }
}

export const resetPassword = async (email: string): Promise<AuthResultT> => {
  const resetUrl = `${window.location.origin}/auth/reset-password`

  const resetResponse = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: resetUrl
  })

  const hasResetError = !!resetResponse.error
  if (hasResetError) {
    const errorMessage = resetResponse.error.message
    return { success: false, error: errorMessage }
  }

  return { success: true }
}

export const updatePassword = async (newPassword: string): Promise<AuthResultT> => {
  const updateResponse = await supabase.auth.updateUser({
    password: newPassword
  })

  const hasUpdateError = !!updateResponse.error
  if (hasUpdateError) {
    const errorMessage = updateResponse.error.message
    return { success: false, error: errorMessage }
  }

  return { success: true }
}

export const updateUserSettings = async (args: UpdateUserSettingsArgsT): Promise<AuthResultT> => {
  const userResponse = await supabase.auth.getUser()
  const currentUser = userResponse.data.user

  const hasNoCurrentUser = !currentUser
  if (hasNoCurrentUser) {
    const errorMessage = 'No authenticated user'
    return { success: false, error: errorMessage }
  }

  const hasEmailUpdate = args.email && args.email !== currentUser.email
  if (hasEmailUpdate) {
    const updateEmailResponse = await supabase.auth.updateUser({
      email: args.email
    })

    const hasEmailError = !!updateEmailResponse.error
    if (hasEmailError) {
      const errorMessage = updateEmailResponse.error.message
      return { success: false, error: errorMessage }
    }
  }

  const hasPasswordUpdate = args.newPassword && args.newPassword.length > 0
  if (hasPasswordUpdate) {
    const updatePasswordResult = await updatePassword(args.newPassword!)

    const hasPasswordError = !updatePasswordResult.success
    if (hasPasswordError) {
      return updatePasswordResult
    }
  }

  const hasProfileUpdate = args.userName || args.bio !== undefined || args.avatarUrl !== undefined
  if (hasProfileUpdate) {
    const updateProfileResult = await updateUserProfile({
      userId: currentUser.id,
      userName: args.userName,
      bio: args.bio,
      avatarUrl: args.avatarUrl
    })

    const hasProfileError = !updateProfileResult.didSucceed
    if (hasProfileError) {
      const errorMessage = updateProfileResult.error?.message || 'Failed to update profile'
      return { success: false, error: errorMessage }
    }
  }

  await invalidateAll()
  return { success: true }
}

const generateUniqueUsername = async (email: string): Promise<string> => {
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

const createUserProfile = async (args: { userId: string; userName: string; bio: string }): Promise<AuthResultT> => {
  const insertResponse = await supabase.from('all_users').insert([{
    id: args.userId,
    userName: args.userName,
    bio: args.bio
  }] as any)

  const hasInsertError = !!insertResponse.error
  if (hasInsertError) {
    const errorMessage = insertResponse.error.message
    return { success: false, error: errorMessage }
  }

  return { success: true }
}
