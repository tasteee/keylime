const EMPTY_PROPS = { activeUser: null, projects: [] }

export const load = async (event) => {
	const user = event.locals.user

	// if (!user) return EMPTY_PROPS;
	const { data, error, count } = await event.locals.supabase
		.from('all_projects')
		.select('*', { count: 'exact' })
		.eq('userId', user.id)
		.order('updatedAt', { ascending: false })
		.range(0, 19)

	console.log('[dashboard/+page.server] Projects fetch:', {
		userId: user.id,
		count,
		dataLength: data?.length,
		error
	})

	return {
		activeUser: user,
		projects: data ?? []
	}
}
