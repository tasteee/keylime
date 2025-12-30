import { getPublicProjects } from '$lib/modules/database'

export async function load() {
	const { data } = await getPublicProjects({})

	return {
		projects: data ?? []
	}
}
