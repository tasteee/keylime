import { SIGNAL_ROWS } from '$lib/constants/signalRows'
import { addProject, deleteProjectById, getProjectsByUserId } from '$lib/modules/database'
import { authStore } from './auth.svelte'

class DashboardStore {
  userProjects = $state<ProjectT[]>([])
  isLoadingUserProjects = $state(false)
  error = $state<string | null>(null)

  loadUserProjects = async () => {
    if (!authStore.authUser) return
    this.isLoadingUserProjects = true
    this.error = null

    const results = await getProjectsByUserId(authStore.authUser.id)
    const projects = (results.data || []) as ProjectT[]

    if (results.error) {
      this.error = results.error.message
      this.isLoadingUserProjects = false
      return
    }

    this.userProjects = projects.map((project) => {
      // Parse JSON fields from database
      const parsedProgressionChords = typeof project.progressionChords === 'string'
        ? JSON.parse(project.progressionChords)
        : project.progressionChords

      // Calculate startTime for each chord based on cumulative durations
      let accumulatedStartTime = 0
      const progressionChordsWithStartTime = parsedProgressionChords.map((chord: ProgressionChordT) => {
        const startTime = accumulatedStartTime
        accumulatedStartTime += chord.durationBeats
        return {
          ...chord,
          startTime
        }
      })

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

    const newProject = {
      userId: authStore.authUser.id,
      title: 'New Project',
      description: '',
      bpm: 124,
      key: 'C',
      scale: 'Major',
      octave: 3,
      minVelocity: 70,
      maxVelocity: 80,
      patternDurationBars: 1,
      isPublic: false,
      progressionChords: [],
      chordSymbols: [],
      patternSignals: [],
      patternSignalRows: JSON.parse(JSON.stringify(SIGNAL_ROWS))
    } as unknown as ProjectT

    const result = await addProject(newProject)
    if (!result.data) return
    const project = result.data as ProjectT
    this.loadUserProjects()
    return project
  }
}

const dashboardStore = new DashboardStore()
export default dashboardStore
