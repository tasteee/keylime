import { getUserByUserName, getProjectsByUserId } from '$lib/modules/database'

export const load = async (args) => {
	const userName = args.params.userName

	const userResult = await getUserByUserName(userName)

	if (userResult.error || !userResult.data) {
		return {
			user: null,
			projects: []
		}
	}

	const user = userResult.data
	const projectsResult = await getProjectsByUserId(user.id)

	const projects = projectsResult.data ?? []

	return {
		user,
		projects
	}
}
