// TODO: Break into modular function/files.
import { warnWhen } from '$lib/modules/warnWhen'
import { supabase } from '$lib/supabase/client'

type GetUserReturnT = {
	user: UserT | null
	error: Error | null
	didSucceed: boolean
}

export const getUserById = async (id: string): Promise<GetUserReturnT> => {
	const result = await supabase.from('all_users').select('*').eq('id', id).single()

	const user = result.data
	const error = result.error
	const hasError = !!error

	if (hasError) {
		const errorMessage = `Error fetching user by ID: ${error.message}`
		warnWhen(error, errorMessage)
	}

	return { user, error, didSucceed: !error }
}

export const deleteProjectById = async (projectId: string) => {
	const { error } = await supabase.from('all_projects').delete().eq('id', projectId)

	warnWhen(error, `Error deleting project by ID: ${error?.message}`)
	return { error, didSucceed: !error }
}

export const addProject = async (project: ProjectT) => {
	const { data, error } = await supabase
		.from('all_projects')
		.insert(project as any)
		.select()
		.single()

	warnWhen(error, `Error adding project: ${error?.message}`)
	return { data: data as ProjectT | null, error, didSucceed: !error }
}

export const cloneProjectById = async (projectId: string, currentUserId: string) => {
	const fetchResult = await getProjectById(projectId)

	if (fetchResult.error || !fetchResult.data) {
		warnWhen(true, `Error fetching project to clone: ${fetchResult.error?.message}`)
		return { data: null, error: fetchResult.error, didSucceed: false }
	}

	const sourceProject = fetchResult.data
	const clonedProject = {
		...sourceProject,
		id: crypto.randomUUID(),
		userId: currentUserId,
		title: `${sourceProject.title} (Clone)`,
		createdAt: new Date(),
		updatedAt: new Date()
	} as ProjectT

	const insertResult = await addProject(clonedProject)

	if (insertResult.error || !insertResult.data) {
		warnWhen(true, `Error saving cloned project: ${insertResult.error?.message}`)
		return { data: null, error: insertResult.error, didSucceed: false }
	}

	return { data: insertResult.data, error: null, didSucceed: true }
}

export const getProjectById = async (projectId: string) => {
	const result = await supabase.from('all_projects').select('*').eq('id', projectId).single()

	const data = result.data as ProjectT | null
	const error = result.error as Error | null
	warnWhen(!data, `Received no project by id: ${projectId}`)
	warnWhen(error, `Error fetching project by ID: ${error?.message}`)
	console.log('getProjectById result:', { data, error })
	return { data, error }
}

export const getProjectsByUserId = async (userId: string, limit: number = 20, offset: number = 0) => {
	const { data, error, count } = await supabase
		.from('all_projects')
		.select('*', { count: 'exact' })
		.eq('userId', userId)
		.order('updatedAt', { ascending: false })
		.range(offset, offset + limit - 1)

	console.info(`getProjectsByUserId | fetched projects for userId=${userId}:`, { error, count })
	return { data, error, totalCount: count ?? 0 }
}

type GetPublicProjectsOptionsT = {
	sortBy?: 'updatedAt' | 'createdAt' | 'title' | 'scale' | 'bpm' | 'userName'
	sortOrder?: 'ascending' | 'descending'
	key?: string
	scale?: string
	minBpm?: number
	maxBpm?: number
	searchQuery?: string
	chordSymbols?: string[]
	chordMatchMode?: 'all' | 'any'
	limit?: number
	offset?: number
}

const DEFAULT_GET_PUBLIC_PROJECTS_OPTIONS: GetPublicProjectsOptionsT = {
	sortBy: 'updatedAt',
	sortOrder: 'descending',
	key: undefined,
	scale: undefined,
	minBpm: undefined,
	maxBpm: undefined,
	searchQuery: undefined,
	chordSymbols: undefined,
	chordMatchMode: 'any',
	limit: 20,
	offset: 0
}

