// Server-side Convex client for SvelteKit `load` functions. Pass the request's
// Better Auth token (from `locals.token`) so authenticated queries see the user.
import { ConvexHttpClient } from 'convex/browser'
import { PUBLIC_CONVEX_URL } from '$env/static/public'

export const serverConvex = (token?: string) => {
	const client = new ConvexHttpClient(PUBLIC_CONVEX_URL)
	if (token) client.setAuth(token)
	return client
}
