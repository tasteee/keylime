import type { LayoutServerLoad } from './$types'

export const load: LayoutServerLoad = async (event) => {
  const user = event.locals.user
  const isAuthenticated = !!user

  return { isAuthenticated, user }
}
