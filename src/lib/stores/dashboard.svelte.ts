import { SIGNAL_ROWS } from '$lib/constants/signalRows'
import { addProject, deleteProjectById, getProjectsByUserId } from '$lib/modules/database'
import { createNewProjectData, getFreshPatternSignalRows } from '$lib/modules/projects'
import { authStore } from './auth.svelte'
import { calculateStartTimes } from '$lib/helpers/progression'

class DashboardStore {
  userProjects = $state<ProjectT[]>([])
  isLoadingUserProjects = $state(false)
  error = $state<string | null>(null)
  totalProjectsCount = $state(0)

  loadUserProjects = async (limit: number = 20, offset: number = 0) => {
    if (!authStore.authUser) return
    this.isLoadingUserProjects = true
    this.error = null

    const results = await getProjectsByUserId(authStore.authUser.id, limit, offset)
    const projects = (results.data || []) as ProjectT[]

    if (results.error) {
      this.error = results.error.message
      this.isLoadingUserProjects = false
      return
    }

    this.totalProjectsCount = results.totalCount || 0

    this.userProjects = projects.map((project) => {
      // Parse JSON fields from database
      const parsedProgressionChords = typeof project.progressionChords === 'string'
        ? JSON.parse(project.progressionChords)
        : project.progressionChords

      // Calculate startTime for each chord based on cumulative durations
      const progressionChordsWithStartTime = calculateStartTimes({ items: parsedProgressionChords })

      return {
        ...project,
        updatedAt: new Date(project.updatedAt),
        createdAt: new Date(project.createdAt),
        octave: String(project.octave),
        progressionChords: progressionChordsWithStartTime,
        patternSignals: typeof project.patternSignals === 'string'
          ? JSON.parse(project.patternSignals)
          : project.patternSignals,
        patternSignalRows: typeof project.patternSignalRows === 'string'
          ? JSON.parse(project.patternSignalRows)
          : project.patternSignalRows,
      }
    })

    this.isLoadingUserProjects = false
  }

  deleteUserProject = async (id: string) => {
    await deleteProjectById(id)
    this.loadUserProjects()
  }

  createUserProject = async () => {
    if (!authStore.authUser) return
    const userId = authStore.authUser.id
    const newProjectData = createNewProjectData(userId)
    const result = await addProject(newProjectData)
    if (!result.data) return
    const project = result.data as ProjectT
    this.loadUserProjects()
    return project
  }

  cloneProject = async (projectId: string) => {
    if (!authStore.authUser) return

    let sourceProject = this.userProjects.find(project => project.id === projectId)

    if (!sourceProject) {
      const { getProjectById } = await import('$lib/modules/database')
      const result = await getProjectById(projectId)
      if (result.error || !result.data) return
      sourceProject = result.data as ProjectT
    }

    const clonedProject = {
      ...sourceProject,
      id: crypto.randomUUID(),
      userId: authStore.authUser.id,
      title: `${sourceProject.title} (Clone)`,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as ProjectT

    const result = await addProject(clonedProject)
    if (!result.data) return

    const project = result.data as ProjectT
    await this.loadUserProjects()
    return project
  }
}

const dashboardStore = new DashboardStore()
export default dashboardStore
