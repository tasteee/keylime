import { callApi } from '$lib/modules/api'
import type { PageLoad } from './$types'

type UserProfileResponseT = { user: UserT; projects: ProjectT[] }

export const load: PageLoad = async (event) => {
	const encodedName = encodeURIComponent(event.params.userName)
	const result = await callApi<UserProfileResponseT>(`/api/users/${encodedName}`)
	if (!result.data) return { user: null, projects: [] as ProjectT[] }
	return { user: result.data.user, projects: result.data.projects }
}
