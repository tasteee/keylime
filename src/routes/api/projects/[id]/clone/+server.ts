import { json, type RequestHandler } from '@sveltejs/kit'
import { cloneProject } from '$lib/server/repo'

export const POST: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
	const project = await cloneProject(platform!.env.DB, locals.user.id, params.id!)
	if (!project) return json({ error: 'not-found' }, { status: 404 })
	return json({ data: project })
}
