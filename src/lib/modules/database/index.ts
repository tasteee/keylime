// Client-side data access, backed by Convex. Function signatures and return
// shapes are kept identical to the previous Supabase implementation so callers
// (stores, components, pages) don't need to change.
import { warnWhen } from '$lib/modules/warnWhen'
import { convexQuery, convexMutation } from '$lib/convex'
import { api } from '$convex/_generated/api'

type GetUserReturnT = {
	user: UserT | null
	error: Error | null
	didSucceed: boolean
}

const asError = (error: unknown): Error => (error instanceof Error ? error : new Error(String(error)))

export const getUserById = async (id: string): Promise<GetUserReturnT> => {
	try {
		const user = (await convexQuery(api.users.getById, { id })) as UserT | null
		return { user, error: null, didSucceed: true }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching user by ID: ${wrapped.message}`)
		return { user: null, error: wrapped, didSucceed: false }
	}
}

export const deleteProjectById = async (projectId: string) => {
	try {
		await convexMutation(api.projects.remove, { id: projectId })
		return { error: null, didSucceed: true }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error deleting project by ID: ${wrapped.message}`)
		return { error: wrapped, didSucceed: false }
	}
}

export const addProject = async (project: ProjectT) => {
	try {
		const data = (await convexMutation(api.projects.add, { project })) as ProjectT
		return { data, error: null, didSucceed: true }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error adding project: ${wrapped.message}`)
		return { data: null as ProjectT | null, error: wrapped, didSucceed: false }
	}
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
	try {
		const data = (await convexQuery(api.projects.getById, { id: projectId })) as ProjectT | null
		warnWhen(!data, `Received no project by id: ${projectId}`)
		return { data, error: null as Error | null }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching project by ID: ${wrapped.message}`)
		return { data: null as ProjectT | null, error: wrapped }
	}
}

export const getProjectsByUserId = async (userId: string, limit: number = 20, offset: number = 0) => {
	try {
		const result = (await convexQuery(api.projects.getByUserId, { userId, limit, offset })) as {
			data: ProjectT[]
			totalCount: number
		}
		return { data: result.data, error: null as Error | null, totalCount: result.totalCount }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching projects by userId: ${wrapped.message}`)
		return { data: [] as ProjectT[], error: wrapped, totalCount: 0 }
	}
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

export const getPublicProjects = async (options: GetPublicProjectsOptionsT) => {
	try {
		// Drop undefined values so Convex validators (which reject `undefined`) are happy.
		const args = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
		const result = (await convexQuery(api.projects.getPublic, args)) as {
			data: ProjectT[]
			totalCount: number
		}
		return { data: result.data, error: null as Error | null, totalCount: result.totalCount }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching public projects: ${wrapped.message}`)
		return { data: [] as ProjectT[], error: wrapped, totalCount: 0 }
	}
}

type GetPublicUsersOptionsT = {
	sortBy?: 'updatedAt' | 'createdAt' | 'userName'
	sortOrder?: 'ascending' | 'descending'
	searchQuery?: string
}

export const getPublicUsers = async (options: GetPublicUsersOptionsT) => {
	try {
		const args = Object.fromEntries(Object.entries(options).filter(([, value]) => value !== undefined))
		const data = (await convexQuery(api.users.getPublicUsers, args)) as UserT[]
		return { data, error: null as Error | null }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching public users: ${wrapped.message}`)
		return { data: [] as UserT[], error: wrapped }
	}
}

export const getUserByUserName = async (userName: string) => {
	try {
		const data = (await convexQuery(api.users.getByUserName, { userName })) as UserT | null
		return { data, error: null as Error | null }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching user by userName: ${wrapped.message}`)
		return { data: null as UserT | null, error: wrapped }
	}
}

export const checkUsernameAvailable = async (userName: string): Promise<boolean> => {
	try {
		return (await convexQuery(api.users.isUserNameAvailable, { userName })) as boolean
	} catch {
		return false
	}
}

type UpdateUserProfileArgsT = {
	userId: string
	userName?: string
	bio?: string
	avatarUrl?: string
}

export const updateUserProfile = async (args: UpdateUserProfileArgsT) => {
	try {
		const patch: Record<string, unknown> = {}
		if (args.userName !== undefined) patch.userName = args.userName
		if (args.bio !== undefined) patch.bio = args.bio
		if (args.avatarUrl !== undefined) patch.avatarUrl = args.avatarUrl
		await convexMutation(api.users.updateProfile, patch)
		return { error: null as Error | null, didSucceed: true }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error updating user profile: ${wrapped.message}`)
		return { error: wrapped, didSucceed: false }
	}
}

export const getPublicProjectsByUserName = async (userName: string) => {
	try {
		const data = (await convexQuery(api.projects.getPublicByUserName, { userName })) as ProjectT[]
		return { data, error: null as Error | null }
	} catch (error) {
		const wrapped = asError(error)
		warnWhen(true, `Error fetching public projects by userName: ${wrapped.message}`)
		return { data: [] as ProjectT[], error: wrapped }
	}
}
