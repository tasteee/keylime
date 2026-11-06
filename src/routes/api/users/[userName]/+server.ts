import { json, type RequestHandler } from '@sveltejs/kit'
import { getUserByUserName, listPublicProjects } from '$lib/server/repo'

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform!.env.DB
	const user = await getUserByUserName(db, params.userName!)
	if (!user) return json({ error: 'not-found' }, { status: 404 })
	const projects = await listPublicProjects(db, { userName: user.userName, limit: 100 })
	return json({ user, projects: projects.data })
}
