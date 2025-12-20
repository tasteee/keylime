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