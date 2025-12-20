import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import memoize from 'just-memoize';

export const createSupabaseClient = memoize(() => {
  if (!isBrowser()) throw new Error('createSupabaseClient should only be called in the browser')
  const client = createBrowserClient<DatabaseT>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY)
  console.log('Creating Supabase Browser Client', client)
  return client
})

// For use in hooks.server.ts
export const createSupabaseServerClient = (args: {
  cookies: {
    get: (key: string) => string | undefined
    set: (key: string, value: string, options: any) => void
    remove: (key: string, options: any) => void
  }
}) => {
  return createServerClient<DatabaseT>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      get: (key) => args.cookies.get(key),
      set: (key, value, options) => args.cookies.set(key, value, options),
      remove: (key, options) => args.cookies.remove(key, options)
    }
  })
}
