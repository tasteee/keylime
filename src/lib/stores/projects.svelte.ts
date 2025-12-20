import { browser } from '$app/environment'
import { createSupabaseClient } from '$lib/supabase/client'
import { authStore } from './auth.svelte'

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
    if (!authStore.authUser) return

    this.isLoading = true
    this.error = null

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('all_projects')
      .select('id, title, description, "updatedAt", bpm, key, scale, "userId", "isPublic"')
      .eq('userId', authStore.authUser.id)
      .order('updatedAt', { ascending: false })

    if (error) {
      this.error = error.message
      this.isLoading = false
      return
    }

    this.projects = (data || []).map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      updatedAt: new Date(p.updatedAt),
      bpm: p.bpm,
      key: p.key,
      scale: p.scale,
      userId: p.userId,
      isPublic: p.isPublic
    }))

    this.isLoading = false
  }

  addProject = (project: ProjectSummaryT) => {
    this.projects = [project, ...this.projects]
  }

  deleteProject = async (id: string) => {
    if (!authStore.authUser) {
      throw new Error('User must be authenticated to delete project')
    }

    const supabase = createSupabaseClient()

    const { error } = await supabase
      .from('all_projects')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete project: ${error.message}`)
    }

    this.projects = this.projects.filter((p) => p.id !== id)
    return { success: true }
  }

  createProject = async () => {
    if (!authStore.authUser) {
      throw new Error('User must be authenticated to create project')
    }

    const supabase = createSupabaseClient()

    const newProject = {
      userId: authStore.authUser.id,
      title: 'New Project',
      description: '',
      bpm: 120,
      key: 'C',
      scale: 'Major',
      octave: 3,
      minVelocity: 60,
      maxVelocity: 100,
      patternDurationBars: 1,
      isPublic: false,
      progressionChords: [],
      chordSymbols: [],
      patternSignals: [],
      patternSignalRows: {}
    }

    const { data, error } = await supabase
      .from('all_projects')
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
      updatedAt: new Date(data.updatedAt),
      bpm: data.bpm,
      key: data.key,
      scale: data.scale,
      userId: data.userId,
      isPublic: data.isPublic
    }

    this.addProject(projectSummary)
    return data.id
  }

  loadPublicProjects = async () => {
    this.isLoading = true
    this.error = null

    const supabase = createSupabaseClient()

    const { data, error } = await supabase
      .from('all_projects')
      .select('id, title, description, "updatedAt", bpm, key, scale, "userId", "isPublic"')
      .eq('isPublic', true)
      .order('updatedAt', { ascending: false })
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
      updatedAt: new Date(p.updatedAt),
      bpm: p.bpm,
      key: p.key,
      scale: p.scale,
      userId: p.userId,
      isPublic: p.isPublic
    }))
  }
}

const projectsStore = new ProjectsStore()
export default projectsStore
