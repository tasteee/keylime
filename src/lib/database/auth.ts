import { goto, invalidateAll } from '$app/navigation'
import { authClient } from '$lib/auth-client'
import { convexMutation } from '$lib/convex'
import { api } from '$convex/_generated/api'
import { updateUserProfile } from '$lib/modules/database'

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

const errorMessageOf = (error: unknown): string => {
	if (!error) return 'Something went wrong'
	if (typeof error === 'string') return error
	if (typeof error === 'object' && 'message' in error) return String((error as { message: unknown }).message)
	return String(error)
}

export const login = async (args: LoginArgsT): Promise<AuthResultT> => {
	const { error } = await authClient.signIn.email({
		email: args.email,
		password: args.password
	})

	if (error) return { success: false, error: errorMessageOf(error) }

	await invalidateAll()
	return { success: true }
}

export const logout = async (): Promise<AuthResultT> => {
	const { error } = await authClient.signOut()

	if (error) return { success: false, error: errorMessageOf(error) }

	await invalidateAll()
	goto('/auth/login')
	return { success: true }
}

export const signup = async (args: SignupArgsT): Promise<AuthResultT> => {
	const { error } = await authClient.signUp.email({
		email: args.email,
		password: args.password,
		name: args.email.split('@')[0]
	})

	if (error) return { success: false, error: errorMessageOf(error) }

	// Create the app profile row (replaces the old Postgres handle_new_user trigger).
	try {
		await convexMutation(api.users.ensureProfile, {})
	} catch (profileError) {
		return { success: false, error: errorMessageOf(profileError) }
	}

	await invalidateAll()
	return { success: true }
}

export const resetPassword = async (email: string): Promise<AuthResultT> => {
	// Sends a reset link. Requires an email provider configured on the Convex
	// deployment (see CONVEX_MIGRATION.md, stage 3) — until then this is a no-op.
	const redirectTo = `${window.location.origin}/auth/reset-password`
	const { error } = await authClient.requestPasswordReset({ email, redirectTo })

	if (error) return { success: false, error: errorMessageOf(error) }
	return { success: true }
}

export const updatePassword = async (newPassword: string, currentPassword?: string): Promise<AuthResultT> => {
	// Better Auth requires the current password to change it while signed in.
	if (!currentPassword) {
		return {
			success: false,
			error: 'To change your password, use the "Forgot password?" reset flow.'
		}
	}

	const { error } = await authClient.changePassword({ newPassword, currentPassword })
	if (error) return { success: false, error: errorMessageOf(error) }
	return { success: true }
}

export const updateUserSettings = async (args: UpdateUserSettingsArgsT): Promise<AuthResultT> => {
	const sessionResult = await authClient.getSession()
	const currentUser = sessionResult.data?.user

	if (!currentUser) return { success: false, error: 'No authenticated user' }

	const hasEmailUpdate = args.email && args.email !== currentUser.email
	if (hasEmailUpdate) {
		const { error } = await authClient.changeEmail({ newEmail: args.email! })
		if (error) return { success: false, error: errorMessageOf(error) }
	}

	const hasPasswordUpdate = args.newPassword && args.newPassword.length > 0
	if (hasPasswordUpdate) {
		const passwordResult = await updatePassword(args.newPassword!)
		if (!passwordResult.success) return passwordResult
	}

	const hasProfileUpdate = args.userName || args.bio !== undefined || args.avatarUrl !== undefined
	if (hasProfileUpdate) {
		const profileResult = await updateUserProfile({
			userId: currentUser.id,
			userName: args.userName,
			bio: args.bio,
			avatarUrl: args.avatarUrl
		})

		if (!profileResult.didSucceed) {
			return { success: false, error: profileResult.error?.message || 'Failed to update profile' }
		}
	}

	await invalidateAll()
	return { success: true }
}
