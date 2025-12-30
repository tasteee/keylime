import type { LayoutServerLoad } from './$types'
import { getUserById } from '$lib/modules/database'

export const load: LayoutServerLoad = async (event) => {
  const authUser = event.locals.user
  const isAuthenticated = !!authUser

  let activeUser: UserT | null = null
  if (authUser) {
    const userResult = await getUserById(authUser.id)
    activeUser = userResult.user
  }

  return { isAuthenticated, authUser, activeUser }
}
