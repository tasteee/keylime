import type { Handle } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import { getToken } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { withServerConvexToken } from '@mmailaender/convex-svelte/sveltekit/server';
import { serverConvex } from '$lib/server/convex';
import { api } from '$convex/_generated/api';

export const handle: Handle = async ({ event, resolve }) => {
  const token = getToken(event.cookies);
  event.locals.token = token;

  const currentPath = event.url.pathname;
  const isAuthRoute = currentPath.startsWith('/auth');
  const isRootRoute = currentPath === '/';
  const isDashboardRoute = currentPath.startsWith('/dashboard');
  const isUsersRoute = currentPath.startsWith('/users');
  const isProjectsPublicRoute = currentPath === '/projects';
  const isProjectRoute = currentPath.startsWith('/project/');

  const needsAuthDecision =
    isAuthRoute || isRootRoute || isDashboardRoute || isUsersRoute || isProjectsPublicRoute || isProjectRoute;

  // Only pay for an auth lookup on routes whose redirects depend on it.
  let isAuthenticated = false;
  if (needsAuthDecision && token) {
    try {
      const user = await serverConvex(token).query(api.auth.getCurrentUser, {});
      isAuthenticated = !!user;
    } catch {
      isAuthenticated = false;
    }
  }

  // Redirect authenticated users away from auth pages (except password reset with token).
  if (isAuthenticated && isAuthRoute) {
    const isResetPassword = currentPath === '/auth/reset-password';
    const hasResetToken = event.url.searchParams.has('token');
    if (!(isResetPassword && hasResetToken)) {
      redirect(303, '/dashboard');
    }
  }

  // Root routing.
  if (isAuthenticated && isRootRoute) redirect(303, '/dashboard');
  if (!isAuthenticated && isRootRoute) redirect(303, '/auth/login');

  // Protect app routes.
  if (!isAuthenticated && (isDashboardRoute || isUsersRoute || isProjectsPublicRoute || isProjectRoute)) {
    redirect(303, '/auth/login');
  }

  return withServerConvexToken(token, () => resolve(event));
};
