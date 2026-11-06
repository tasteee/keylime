import { browser } from '$app/environment'

// Talking to the Keylime API (a Cloudflare Worker).
// The app and the API live on different sites, so sign-in is
// a bearer token kept in localStorage instead of a cookie.

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8787') as string
const SESSION_STORAGE_KEY = 'keylime_session'

export type ApiResultT<DataT> = { data: DataT | null; error: Error | null; status: number }

export const getSessionToken = (): string => {
	if (!browser) return ''
	return localStorage.getItem(SESSION_STORAGE_KEY) ?? ''
}

export const saveSessionToken = (sessionToken: string) => {
	localStorage.setItem(SESSION_STORAGE_KEY, sessionToken)
}

export const clearSessionToken = () => {
	localStorage.removeItem(SESSION_STORAGE_KEY)
}

const buildHeaders = (init: RequestInit): Record<string, string> => {
	const headers: Record<string, string> = {}
	const hasBody = init.body !== undefined
	if (hasBody) headers['content-type'] = 'application/json'
	const sessionToken = getSessionToken()
	if (sessionToken) headers.authorization = `Bearer ${sessionToken}`
	return headers
}

export const callApi = async <DataT = any>(path: string, init: RequestInit = {}): Promise<ApiResultT<DataT>> => {
	try {
		const response = await fetch(`${API_URL}${path}`, { ...init, headers: buildHeaders(init) })
		const payload = await response.json().catch(() => ({}))
		const errorMessage = payload.error ?? `Request failed (${response.status})`
		if (!response.ok) return { data: null, error: new Error(errorMessage), status: response.status }
		return { data: payload as DataT, error: null, status: response.status }
	} catch (error) {
		return { data: null, error: error as Error, status: 0 }
	}
}
