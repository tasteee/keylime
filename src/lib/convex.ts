// Browser-side Convex client for imperative query/mutation calls (the app has no
// realtime needs, so the HTTP client is enough and avoids any SSR/WebSocket setup).
// Auth is sourced from Better Auth on each call.
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'
import { authClient } from '$lib/auth-client'

const client = new ConvexHttpClient(PUBLIC_CONVEX_URL)

// Fetch the Convex-compatible JWT from Better Auth. The `convexClient()` plugin
// (see src/lib/auth-client.ts) exposes this. If the exact accessor differs in the
// installed version, this is the single spot to adjust.
const getConvexToken = async (): Promise<string | null> => {
	try {
		const result: any = await (authClient as any).convex.token()
		return result?.data?.token ?? null
	} catch {
		return null
	}
}

const applyAuth = async () => {
	const token = await getConvexToken()
	if (token) client.setAuth(token)
	else client.clearAuth()
}

export const convexQuery = async <T = any>(reference: any, args: Record<string, unknown> = {}): Promise<T> => {
	await applyAuth()
	return client.query(reference, args)
}

export const convexMutation = async <T = any>(reference: any, args: Record<string, unknown> = {}): Promise<T> => {
	await applyAuth()
	return client.mutation(reference, args)
}
