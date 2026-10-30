import { json, type RequestHandler } from '@sveltejs/kit'
import { listUsers } from '$lib/server/repo'

export const GET: RequestHandler = async ({ url, platform }) => {
	const params = url.searchParams
	const users = await listUsers(platform!.env.DB, {
		sortBy: (params.get('sortBy') as 'createdAt') ?? undefined,
		sortOrder: (params.get('sortOrder') as 'ascending') ?? undefined,
		searchQuery: params.get('searchQuery') ?? undefined
	})
	return json({ data: users })
}
