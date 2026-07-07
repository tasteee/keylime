import { serverConvex } from '$lib/server/convex'
import { api } from '$convex/_generated/api'

export const load = async (args) => {
	const userName = args.params.userName
	const convex = serverConvex(args.locals.token)

	const user = await convex.query(api.users.getByUserName, { userName }).catch(() => null)

	if (!user) {
		return { user: null, projects: [] }
	}

	const result = await convex.query(api.projects.getByUserId, { userId: user.id }).catch(() => ({ data: [] }))

	return {
		user,
		projects: result.data ?? []
	}
}
