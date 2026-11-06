import { goToPath } from '$lib/modules/navigate'
import { SIGNAL_ROWS } from "$lib/constants/signalRows"
import { deleteProjectById, getProjectById, saveProjectData } from "$lib/modules/database"

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
export const saveProject = async (project: ProjectT): Promise<{ data: ProjectT | null; error: Error | null }> => {
  const { data, error } = await saveProjectData(project)
  return { data, error }
}

export const deleteProject = async (id: string) => {
  return deleteProjectById(id)
}

export const goToProjectEditor = (id: string) => {
  goToPath(`/project/editor/${id}`)
}

export const loadProject = async (id: string): Promise<{ data: ProjectT | null; error: Error | null }> => {
  return getProjectById(id)
}
