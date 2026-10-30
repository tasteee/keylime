import { redirect, type RequestHandler } from '@sveltejs/kit'
import { completeLogin } from '$lib/server/auth'

export const GET: RequestHandler = async ({ url, cookies, platform }) => {
	const token = url.searchParams.get('token') ?? ''
	const didLogin = await completeLogin(platform!.env, url, cookies, token)
	if (!didLogin) redirect(303, '/auth/login?expired=1')
	redirect(303, '/dashboard')
}
