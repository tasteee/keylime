import { invalidateAll } from '$app/navigation'
import { callApi, clearSessionToken, saveSessionToken } from '$lib/modules/api'
import { goToPath } from '$lib/modules/navigate'
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
	const body = JSON.stringify({ email })
	const result = await callApi<{ devLink?: string }>('/api/auth/request-link', { method: 'POST', body })

	if (!result.error) return { success: true, devLink: result.data?.devLink }
	if (result.error.message === 'invalid-email') return { success: false, error: 'Enter a valid email address' }
	return { success: false, error: 'Could not send the link. Try again in a moment.' }
}

// Trades the one-time link token for a session and keeps it.
export const completeLogin = async (linkToken: string): Promise<AuthResultT> => {
	const body = JSON.stringify({ token: linkToken })
	const result = await callApi<{ sessionToken: string }>('/api/auth/verify', { method: 'POST', body })
	const sessionToken = result.data?.sessionToken
	if (!sessionToken) return { success: false, error: 'expired' }
	saveSessionToken(sessionToken)
	return { success: true }
}

export const logout = async (): Promise<AuthResultT> => {
	await callApi('/api/auth/signout', { method: 'POST' })
	clearSessionToken()
	await invalidateAll()
	await goToPath('/auth/login')
	return { success: true }
}

export const updateUserSettings = async (args: UpdateUserSettingsArgsT): Promise<AuthResultT> => {
	const result = await updateUserProfile(args)
	if (!result.didSucceed) return { success: false, error: result.error?.message || 'Failed to update settings' }
	await invalidateAll()
	return { success: true }
}
