import { completeLogin, endSession, getSessionUser, requestLoginLink, type EnvT, type SessionUserT } from './auth'
import {
	cloneProject,
	deleteProject,
	getProjectById,
	getUserById,
	getUserByUserName,
	listProjectsByUser,
	listPublicProjects,
	listUsers,
	saveProject,
	updateUserProfile
} from './repo'

// The Keylime API. Runs on Cloudflare Workers and talks to D1.
// The app is a static site on another origin, so every response
// carries CORS headers and sign-in is a bearer token.

type ContextT = {
	request: Request
	url: URL
	env: EnvT
	params: Record<string, string>
	user: SessionUserT | null
	sessionToken: string
}

type HandlerT = (context: ContextT) => Promise<Response>

type RouteT = { method: string; pattern: URLPattern; handler: HandlerT }

const jsonResponse = (body: unknown, status = 200): Response => {
	return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

const unauthorized = (): Response => jsonResponse({ error: 'unauthorized' }, 401)

const readBody = async <BodyT>(request: Request): Promise<BodyT | null> => {
	const body = await request.json().catch(() => null)
	return body as BodyT | null
}

const readNumber = (value: string | null): number | undefined => {
	if (value === null || value === '') return undefined
	const number = Number(value)
	return Number.isFinite(number) ? number : undefined
}

// ---------- auth ----------

const handleRequestLink: HandlerT = async (context) => {
	const input = await readBody<{ email?: string }>(context.request)
	const result = await requestLoginLink(context.env, input?.email ?? '')
	if (result.status === 'invalid-email') return jsonResponse({ error: 'invalid-email' }, 400)
	if (result.status === 'email-unavailable') return jsonResponse({ error: 'email-unavailable' }, 503)
	return jsonResponse({ sent: true, devLink: result.devLink })
}

const handleVerify: HandlerT = async (context) => {
	const input = await readBody<{ token?: string }>(context.request)
	const sessionToken = await completeLogin(context.env, input?.token ?? '')
	if (!sessionToken) return jsonResponse({ error: 'expired' }, 400)
	return jsonResponse({ sessionToken })
}

const handleSignOut: HandlerT = async (context) => {
	if (context.sessionToken) await endSession(context.env, context.sessionToken)
	return new Response(null, { status: 204 })
}

// ---------- me ----------

const handleGetMe: HandlerT = async (context) => {
	if (!context.user) return jsonResponse({ authUser: null, activeUser: null })
	const activeUser = await getUserById(context.env.DB, context.user.id)
	return jsonResponse({ authUser: context.user, activeUser })
}

const handlePatchMe: HandlerT = async (context) => {
	if (!context.user) return unauthorized()
	const input = (await readBody<{ userName?: string; bio?: string; avatarUrl?: string }>(context.request)) ?? {}
	const result = await updateUserProfile(context.env.DB, context.user.id, input)
	if (result.error === 'username-taken') return jsonResponse({ error: 'That username is taken' }, 409)
	if (result.error) return jsonResponse({ error: 'Usernames are 2-32 letters, numbers, - or _' }, 400)
	return jsonResponse({ user: await getUserById(context.env.DB, context.user.id) })
}

// ---------- users ----------

const handleListUsers: HandlerT = async (context) => {
	const params = context.url.searchParams
	const users = await listUsers(context.env.DB, {
		sortBy: (params.get('sortBy') as 'createdAt') ?? undefined,
		sortOrder: (params.get('sortOrder') as 'ascending') ?? undefined,
		searchQuery: params.get('searchQuery') ?? undefined
	})
	return jsonResponse({ data: users })
}

const handleGetUser: HandlerT = async (context) => {
	const user = await getUserByUserName(context.env.DB, context.params.userName)
	if (!user) return jsonResponse({ error: 'not-found' }, 404)
	const projects = await listPublicProjects(context.env.DB, { userName: user.userName, limit: 100 })
	return jsonResponse({ user, projects: projects.data })
}

// ---------- projects ----------

// ?mine=1 lists the signed-in user's projects. Otherwise public ones.
const handleListProjects: HandlerT = async (context) => {
	const params = context.url.searchParams
	const page = { limit: readNumber(params.get('limit')), offset: readNumber(params.get('offset')) }

	const wantsOwnProjects = params.get('mine') === '1'
	if (wantsOwnProjects && !context.user) return unauthorized()
	if (wantsOwnProjects && context.user) return jsonResponse(await listProjectsByUser(context.env.DB, context.user.id, page))

	const symbols = params.get('chordSymbols')
	const result = await listPublicProjects(context.env.DB, {
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
	return jsonResponse(result)
}

const respondToSave = (result: Awaited<ReturnType<typeof saveProject>>): Response => {
	if (result.error === 'forbidden') return jsonResponse({ error: 'forbidden' }, 403)
	if (result.error) return jsonResponse({ error: result.error }, 400)
	return jsonResponse({ data: result.project })
}

const handleCreateProject: HandlerT = async (context) => {
	if (!context.user) return unauthorized()
	const input = await readBody<Partial<ProjectT>>(context.request)
	if (!input) return jsonResponse({ error: 'invalid' }, 400)
	return respondToSave(await saveProject(context.env.DB, context.user.id, input))
}

const handleGetProject: HandlerT = async (context) => {
	const viewerId = context.user?.id ?? null
	const project = await getProjectById(context.env.DB, context.params.id, viewerId)
	if (!project) return jsonResponse({ error: 'not-found' }, 404)
	return jsonResponse({ data: project })
}

const handleSaveProject: HandlerT = async (context) => {
	if (!context.user) return unauthorized()
	const input = await readBody<Partial<ProjectT>>(context.request)
	if (!input) return jsonResponse({ error: 'invalid' }, 400)
	return respondToSave(await saveProject(context.env.DB, context.user.id, { ...input, id: context.params.id }))
}

const handleDeleteProject: HandlerT = async (context) => {
	if (!context.user) return unauthorized()
	const didDelete = await deleteProject(context.env.DB, context.user.id, context.params.id)
	if (!didDelete) return jsonResponse({ error: 'not-found' }, 404)
	return jsonResponse({ ok: true })
}

const handleCloneProject: HandlerT = async (context) => {
	if (!context.user) return unauthorized()
	const project = await cloneProject(context.env.DB, context.user.id, context.params.id)
	if (!project) return jsonResponse({ error: 'not-found' }, 404)
	return jsonResponse({ data: project })
}

// ---------- routing ----------

const buildRoute = (method: string, path: string, handler: HandlerT): RouteT => {
	return { method, pattern: new URLPattern({ pathname: path }), handler }
}

const routes: RouteT[] = [
	buildRoute('POST', '/api/auth/request-link', handleRequestLink),
	buildRoute('POST', '/api/auth/verify', handleVerify),
	buildRoute('POST', '/api/auth/signout', handleSignOut),
	buildRoute('GET', '/api/me', handleGetMe),
	buildRoute('PATCH', '/api/me', handlePatchMe),
	buildRoute('GET', '/api/users', handleListUsers),
	buildRoute('GET', '/api/users/:userName', handleGetUser),
	buildRoute('GET', '/api/projects', handleListProjects),
	buildRoute('POST', '/api/projects', handleCreateProject),
	buildRoute('GET', '/api/projects/:id', handleGetProject),
	buildRoute('PUT', '/api/projects/:id', handleSaveProject),
	buildRoute('DELETE', '/api/projects/:id', handleDeleteProject),
	buildRoute('POST', '/api/projects/:id/clone', handleCloneProject)
]

const readSessionToken = (request: Request): string => {
	const header = request.headers.get('authorization') ?? ''
	const hasBearer = header.startsWith('Bearer ')
	return hasBearer ? header.slice('Bearer '.length) : ''
}

const buildCorsHeaders = (request: Request, env: EnvT): Record<string, string> => {
	const requestOrigin = request.headers.get('origin') ?? ''
	const allowedOrigins = env.APP_ORIGIN.split(',').map((origin) => origin.trim())
	const isAllowed = allowedOrigins.includes(requestOrigin)
	if (!isAllowed) return {}
	return {
		'access-control-allow-origin': requestOrigin,
		'access-control-allow-methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
		'access-control-allow-headers': 'authorization, content-type',
		'access-control-max-age': '86400',
		vary: 'origin'
	}
}

const routeRequest = async (request: Request, env: EnvT): Promise<Response> => {
	const url = new URL(request.url)
	const sessionToken = readSessionToken(request)
	const user = await getSessionUser(env.DB, sessionToken)

	for (const route of routes) {
		const isMethodMatch = route.method === request.method
		const match = route.pattern.exec(url)
		if (!isMethodMatch || !match) continue
		const params = match.pathname.groups as Record<string, string>
		return route.handler({ request, url, env, params, user, sessionToken })
	}

	return jsonResponse({ error: 'not-found' }, 404)
}

export default {
	async fetch(request: Request, env: EnvT): Promise<Response> {
		const corsHeaders = buildCorsHeaders(request, env)
		const isPreflight = request.method === 'OPTIONS'
		if (isPreflight) return new Response(null, { status: 204, headers: corsHeaders })

		const response = await routeRequest(request, env)
		const finalResponse = new Response(response.body, response)
		for (const [name, value] of Object.entries(corsHeaders)) finalResponse.headers.set(name, value)
		return finalResponse
	}
}
