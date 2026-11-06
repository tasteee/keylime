import { getProjectsByUserId } from '$lib/modules/database'
import type { PageLoad } from './$types'

export const load: PageLoad = async (event) => {
	const parentData = await event.parent()
	if (!parentData.authUser) return { projects: [] as ProjectT[] }
	const result = await getProjectsByUserId(parentData.authUser.id, 20, 0)
	return { projects: result.data ?? [] }
}
