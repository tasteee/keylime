import { json, type RequestHandler } from '@sveltejs/kit'
import { listProjectsByUser, listPublicProjects, saveProject } from '$lib/server/repo'

const readNumber = (value: string | null): number | undefined => {
	if (value === null || value === '') return undefined
	const number = Number(value)
	return Number.isFinite(number) ? number : undefined
}

// ?mine=1 lists the signed-in user's projects. Otherwise public ones.
export const GET: RequestHandler = async ({ url, locals, platform }) => {
	const db = platform!.env.DB
	const params = url.searchParams
	const page = { limit: readNumber(params.get('limit')), offset: readNumber(params.get('offset')) }

	if (params.get('mine') === '1') {
		if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
		return json(await listProjectsByUser(db, locals.user.id, page))
	}

	const symbols = params.get('chordSymbols')
	const result = await listPublicProjects(db, {
		...page,
		sortBy: (params.get('sortBy') as 'updatedAt') ?? undefined,
		sortOrder: (params.get('sortOrder') as 'ascending') ?? undefined,
		key: params.get('key') ?? undefined,
		scale: params.get('scale') ?? undefined,
		minBpm: readNumber(params.get('minBpm')),
		maxBpm: readNumber(params.get('maxBpm')),
		searchQuery: params.get('searchQuery') ?? undefined,
		chordSymbols: symbols ? symbols.split(',') : undefined,
		chordMatchMode: params.get('chordMatchMode') === 'all' ? 'all' : 'any'
	})
	return json(result)
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 })
	const input = await request.json().catch(() => null)
	if (!input) return json({ error: 'invalid' }, { status: 400 })
	const result = await saveProject(platform!.env.DB, locals.user.id, input)
	if (result.error === 'forbidden') return json({ error: 'forbidden' }, { status: 403 })
	if (result.error) return json({ error: result.error }, { status: 400 })
	return json({ data: result.project })
}
