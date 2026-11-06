import { getPublicProjects } from '$lib/modules/database'
import type { PageLoad } from './$types'

export const load: PageLoad = async () => {
	const result = await getPublicProjects({})
	return { projects: result.data ?? [] }
}
