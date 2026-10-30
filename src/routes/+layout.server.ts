import type { LayoutServerLoad } from './$types'
import { getUserById } from '$lib/server/repo'

export const load: LayoutServerLoad = async (event) => {
	const authUser = event.locals.user
	const isAuthenticated = !!authUser
	const database = event.platform?.env.DB
	const activeUser = authUser && database ? await getUserById(database, authUser.id) : null
	return { isAuthenticated, authUser, activeUser }
}
