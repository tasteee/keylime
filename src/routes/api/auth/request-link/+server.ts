import { json, type RequestHandler } from '@sveltejs/kit'
import { requestLoginLink } from '$lib/server/auth'

export const POST: RequestHandler = async ({ request, url, platform }) => {
	const env = platform!.env
	const input = (await request.json().catch(() => ({}))) as { email?: string }
	const result = await requestLoginLink(env, url.origin, input.email ?? '')

	if (result.status === 'invalid-email') return json({ error: 'invalid-email' }, { status: 400 })
	if (result.status === 'email-unavailable') return json({ error: 'email-unavailable' }, { status: 503 })
	return json({ sent: true, devLink: result.devLink })
}
