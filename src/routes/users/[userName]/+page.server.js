import { getUserByUserName, listPublicProjects } from '$lib/server/repo'

export const load = async ({ params, platform }) => {
	const db = platform.env.DB
	const user = await getUserByUserName(db, params.userName)
	if (!user) return { user: null, projects: [] }

	const { data } = await listPublicProjects(db, { userName: user.userName, limit: 100 })
	return { user, projects: data }
}