export const getPublicProjects = async (options: GetPublicProjectsOptionsT) => {
	const finalOptions = { ...DEFAULT_GET_PUBLIC_PROJECTS_OPTIONS, ...options }

	let query = supabase.from('all_projects').select(`*, user:all_users!userId ( userName, avatarUrl )`).eq('isPublic', true)

	console.log('finalOptions', finalOptions)

	if (!!finalOptions.key) {
		query = query.eq('key', finalOptions.key)
	}

	if (!!finalOptions.scale) {
		query = query.eq('scale', finalOptions.scale)
	}

	if (finalOptions.minBpm !== undefined) {
		query = query.gte('bpm', finalOptions.minBpm)
	}

	if (finalOptions.maxBpm !== undefined) {
		query = query.lte('bpm', finalOptions.maxBpm)
	}

	if (!!finalOptions.searchQuery) {
		query = query.or(`title.ilike.%${finalOptions.searchQuery}%,description.ilike.%${finalOptions.searchQuery}%`)
	}

	if (Array.isArray(finalOptions.chordSymbols) && finalOptions.chordSymbols!.length > 0) {
		const isMatchAll = finalOptions.chordMatchMode === 'all'

		if (isMatchAll) {
			query = query.contains('chordSymbols', finalOptions.chordSymbols)
		}
		if (!isMatchAll) {
			query = query.overlaps('chordSymbols', finalOptions.chordSymbols)
		}
	}

	const sortByColumn = finalOptions.sortBy || 'updatedAt'
	const isAscending = finalOptions.sortOrder === 'ascending'
	query = query.order(sortByColumn, { ascending: isAscending })

	const limitValue = finalOptions.limit ?? 20
	const offsetValue = finalOptions.offset ?? 0
	query = query.range(offsetValue, offsetValue + limitValue - 1)

	const result = await query
	const data = result.data
	const error = result.error

	warnWhen(error, `Error fetching public projects: ${error?.message}`)
	warnWhen(!data, `No public projects found with the given filters.`)

	const countQuery = supabase.from('all_projects').select('id', { count: 'exact', head: true }).eq('isPublic', true)

	const countResult = await countQuery
	const totalCount = countResult.count ?? 0

	console.log(`getPublicProjects | got ${totalCount}`)
	return { data, error, totalCount }
}

type GetPublicUsersOptionsT = {
	sortBy?: 'updatedAt' | 'createdAt' | 'userName'
	sortOrder?: 'ascending' | 'descending'
	searchQuery?: string
}

const DEFAULT_GET_PUBLIC_USERS_OPTIONS: GetPublicUsersOptionsT = {
	sortBy: 'createdAt',
	sortOrder: 'descending',
	searchQuery: undefined
}

export const getPublicUsers = async (options: GetPublicUsersOptionsT) => {
	const finalOptions = { ...DEFAULT_GET_PUBLIC_USERS_OPTIONS, ...options }

	let query = supabase.from('all_users').select('*')

	if (!!finalOptions.searchQuery) {
		query = query.or(`userName.ilike.%${finalOptions.searchQuery}%,bio.ilike.%${finalOptions.searchQuery}%`)
	}

	const sortByColumn = finalOptions.sortBy || 'createdAt'
	const isAscending = finalOptions.sortOrder === 'ascending'
	query = query.order(sortByColumn, { ascending: isAscending })

	const result = await query
	const data = result.data
	const error = result.error
	warnWhen(error, `Error fetching public users: ${error?.message}`)

	return { data, error }
}

export const getUserByUserName = async (userName: string) => {
	const result = await supabase.from('all_users').select('*').eq('userName', userName).single()

	const data = result.data as UserT | null
	const error = result.error as Error | null
	if (!!error) warnWhen(error, `Error fetching user by userName: ${error.message}`)
	return { data, error }
}

export const checkUsernameAvailable = async (userName: string): Promise<boolean> => {
	const result = await getUserByUserName(userName)
	const isNotFound = result.error && result.error.message.includes('multiple (or no) rows')
	const isAvailable = !result.data || !!isNotFound
	return isAvailable
}

type UpdateUserProfileArgsT = {
	userId: string
	userName?: string
	bio?: string
	avatarUrl?: string
}

export const updateUserProfile = async (args: UpdateUserProfileArgsT) => {
	const updateData: Partial<UserT> = {}
	if (args.userName !== undefined) updateData.userName = args.userName
	if (args.bio !== undefined) updateData.bio = args.bio
	if (args.avatarUrl !== undefined) updateData.avatarUrl = args.avatarUrl

	const { error } = await supabase
		.from('all_users')
		// @ts-ignore - Supabase type generation issue
		.update(updateData)
		.eq('id', args.userId)

	if (!!error) warnWhen(error, `Error updating user profile: ${error.message}`)
	return { error, didSucceed: !error }
}

export const getPublicProjectsByUserName = async (userName: string) => {
	const { data, error } = await supabase
		.from('all_projects')
		.select(`*, user:all_users!userId ( userName, avatarUrl )`)
		.eq('isPublic', true)
		.eq('user.userName', userName)
		.order('updatedAt', { ascending: false })

	warnWhen(error, `Error fetching public projects by userName: ${error?.message}`)
	return { data, error }
}
