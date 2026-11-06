import { redirect } from '@sveltejs/kit'
import { base } from '$app/paths'
import { callApi, getSessionToken } from '$lib/modules/api'
import type { LayoutLoad } from './$types'

// The app is a client-only SPA. There is no server rendering.
export const ssr = false
export const prerender = false

type MeResponseT = { authUser: { id: string; email: string } | null; activeUser: UserT | null }

const loadCurrentUser = async (): Promise<MeResponseT> => {
	const signedOut: MeResponseT = { authUser: null, activeUser: null }
	const hasSession = Boolean(getSessionToken())
	if (!hasSession) return signedOut
	const result = await callApi<MeResponseT>('/api/me')
	return result.data ?? signedOut
}

export const load: LayoutLoad = async (event) => {
	event.depends('app:user')
	const me = await loadCurrentUser()
	const isAuthenticated = Boolean(me.authUser)

	const appPath = event.url.pathname.slice(base.length) || '/'
	const isAuthRoute = appPath.startsWith('/auth')
	const isRootRoute = appPath === '/'
	const isProtectedRoute = ['/dashboard', '/users', '/projects', '/project/'].some((prefix) => appPath.startsWith(prefix))

	const shouldGoToDashboard = isAuthenticated && (isAuthRoute || isRootRoute)
	if (shouldGoToDashboard) redirect(303, `${base}/dashboard`)

	const shouldGoToLogin = !isAuthenticated && (isRootRoute || isProtectedRoute)
	if (shouldGoToLogin) redirect(303, `${base}/auth/login`)

	return { isAuthenticated, authUser: me.authUser, activeUser: me.activeUser }
}
