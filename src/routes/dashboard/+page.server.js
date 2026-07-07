import { serverConvex } from '$lib/server/convex'
import { api } from '$convex/_generated/api'

export const load = async ({ locals }) => {
	if (!locals.token) {
		return { activeUser: null, projects: [] }
	}

	const convex = serverConvex(locals.token)
	const activeUser = await convex.query(api.users.getCurrentProfile, {}).catch(() => null)

	if (!activeUser) {
		return { activeUser: null, projects: [] }
	}

	const result = await convex
		.query(api.projects.getByUserId, { userId: activeUser.id, limit: 20, offset: 0 })
		.catch(() => ({ data: [] }))

	return {
		activeUser,
		projects: result.data ?? []
	}
}
