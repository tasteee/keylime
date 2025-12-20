import { browser } from '$app/environment'
import { createSupabaseClient } from '$lib/supabase/client'
import authStore from './auth.svelte'

export type ProjectSummaryT = {
  id: string
  title: string
  description: string
  updatedAt: Date
  bpm: number
  key: string
  scale: string
  userId: string
  isPublic: boolean
}

class ProjectsStore {
  projects = $state<ProjectSummaryT[]>([])
  isLoading = $state(false)
  error = $state<string | null>(null)

  loadProjects = async () => {
    if (!authStore.user) return

    this.isLoading = true
    this.error = null

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, updated_at, bpm, key, scale, user_id, is_public')
      .eq('user_id', authStore.user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      this.error = error.message
      this.isLoading = false
      return
    }

    this.projects = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      updatedAt: new Date(p.updated_at),
      bpm: p.bpm,
      key: p.key,
      scale: p.scale,
      userId: p.user_id,
      isPublic: p.is_public
    }))

    this.isLoading = false
  }

  addProject = (project: ProjectSummaryT) => {
    this.projects = [project, ...this.projects]
  }

  deleteProject = async (id: string) => {
    if (!authStore.user) {
      throw new Error('User must be authenticated to delete project')
    }

    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    this.projects = this.projects.filter((p) => p.id !== id)
    return { success: true }
  }

  createProject = async () => {
    if (!authStore.user) {
      throw new Error('User must be authenticated to create project')
    }

    const supabase = createSupabaseClient()

    const newProject = {
      user_id: authStore.user.id,
      title: 'New Project',
      description: '',
      bpm: 120,
      key: 'C',
      scale: 'Major',
      octave: 3,
      min_velocity: 60,
      max_velocity: 100,
      pattern_duration_bars: 1,
      is_public: false
    }

    const { data, error } = await supabase
      .from('projects')
      .insert(newProject)
      .select()
      .single()

    if (error || !data) {
      throw new Error(`Failed to create project: ${error?.message || 'Unknown error'}`)
    }

    const projectSummary: ProjectSummaryT = {
      id: data.id,
      title: data.title,
      description: data.description,
      updatedAt: new Date(data.updated_at),
      bpm: data.bpm,
      key: data.key,
      scale: data.scale,
      userId: data.user_id,
      isPublic: data.is_public
    }

    this.addProject(projectSummary)
    return data.id
  }

  loadPublicProjects = async () => {
    this.isLoading = true
    this.error = null

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, description, updated_at, bpm, key, scale, user_id, is_public')
      .eq('is_public', true)
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      this.error = error.message
      this.isLoading = false
      return []
    }

    this.isLoading = false

    return (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      updatedAt: new Date(p.updated_at),
      bpm: p.bpm,
      key: p.key,
      scale: p.scale,
      userId: p.user_id,
      isPublic: p.is_public
    }))
  }
}

const projectsStore = new ProjectsStore()
export default projectsStore
