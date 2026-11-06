import { goto, invalidateAll } from '$app/navigation'
import { updateUserProfile } from '$lib/modules/database'

type AuthResultT = {
	success: boolean
	error?: string
	devLink?: string
}

type UpdateUserSettingsArgsT = {
	userName?: string
	bio?: string
	avatarUrl?: string
}

// Sends a one-time sign-in link. First sign-in creates the account.
export const requestLoginLink = async (email: string): Promise<AuthResultT> => {
	const response = await fetch('/api/auth/request-link', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ email })
	})
	const payload = await response.json().catch(() => ({}))

	if (response.ok) return { success: true, devLink: payload.devLink }
	if (payload.error === 'invalid-email') return { success: false, error: 'Enter a valid email address' }
	return { success: false, error: 'Could not send the link. Try again in a moment.' }
}

export const logout = async (): Promise<AuthResultT> => {
	await fetch('/api/auth/signout', { method: 'POST' })
	await invalidateAll()
	goto('/auth/login')
	return { success: true }
}

export const updateUserSettings = async (args: UpdateUserSettingsArgsT): Promise<AuthResultT> => {
	const result = await updateUserProfile(args)
	if (!result.didSucceed) return { success: false, error: result.error?.message || 'Failed to update settings' }
	await invalidateAll()
	return { success: true }
}
