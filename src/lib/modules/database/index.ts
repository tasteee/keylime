import { createSupabaseClient } from "$lib/supabase/client"
import { warnWhen } from "$lib/modules/warnWhen"

type GetUserReturnT = {
  user: UserT | null
  error: Error | null
}

export const getUserById = async (id: string): Promise<GetUserReturnT> => {
  const supabase = createSupabaseClient()

  const result = await supabase
    .from('all_users')
    .select('*')
    .eq('id', id)
    .single()

  const user = result.data
  const error = result.error
  const hasError = !!error

  if (hasError) {
    const errorMessage = `Error fetching user by ID: ${error.message}`
    warnWhen(error, errorMessage)
  }

  return { user, error }
}


export const deleteProjectById = async (projectId: string) => {
  const supabase = createSupabaseClient()

  const { error } = await supabase
    .from('all_projects')
    .delete()
    .eq('id', projectId)

  warnWhen(error, `Error deleting project by ID: ${error?.message}`)
  return { error }
}

export const addProject = async (project: ProjectT) => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('all_projects')
    .insert(project as any)
    .select()
    .single()

  warnWhen(error, `Error adding project: ${error?.message}`)
  return { data: data as ProjectT | null, error }
}

export const getProjectById = async (projectId: string) => {
  const supabase = createSupabaseClient()

  const result = await supabase
    .from('all_projects')
    .select('*')
    .eq('id', projectId)
    .single()

  const data = result.data as ProjectT | null
  const error = result.error as Error | null
  if (!!error) warnWhen(error, `Error fetching project by ID: ${error.message}`)
  return { data, error }
}

export const getProjectsByUserId = async (userId: string) => {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase
    .from('all_projects')
    .select('*')
    .eq('userId', userId)
    .order('updatedAt', { ascending: false })

  warnWhen(error, `Error fetching public projects: ${error?.message}`)
  return { data, error }
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
}

export const getPublicProjects = async (options: GetPublicProjectsOptionsT) => {
  const finalOptions = { ...DEFAULT_GET_PUBLIC_PROJECTS_OPTIONS, ...options }
  const supabase = createSupabaseClient()

  let query = supabase
    .from('all_projects')
    .select(`*, user:all_users!userId ( userName, avatarUrl )`)
    .eq('isPublic', true)

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
    query = query.contains('chordSymbols', finalOptions.chordSymbols)
  }

  const sortByColumn = finalOptions.sortBy || 'updatedAt'
  const isAscending = finalOptions.sortOrder === 'ascending'
  query = query.order(sortByColumn, { ascending: isAscending })

  const result = await query
  const data = result.data
  const error = result.error
  warnWhen(error, `Error fetching public projects: ${error?.message}`)

  return { data, error }
}