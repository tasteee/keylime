import { getUserById, listProjectsByUser } from '$lib/server/repo'

export const load = async (event) => {
	const authUser = event.locals.user
	if (!authUser) return { activeUser: null, projects: [] }

	const db = event.platform.env.DB
	const activeUser = await getUserById(db, authUser.id)
	const { data } = await listProjectsByUser(db, authUser.id, { limit: 20 })
	return { activeUser, projects: data }
}
