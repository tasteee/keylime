// Browser-side data access. Every call goes to the /api routes,
// which read and write D1. Return shapes match what pages expect.
import { warnWhen } from "$lib/modules/warnWhen"
import { callApi } from "$lib/modules/api"

const toQuery = (params: Record<string, unknown>): string => {
  const search = new URLSearchParams()
  for (const [name, value] of Object.entries(params)) {
    const isEmpty = value === undefined || value === null || value === ''
    if (isEmpty) continue
    search.set(name, Array.isArray(value) ? value.join(',') : String(value))
  }
  const text = search.toString()
  return text ? `?${text}` : ''
}

// ---------- projects ----------

export const deleteProjectById = async (projectId: string) => {
  const result = await callApi(`/api/projects/${projectId}`, { method: 'DELETE' })
  warnWhen(result.error, `Error deleting project by ID: ${result.error?.message}`)
  return { error: result.error, didSucceed: !result.error }
}

// Creates the project, or updates it when it is the caller's own.
export const saveProjectData = async (project: ProjectT) => {
  const result = await callApi<{ data: ProjectT }>(`/api/projects/${project.id}`, { method: 'PUT', body: JSON.stringify(project) })
  warnWhen(result.error, `Error saving project: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error, didSucceed: !result.error }
}

export const addProject = async (project: ProjectT) => {
  const result = await callApi<{ data: ProjectT }>('/api/projects', { method: 'POST', body: JSON.stringify(project) })
  warnWhen(result.error, `Error adding project: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error, didSucceed: !result.error }
}

export const cloneProjectById = async (projectId: string, _currentUserId?: string) => {
  const result = await callApi<{ data: ProjectT }>(`/api/projects/${projectId}/clone`, { method: 'POST' })
  warnWhen(result.error, `Error cloning project: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error, didSucceed: !result.error }
}

export const getProjectById = async (projectId: string) => {
  const result = await callApi<{ data: ProjectT }>(`/api/projects/${projectId}`)
  warnWhen(result.error, `Error fetching project by ID: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error }
}

// The signed-in user's own projects.
export const getProjectsByUserId = async (_userId: string, limit: number = 20, offset: number = 0) => {
  const result = await callApi<{ data: ProjectT[]; totalCount: number }>(`/api/projects${toQuery({ mine: 1, limit, offset })}`)
  return { data: result.data?.data ?? null, error: result.error, totalCount: result.data?.totalCount ?? 0 }
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
  const result = await callApi<{ data: ProjectT[]; totalCount: number }>(`/api/projects${toQuery(options)}`)
  warnWhen(result.error, `Error fetching public projects: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error, totalCount: result.data?.totalCount ?? 0 }
}

export const getPublicProjectsByUserName = async (userName: string) => {
  const result = await callApi<{ projects: ProjectT[] }>(`/api/users/${encodeURIComponent(userName)}`)
  return { data: result.data?.projects ?? null, error: result.error }
}

// ---------- users ----------

type GetPublicUsersOptionsT = {
  sortBy?: 'updatedAt' | 'createdAt' | 'userName'
  sortOrder?: 'ascending' | 'descending'
  searchQuery?: string
}

export const getPublicUsers = async (options: GetPublicUsersOptionsT) => {
  const result = await callApi<{ data: UserT[] }>(`/api/users${toQuery(options)}`)
  warnWhen(result.error, `Error fetching public users: ${result.error?.message}`)
  return { data: result.data?.data ?? null, error: result.error }
}

export const getUserByUserName = async (userName: string) => {
  const result = await callApi<{ user: UserT }>(`/api/users/${encodeURIComponent(userName)}`)
  return { data: result.data?.user ?? null, error: result.error }
}

type UpdateUserProfileArgsT = {
  userId?: string
  userName?: string
  bio?: string
  avatarUrl?: string
}

export const updateUserProfile = async (args: UpdateUserProfileArgsT) => {
  const { userId: _userId, ...fields } = args
  const result = await callApi('/api/me', { method: 'PATCH', body: JSON.stringify(fields) })
  warnWhen(result.error, `Error updating user profile: ${result.error?.message}`)
  return { error: result.error, didSucceed: !result.error }
}
