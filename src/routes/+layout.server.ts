import { redirect } from '@sveltejs/kit'
import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  const session = event.locals.session
  const user = event.locals.user
  const isAuthenticated = !!session && !!user
  const currentPath = event.url.pathname

  const isAuthRoute = currentPath.startsWith('/auth')
  const isRootRoute = currentPath === '/'
  const isDashboardRoute = currentPath.startsWith('/dashboard')
  const isUsersRoute = currentPath.startsWith('/users')
  const isProjectsPublicRoute = currentPath === '/projects'

  // Redirect authenticated users away from auth pages (except password reset with token)
  if (isAuthenticated && isAuthRoute) {
    const isResetPassword = currentPath === '/auth/reset-password'
    const hasResetToken = event.url.searchParams.has('token')

    if (isResetPassword && hasResetToken) {
      // Allow password reset with valid token even if authenticated
      return { session, isAuthenticated, user }
    }

    redirect(303, '/dashboard')
  }

  // Redirect authenticated users from root to dashboard
  if (isAuthenticated && isRootRoute) {
    redirect(303, '/dashboard')
  }

  // Protect dashboard routes - require authentication
  if (!isAuthenticated && (isDashboardRoute || isUsersRoute || isProjectsPublicRoute)) {
    redirect(303, '/auth/login')
  }

  return { session, isAuthenticated, user }
}
