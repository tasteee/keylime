import { json, type RequestHandler } from '@sveltejs/kit'
import { updateUserProfile, getUserById } from '$lib/server/repo'

export const PATCH: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
	const db = platform!.env.DB
	const input = (await request.json().catch(() => ({}))) as { userName?: string; bio?: string; avatarUrl?: string }
	const result = await updateUserProfile(db, locals.user.id, input)
	if (result.error === 'username-taken') return json({ error: 'That username is taken' }, { status: 409 })
	if (result.error) return json({ error: 'Usernames are 2-32 letters, numbers, - or _' }, { status: 400 })
	return json({ user: await getUserById(db, locals.user.id) })
}
