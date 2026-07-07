import { goto } from "$app/navigation"
import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { convexQuery, convexMutation } from "$lib/convex"
import { api } from "$convex/_generated/api"

export const getFreshPatternSignalRows = () => {
  return JSON.parse(JSON.stringify(SIGNAL_ROWS))
}

// can create a new project data from scratch (just needing the userId to assign it to)
// or can derive the new project data from an existing project / offer flexibility with overrides.
export const createNewProjectData = (userId: string, overrides: Partial<ProjectT> = {}): ProjectT => {
  const progressionChords = overrides.progressionChords ?? []
  const progressionDurationBars = calculateProgressionDurationBars(progressionChords)

  const newProject = {
    id: crypto.randomUUID(),
    userId: overrides.userId ?? userId,
    title: overrides.title ?? 'New Project',
    description: overrides.description ?? '',
    bpm: overrides.bpm ?? 124,
    key: overrides.key ?? 'C',
    scale: overrides.scale ?? 'Major',
    octave: overrides.octave ?? '3',
    minVelocity: overrides.minVelocity ?? 70,
    maxVelocity: overrides.maxVelocity ?? 80,
    patternDurationBars: overrides.patternDurationBars ?? 1,
    isPublic: overrides.isPublic ?? false, // TODO: Once public, cant make private??? Or is that not ok?
    progressionDurationBars: overrides.progressionDurationBars ?? progressionDurationBars,
    progressionChords,
    chordSymbols: overrides.chordSymbols ?? [],
    patternSignals: overrides.patternSignals ?? [],
    patternSignalRows: overrides.patternSignalRows ?? getFreshPatternSignalRows(), // TODO: Eliminate necessity for patternSignalRows.
    progressionZoomLevel: overrides.progressionZoomLevel ?? 82,
    patternZoomLevel: overrides.patternZoomLevel ?? 32,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  return newProject
}

const calculateProgressionDurationBars = (progressionChords: ProgressionItemT[]): number => {
  const hasNoChords = progressionChords.length === 0
  if (hasNoChords) return 0
  const totalBeats = progressionChords.reduce((total, item) => total + item.durationBeats, 0)
  const totalBars = totalBeats / 4
  return totalBars
}

// update title, override userId. allow flexibility for other overrides.
export const createClonedProjectData = (userId: string, overrides: Partial<ProjectT> = {}): ProjectT => {
  const newTitle = `${overrides.title} (Clone)`
  const clonedProject = createNewProjectData(userId, { ...overrides, title: newTitle })
  return clonedProject
}

// overwrite or create a new project in the database.
// Returns a Supabase-style { data: [row], error } shape so existing callers
// (ContextFrame) keep working unchanged.
export const saveProject = async (project: ProjectT): Promise<any> => {
  try {
    const row = await convexMutation(api.projects.save, { project })
    return { data: [row], error: null }
  } catch (error) {
    console.error('Error in saveProject:', error)
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export const deleteProject = async (id: string) => {
  try {
    await convexMutation(api.projects.remove, { id })
    return { data: null, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export const goToProjectEditor = (id: string) => {
  goto(`/project/editor/${id}`)
}

// Returns a Supabase-style { data, error } shape (ContextFrame reads .data / .error).
export const loadProject = async (id: string): Promise<any> => {
  try {
    const data = await convexQuery(api.projects.getById, { id })
    return { data, error: null }
  } catch (error) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}