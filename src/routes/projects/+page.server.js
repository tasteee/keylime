import { serverConvex } from '$lib/server/convex'
import { api } from '$convex/_generated/api'

export async function load({ locals }) {
	const result = await serverConvex(locals.token)
		.query(api.projects.getPublic, {})
		.catch(() => ({ data: [] }))

	return {
		projects: result.data ?? []
	}
}
