import type { RequestHandler } from '@sveltejs/kit'
import { endSession } from '$lib/server/auth'

export const POST: RequestHandler = async ({ url, cookies, platform }) => {
	await endSession(platform!.env, url, cookies)
	return new Response(null, { status: 204 })
}
