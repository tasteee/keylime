import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { redirect } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' });
        });
      }
    }
  });

  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser();

  event.locals.user = user;

  const isAuthenticated = !!user;
  const currentPath = event.url.pathname;

  console.log('[hooks.server] Request:', {
    path: currentPath,
    isAuthenticated,
    userId: user?.id,
    email: user?.email
  });

  const isAuthRoute = currentPath.startsWith('/auth');
  const isRootRoute = currentPath === '/';
  const isDashboardRoute = currentPath.startsWith('/dashboard');
  const isUsersRoute = currentPath.startsWith('/users');
  const isProjectsPublicRoute = currentPath === '/projects';
  const isProjectRoute = currentPath.startsWith('/project/');

  // Redirect authenticated users away from auth pages (except password reset with token)
  if (isAuthenticated && isAuthRoute) {
    const isResetPassword = currentPath === '/auth/reset-password';
    const hasResetToken = event.url.searchParams.has('token');

    if (isResetPassword && hasResetToken) {
      console.log('[hooks.server] Allowing password reset with token');
      return resolve(event);
    }

    console.log('[hooks.server] Redirecting authenticated user from auth page to /dashboard');
    redirect(303, '/dashboard');
  }

  // Redirect authenticated users from root to dashboard
  if (isAuthenticated && isRootRoute) {
    console.log('[hooks.server] Redirecting authenticated user from / to /dashboard');
    redirect(303, '/dashboard');
  }

  if (!isAuthenticated && isRootRoute) {
    console.log('[hooks.server] Redirecting unauthenticated user from / to /auth/login');
    redirect(303, '/auth/login');
  }

  // Protect dashboard routes - require authentication
  if (!isAuthenticated && (isDashboardRoute || isUsersRoute || isProjectsPublicRoute || isProjectRoute)) {
    console.log('[hooks.server] Redirecting unauthenticated user from protected route to /auth/login');
    redirect(303, '/auth/login');
  }

  console.log('[hooks.server] Allowing request to proceed');
  return resolve(event);
};
