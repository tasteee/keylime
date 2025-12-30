import { getContext } from 'svelte'

export const useActiveUser = (): UserT | null => {
  const getActiveUser = getContext<() => UserT | null>('activeUser')
  if (!getActiveUser) return null
  return getActiveUser()
}

export const useAuthUser = () => {
  const getAuthUser = getContext<() => any>('authUser')
  if (!getAuthUser) return null
  return getAuthUser()
}
