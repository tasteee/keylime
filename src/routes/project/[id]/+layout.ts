import { error } from '@sveltejs/kit'
import { getProjectById } from '$lib/modules/database'
import type { LayoutLoad } from './$types'

export const load: LayoutLoad = async (event) => {
	const result = await getProjectById(event.params.id)
	if (!result.data) error(404, { message: 'Project not found' })
	return { project: result.data }
}
