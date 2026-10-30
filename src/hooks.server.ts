import type { Handle } from '@sveltejs/kit';
import { json, redirect } from '@sveltejs/kit';
import { getSessionUser } from '$lib/server/auth';

const checkIsSameOrigin = (request: Request, url: URL): boolean => {
  return request.headers.get('origin') === url.origin;
};

export const handle: Handle = async ({ event, resolve }) => {
  const currentPath = event.url.pathname;
  const database = event.platform?.env.DB;
  const hasCookie = !!event.cookies.get('keylime_session');

  // No cookie means no database read.
  event.locals.user = database && hasCookie ? await getSessionUser(database, event.cookies) : null;

  // Writes must come from Keylime itself. With SameSite cookies
  // this closes cross-site request forgery.
  const isApiWrite = currentPath.startsWith('/api/') && event.request.method !== 'GET';
  if (isApiWrite && !checkIsSameOrigin(event.request, event.url)) {
    return json({ error: 'bad-origin' }, { status: 403 });
  }

  const isAuthenticated = !!event.locals.user;
  const isAuthRoute = currentPath.startsWith('/auth');
  const isRootRoute = currentPath === '/';
  const isDashboardRoute = currentPath.startsWith('/dashboard');
  const isUsersRoute = currentPath.startsWith('/users');
  const isProjectsPublicRoute = currentPath === '/projects';
  const isProjectRoute = currentPath.startsWith('/project/');

  if (isAuthenticated && (isAuthRoute || isRootRoute)) redirect(303, '/dashboard');
  if (!isAuthenticated && isRootRoute) redirect(303, '/auth/login');

  const isProtectedRoute = isDashboardRoute || isUsersRoute || isProjectsPublicRoute || isProjectRoute;
  if (!isAuthenticated && isProtectedRoute) redirect(303, '/auth/login');

  return resolve(event);
};
