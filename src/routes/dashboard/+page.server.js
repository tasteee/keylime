import { getUserById } from '$lib/modules/database'

export const load = async (event) => {
  const authUser = event.locals.user

  if (!authUser) {
    return { activeUser: null, projects: [] }
  }

  const userResult = await getUserById(authUser.id)
  const activeUser = userResult.user

  const { data, error, count } = await event.locals.supabase
    .from('all_projects')
    .select('*', { count: 'exact' })
    .eq('userId', authUser.id)
    .order('updatedAt', { ascending: false })
    .range(0, 19);

  console.log('[dashboard/+page.server] Projects fetch:', {
    userId: authUser.id,
    count,
    dataLength: data?.length,
    error
  });

  return {
    activeUser,
    projects: data ?? []
  };
}