import { listPublicProjects } from '$lib/server/repo'

export async function load({ platform }) {
	const { data } = await listPublicProjects(platform.env.DB, {})
	return { projects: data }
}
