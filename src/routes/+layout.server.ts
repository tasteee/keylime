import type { LayoutServerLoad } from './$types'
import { serverConvex } from '$lib/server/convex'
import { api } from '$convex/_generated/api'

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.token) {
		return { isAuthenticated: false, authUser: null, activeUser: null }
	}

	const convex = serverConvex(locals.token)
	const authUser = await convex.query(api.auth.getCurrentUser, {}).catch(() => null)
	const activeUser = (await convex.query(api.users.getCurrentProfile, {}).catch(() => null)) as UserT | null

	return { isAuthenticated: !!authUser, authUser, activeUser }
}
