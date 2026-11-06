import { json, type RequestHandler } from '@sveltejs/kit'
import { deleteProject, getProjectById, saveProject } from '$lib/server/repo'

export const GET: RequestHandler = async ({ params, locals, platform }) => {
	const project = await getProjectById(platform!.env.DB, params.id!, locals.user?.id ?? null)
	if (!project) return json({ error: 'not-found' }, { status: 404 })
	return json({ data: project })
}

export const PUT: RequestHandler = async ({ params, request, locals, platform }) => {
	if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
	const input = await request.json().catch(() => null)
	if (!input) return json({ error: 'invalid' }, { status: 400 })
	const result = await saveProject(platform!.env.DB, locals.user.id, { ...input, id: params.id })
	if (result.error === 'forbidden') return json({ error: 'forbidden' }, { status: 403 })
	if (result.error) return json({ error: result.error }, { status: 400 })
	return json({ data: result.project })
}

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
	const didDelete = await deleteProject(platform!.env.DB, locals.user.id, params.id!)
	if (!didDelete) return json({ error: 'not-found' }, { status: 404 })
	return json({ ok: true })
}
